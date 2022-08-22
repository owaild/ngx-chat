import {JID} from '@xmpp/jid';
import {BehaviorSubject, Subject} from 'rxjs';
import {LogInRequest} from '../../../../core/log-in-request';
import {LogService} from './log.service';
import {Strophe} from 'strophe.js';
import {ChatConnection, ChatConnectionFactory} from '../interface/chat-connection';
import {StropheStanzaBuilder} from '../strophe-stanza-builder';
import {StropheConnection} from '../strophe-connection';
import {filter} from 'rxjs/operators';
import {XmppResponseError} from '../shared/xmpp-response.error';
import {ConnectionStates} from '../interface/chat.service';

export class StropheChatConnectionFactory implements ChatConnectionFactory {
    create(logService: LogService,
           afterReceiveMessageSubject: Subject<Element>,
           afterSendMessageSubject: Subject<Element>,
           beforeSendMessageSubject: Subject<Element>,
           onBeforeOnlineSubject: Subject<string>,
           onOnlineSubject: Subject<void>,
           onOfflineSubject: Subject<void>
    ): ChatConnection {
        return new StropheConnectionService(
            logService,
            afterReceiveMessageSubject,
            afterSendMessageSubject,
            beforeSendMessageSubject,
            onBeforeOnlineSubject,
            onOnlineSubject,
            onOfflineSubject
        );
    }
}

export type ConnectionUrls = { domain: string, boshServiceUrl?: string, websocketUrl?: string };

export function getConnectionsUrls({service, domain}: Pick<LogInRequest, 'service' | 'domain'>): ConnectionUrls {
    const isWebsocket = /wss?:\/\//.test(service);

    return {
        domain: domain,
        boshServiceUrl: isWebsocket ? undefined : service,
        websocketUrl: isWebsocket ? service : undefined,
    };
}

const errorMessages = {
    [Strophe.Status.ERROR]: 'An error occurred connecting',
    [Strophe.Status.CONNFAIL]: 'The connection failed',
    [Strophe.Status.AUTHFAIL]: 'The authentication failed',
    [Strophe.Status.CONNTIMEOUT]: 'The connection timed out',
};

/**
 * Implementation of the XMPP specification according to RFC 6121.
 * @see https://xmpp.org/rfcs/rfc6121.html
 * @see https://xmpp.org/rfcs/rfc3920.html
 * @see https://xmpp.org/rfcs/rfc3921.html
 */
export class StropheConnectionService implements ChatConnection {

    private readonly userJidSubject = new BehaviorSubject<string>(null);
    readonly userJid$ = this.userJidSubject.pipe(filter(jid => jid != null));

    private readonly stanzaUnknownSubject = new Subject<Element>();
    readonly stanzaUnknown$ = this.stanzaUnknownSubject.asObservable();

    private readonly stateSubject = new BehaviorSubject<ConnectionStates>('disconnected');
    readonly state$ = this.stateSubject.asObservable();

    /**
     * User JID with resource, not bare.
     */
    userJid?: JID;
    connection?: Strophe.Connection;

    constructor(
        protected readonly logService: LogService,
        protected readonly afterReceiveMessageSubject: Subject<Element>,
        protected readonly afterSendMessageSubject: Subject<Element>,
        protected readonly beforeSendMessageSubject: Subject<Element>,
        protected readonly onBeforeOnlineSubject: Subject<string>,
        protected readonly onOnlineSubject: Subject<void>,
        protected readonly onOfflineSubject: Subject<void>,
    ) {
    }

    addHandler(handler: (stanza: Element) => boolean, identifier?: { ns?: string, name?: string, type?: string, id?: string, from?: string }, options?: { matchBareFromJid: boolean, ignoreNamespaceFragment: boolean }) {
        if (!identifier) {
            return this.connection.addHandler(handler);
        }

        const {ns, name, type, id, from} = identifier;
        return this.connection.addHandler(handler, ns, name, type, id, from, options);
    }

    deleteHandler(handlerRef: object) {
        this.connection.deleteHandler(handlerRef as Strophe.Handler);
    }

    onOnline(jid: JID): void {
        this.logService.info('online =', 'online as', jid.toString());
        this.userJid = jid;
        this.userJidSubject.next(jid.toString());
        this.stateSubject.next('online');
        this.onOnlineSubject.next();
    }

    protected onOffline(): void {
        this.onOfflineSubject.next();
    }

