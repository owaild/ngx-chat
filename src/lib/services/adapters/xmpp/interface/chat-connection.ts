import {InjectionToken} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {LogInRequest} from '../../../../core/log-in-request';
import {Builder} from './builder';
import {LogService} from '../service/log.service';
import {ConnectionStates} from './chat.service';

export const CHAT_CONNECTION_FACTORY_TOKEN = new InjectionToken<ChatConnectionFactory>('ngxChatConnectionFactory');

/**
 * Implementation of the XMPP specification according to RFC 6121.
 * @see https://xmpp.org/rfcs/rfc6121.html
 * @see https://xmpp.org/rfcs/rfc3920.html
 * @see https://xmpp.org/rfcs/rfc3921.html
 */
export interface ChatConnection {
    readonly stateSubject: BehaviorSubject<ConnectionStates>;
    readonly stanzaUnknown$: Subject<Element>;

    /**
     * User JID with resource, not bare.
     */
    readonly userJid$: Observable<string>;

    logIn(logInRequest: LogInRequest): Promise<void>;

    logOut(): Promise<void>;

    reconnectSilently(): void;

    /**
     * Adds handles which return true or false indicating their success in handling the passed element
     *  For received stanzas we call the most specific handler to the last specific handler until one handler returns true
     * @param handler handler to call for stanzas with the specified properties
     * @param identifier all properties to find matching handler by
     *    @property identifier.ns - The namespace to match.
     *    @property identifier.name - The stanza tag name to match.
     *    @property identifier.type - The stanza type to match.
     *    @property identifier.id - The stanza id attribute to match.
     *    @property identifier.from - The stanza from attribute to match.
     *    @property identifier.options - The handler options
     * @param options matchBare match from and to Jid without resource part
     */
    addHandler(handler: (stanza: Element) => boolean, identifier?: { ns?: string, name?: string, type?: string, id?: string, from?: string }, options?: { matchBareFromJid: boolean, ignoreNamespaceFragment: boolean }): object;

    deleteHandler(handlerRef: object): void;

    $msg(attrs?: Record<string, string>): Builder;

    $iq(attrs?: Record<string, string>): Builder;

    $pres(attrs?: Record<string, string>): Builder;
}

export interface ChatConnectionFactory {
    create(
        logService: LogService,
        afterReceiveMessageSubject: Subject<Element>,
        afterSendMessageSubject: Subject<Element>,
        beforeSendMessageSubject: Subject<Element>,
        onBeforeOnlineSubject: Subject<string>,
        onOnlineSubject: Subject<void>,
        onOfflineSubject: Subject<void>,
    ): ChatConnection;
}
