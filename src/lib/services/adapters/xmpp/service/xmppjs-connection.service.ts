import {Injectable} from '@angular/core';
import {client, Client, xml} from '@xmpp/client';
import {JID} from '@xmpp/jid';
import {BehaviorSubject, Subject} from 'rxjs';
import {LogInRequest} from '../../../../core/log-in-request';
import {LogService} from './log.service';
import {XmppResponseError} from '../shared/xmpp-response.error';
import {first} from 'rxjs/operators';
import {ChatConnection, ChatConnectionFactory} from '../interface/chat-connection';
import {toXMLElement, XmppClientStanzaBuilder} from '../xmpp-client-stanza-builder';
import {ConnectionStates} from '../interface/chat.service';

type xmppElement = ReturnType<typeof xml>;

enum ClientStatus {
    /**
     * indicates that xmpp is authenticated and addressable. It is emitted every time there is a successfull (re)connection.
     */
    online = 'online',
    /**
     * indicates that xmpp disconnected and no automatic attempt to reconnect will happen (after calling xmpp.stop()).
     */
    offline = 'offline',
    /**
     * Socket is connecting
     */
    connecting = 'connecting',
    /**
     * Socket is connected
     */
    connect = 'connect',
    /**
     * Stream is opening
     */
    opening = 'connect',
    /**
     * Stream is open
     */
    open = 'open',
    /**
     * Stream is closing
     */
    closing = 'closing',
    /**
     * Stream is closed
     */
    close = 'close',
    /**
     * Socket is disconnecting
     */
    disconnecting = 'disconnecting',
    /**
     * Socket is disconnected
     */
    disconnect = 'disconnect',
}

@Injectable()
export class XmppChatConnectionFactory implements ChatConnectionFactory {
    create(logService: LogService, afterReceiveMessageSubject: Subject<Element>, afterSendMessageSubject: Subject<Element>, beforeSendMessageSubject: Subject<Element>, onBeforeOnlineSubject: Subject<string>, onOfflineSubject: Subject<void>): ChatConnection {
        return new XmppjsConnectionService(
            logService,
            afterReceiveMessageSubject,
            afterSendMessageSubject,
            beforeSendMessageSubject,
            onBeforeOnlineSubject,
            onOfflineSubject
        );
    }
}

/**
 * Implementation of the XMPP specification according to RFC 6121.
 * @see https://xmpp.org/rfcs/rfc6121.html
 * @see https://xmpp.org/rfcs/rfc3920.html
 * @see https://xmpp.org/rfcs/rfc3921.html
 */
export class XmppjsConnectionService implements ChatConnection {

    private readonly userJidSubject = new Subject<string>();
    public readonly userJid$ = this.userJidSubject.asObservable();

    private readonly stanzaUnknownSubject = new Subject<Element>();
    public readonly stanzaUnknown$ = this.stanzaUnknownSubject.asObservable();

    private readonly stateSubject = new BehaviorSubject<ConnectionStates>('disconnected');
    public readonly state$ = this.stateSubject.asObservable();

    private requestId = new Date().getTime();
    private readonly stanzaResponseHandlers = new Map<string, [(stanza: xmppElement) => void, (e: Error) => void]>();
    private client?: Client;

    constructor(
        private readonly logService: LogService,
        private readonly afterReceiveMessageSubject: Subject<Element>,
        private readonly afterSendMessageSubject: Subject<Element>,
        private readonly beforeSendMessageSubject: Subject<Element>,
        private readonly onBeforeOnlineSubject: Subject<string>,
        private readonly onOfflineSubject: Subject<void>,
    ) {
    }

    public onOnline(jid: JID): void {
        this.logService.info('online =', 'online as', jid.toString());
        this.userJidSubject.next(jid.toString());
        this.stateSubject.next('online');
    }

    private onOffline(): void {
        this.onOfflineSubject.next();
        this.stanzaResponseHandlers.forEach(([, reject]) => reject(new Error('offline')));
        this.stanzaResponseHandlers.clear();
    }

    public async send(content: xmppElement): Promise<void> {
        await this.client.send(content);
    }

    public async sendAwaitingResponse(request: xmppElement): Promise<xmppElement> {
        const from = await this.userJid$.pipe(first()).toPromise();
        return new Promise((resolve, reject) => {
            const id = this.getNextRequestId();
            request.attr('id', id);
            request.attr('from', from);

            this.stanzaResponseHandlers.set(id, [
                (response) => {
                    if (response.attrs.type === 'error') {
                        reject(XmppResponseError.create(toXMLElement(response)));
                        return;
                    }

                    resolve(response);
                },
                reject,
            ]);

            this.send(request).catch((e: unknown) => {
                this.logService.error('error sending stanza', e);
                this.stanzaResponseHandlers.delete(id);
                reject(e);
            });
        });
    }