    /*** TODO: reuse client for same Domain **/
    async logIn(logInRequest: LogInRequest): Promise<void> {
        if (logInRequest.username.indexOf('@') > -1) {
            this.logService.warn('username should not contain domain, only local part, this can lead to errors!');
        }
        const jid = logInRequest.username + '@' + logInRequest.domain;
        const connectionURLs = getConnectionsUrls(logInRequest);
        this.connection = await StropheConnection.createConnection(this.logService, connectionURLs);
        return new Promise((resolve, reject) => {
            this.connection.connect(jid, logInRequest.password, this.createConnectionStatusHandler(logInRequest.username, logInRequest.domain, resolve, reject));
            this.connection.addHandler((el) => {
                this.afterReceiveMessageSubject.next(el);
                return true;
            }, null, 'message');
        });
    }

    createConnectionStatusHandler(username: string, domain: string, resolve: () => void, reject: (reason?: string) => void) {
        return (status: Strophe.Status, value: string) => {
            this.logService.info('status update =', status, value ? JSON.stringify(value) : '');

            switch (status) {
                case Strophe.Status.REDIRECT:
                case Strophe.Status.ATTACHED:
                case Strophe.Status.CONNECTING:
                    break;
                case Strophe.Status.AUTHENTICATING:
                    break;
                case Strophe.Status.CONNECTED:
                    this.onBeforeOnlineSubject.next(`${username}@${domain}`);
                    this.onOnline(new JID(username, domain));
                    resolve();
                    break;
                case Strophe.Status.ERROR:
                case Strophe.Status.CONNFAIL:
                case Strophe.Status.AUTHFAIL:
                case Strophe.Status.CONNTIMEOUT:
                    this.stateSubject.next('disconnected');
                    this.onOffline();
                    reject(`${errorMessages[status]}, failed with status code: ${status}`);
                    break;
                case Strophe.Status.BINDREQUIRED:
                    this.connection.bind();
                    break;
                case Strophe.Status.DISCONNECTING:
                case Strophe.Status.DISCONNECTED:
                    this.onOffline();
                    break;
                default:
                    this.logService.error('Unhandled connection status: ', status);
            }
        };
    }

    async logOut(): Promise<void> {
        this.logService.debug('logging out');
        try {
            await this.$pres({type: 'unavailable'}).send();
            this.stateSubject.next('disconnected'); // after last send
            this.connection.disconnect('regular logout');
            this.connection.reset();
        } catch (e) {
            this.logService.error('error sending presence unavailable');
        }
        this.onOffline();
    }

    reconnectSilently(): void {
        this.logService.warn('hard reconnect...');
        this.stateSubject.next('disconnected');
        this.connection.restore();
    }

    private $build(
        name: string,
        attrs: Record<string, string>,
        sendInner: (content: Element) => Promise<void>,
        sendInnerAwaitingResponse: (content: Element) => Promise<Element>,
    ): StropheStanzaBuilder {
        return new StropheStanzaBuilder($build(name, attrs), sendInner, sendInnerAwaitingResponse);
    }

    $iq(attrs?: Record<string, string>): StropheStanzaBuilder {
        return this.$build(
            'iq',
            attrs,
            async (el: Element) => {
                this.connection.sendIQ(el);
            },
            async (el: Element) => new Promise<Element>((resolve, reject) => this.connection.sendIQ(el, resolve, (el) => reject(XmppResponseError.create(el))))
        );
    }

    $msg(attrs?: Record<string, string>): StropheStanzaBuilder {
        const sendInner = async (el: Element) => {
            this.beforeSendMessageSubject.next(el);
            this.connection.send(el);
            this.afterSendMessageSubject.next(el);
        };

        const sendInnerAwaitingResponse = async (el: Element) => {
            this.beforeSendMessageSubject.next(el);
            this.connection.send(el);
            this.afterSendMessageSubject.next(el);
            return Promise.resolve(el);
        };

        return this.$build('message', attrs, sendInner, sendInnerAwaitingResponse);
    }

    $pres(attrs?: Record<string, string>): StropheStanzaBuilder {
        return this.$build(
            'presence',
            attrs,
            async (el: Element) => {
                this.connection.sendPresence(el);
            },
            async (el: Element) => new Promise<Element>((resolve, reject) => this.connection.sendPresence(el, resolve, (el) => reject(XmppResponseError.create(el))))
        );
    }
}