    public onStanzaReceived(stanza: xmppElement): void {
        let handled = false;
        this.afterReceiveMessageSubject.next(toXMLElement(stanza));

        const [handleResponse] = this.stanzaResponseHandlers.get(stanza.attrs.id) ?? [];
        if (handleResponse) {
            this.logService.debug('<<<', stanza.toString(), 'handled by response handler');
            this.stanzaResponseHandlers.delete(stanza.attrs.id);
            handleResponse(stanza);
            handled = true;
        }

        if (!handled) {
            this.stanzaUnknownSubject.next(toXMLElement(stanza));
        }
    }

    /*** TODO: reuse client for same Domain **/
    async logIn(logInRequest: LogInRequest): Promise<void> {
        if (logInRequest.username.indexOf('@') > -1) {
            this.logService.warn('username should not contain domain, only local part, this can lead to errors!');
        }

        const jid = logInRequest.username + '@' + logInRequest.domain;
        this.onBeforeOnlineSubject.next(jid);
        this.client = client(logInRequest);

        this.client.on('error', (err: any) => this.logService.error('chat service error =>', err.toString(), err));

        this.client.on('status', async (status: ClientStatus, value: any) => {
            this.logService.info('status update =', status, value ? JSON.stringify(value) : '');
            switch (status) {
                case ClientStatus.online:
                    this.onOnline(value);
                    break;
                case ClientStatus.offline:
                    this.stateSubject.next('disconnected');
                    this.onOffline();
                    await this.logOut();
                    break;
                case ClientStatus.connecting:
                case ClientStatus.connect:
                case ClientStatus.opening:
                case ClientStatus.open:
                case ClientStatus.closing:
                case ClientStatus.close:
                case ClientStatus.disconnecting:
                case ClientStatus.disconnect:
                    this.stateSubject.next('connecting');
                    break;

            }
        });

        this.client.on('stanza', (stanza: xmppElement) => {
            if (this.skipXmppClientResponses(stanza)) {
                return;
            }
            this.onStanzaReceived(stanza);
        });

        await this.client.start();
    }

    /**
     * We should skip our iq handling for the following xmpp/client response:
     * - resource bind on start by https://xmpp.org/rfcs/rfc6120.html#bind
     */
    private skipXmppClientResponses(stanza: xmppElement) {
        const nsBind = 'urn:ietf:params:xml:ns:xmpp-bind';
        return stanza.is('bind', nsBind);
    }

    async logOut(): Promise<void> {
        if (!this.client) {
            return Promise.resolve();
        }
        // TODO: move this to a presence plugin in a handler
        this.logService.debug('logging out');
        try {
            await this.send(xml('presence', {type: 'unavailable'}));
            this.stateSubject.next('disconnected'); // after last send
            this.client.reconnect.stop();
        } catch (e) {
            this.logService.error('error sending presence unavailable');
        } finally {
            await this.client.stop();
        }
    }

    getNextRequestId(): string {
        return String(this.requestId++);
    }

    reconnectSilently(): void {
        this.logService.warn('hard reconnect...');
        this.stateSubject.next('disconnected');
        void this.client.reconnect.reconnect();
    }

    private $build(
        name: string,
        attrs?: Record<string, string>,
        sendInner = (element: xmppElement) => this.send(element),
        sendInnerAwaitingResponse = (element: xmppElement) => this.sendAwaitingResponse(element)
    ): XmppClientStanzaBuilder {
        return new XmppClientStanzaBuilder(xml(name, attrs), () => this.getNextRequestId(), sendInner, sendInnerAwaitingResponse);
    }

    $iq(attrs?: Record<string, string>): XmppClientStanzaBuilder {
        // @TODO use iq callee from XMPP
        return this.$build('iq', attrs);
    }

    $msg(attrs?: Record<string, string>): XmppClientStanzaBuilder {
        return this.$build('message', attrs, (element) => {
                this.beforeSendMessageSubject.next(toXMLElement(element));
                return this.send(element);
            },
            (element) => {
                this.beforeSendMessageSubject.next(toXMLElement(element));
                return this.sendAwaitingResponse(element);
            });
    }

    $pres(attrs?: Record<string, string>): XmppClientStanzaBuilder {
        return this.$build('presence', attrs);
    }

    addHandler(handler: (stanza: Element) => boolean, identifier?: { ns?: string; name?: string; type?: string; id?: string; from?: string }, options?: { matchBareFromJid: boolean; ignoreNamespaceFragment: boolean }): object {
        return undefined;
    }

    deleteHandler(handlerRef: object): void {
    }
}
