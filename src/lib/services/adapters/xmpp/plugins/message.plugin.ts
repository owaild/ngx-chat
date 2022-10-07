import {Contact, Invitation} from '../core/contact';
import {Direction, Message, MessageState} from '../core/message';
import {MessageWithBodyStanza, Stanza} from '../core/stanza';
import {LogService} from '../service/log.service';
import {XmppService} from '../../xmpp.service';
import {nsMucUser} from './multi-user-chat/multi-user-chat-constants';
import {StanzaHandlerChatPlugin} from '../core/plugin';
import {firstValueFrom, Subject} from 'rxjs';
import {ChatConnection} from '../interface/chat-connection';
import { parseJid } from '../core/jid';

export class MessageReceivedEvent {
    discard = false;
}

const nsConference = 'jabber:x:conference';

/**
 * Part of the XMPP Core Specification
 * see: https://datatracker.ietf.org/doc/rfc6120/
 */
export class MessagePlugin implements StanzaHandlerChatPlugin {
    nameSpace = nsConference;

    private messageHandler: object;

    private messageStanzaSubject = new Subject<Stanza>();

    constructor(
        private readonly chatService: XmppService,
        private readonly logService: LogService,
    ) {
        this.chatService.onBeforeOnline$.subscribe(async () => {
            await this.registerHandler(this.chatService.chatConnectionService);
        });

        this.chatService.onOffline$.subscribe(async () => {
            await this.unregisterHandler(this.chatService.chatConnectionService);
        });

        this.messageStanzaSubject.subscribe(async (stanza) => await this.handleMessageStanza(stanza));
    }

    async registerHandler(connection: ChatConnection): Promise<void> {
        this.messageHandler = connection.addHandler((stanza) => {
            this.messageStanzaSubject.next(stanza);
            return true;
        }, {ns: this.nameSpace, name: 'message', type: 'chat'});
    }

    async unregisterHandler(connection: ChatConnection): Promise<void> {
        connection.deleteHandler(this.messageHandler);
    }

    async sendMessage(contact: Contact, body: string) {
        const from = await firstValueFrom(this.chatService.chatConnectionService.userJid$);
        const messageBuilder = this.chatService.chatConnectionService
            .$msg({to: contact.jid.toString(), from, type: 'chat'})
            .c('body')
            .t(body);

        const message: Message = {
            direction: Direction.out,
            body,
            datetime: new Date(), // TODO: replace with entity time plugin
            delayed: false,
            fromArchive: false,
            state: MessageState.SENDING,
        };
        const messageStanza = messageBuilder.tree();
        await this.chatService.plugins.messageState.beforeSendMessage(message, messageStanza);
        contact.addMessage(message);
        // TODO: on rejection mark message that it was not sent successfully
        try {
            await messageBuilder.send();
            await this.chatService.plugins.messageState.afterSendMessage(message, messageStanza);
        } catch (rej) {
            this.logService.error('rejected message ' + message.id, rej);
        }
    }

    /**
     *
     * @param messageStanza messageStanza to handle from connection, mam or other message extending plugins
     * @param archiveDelayElement only provided by MAM
     */
    public async handleMessageStanza(messageStanza: MessageWithBodyStanza, archiveDelayElement?: Stanza) {
        const me = await firstValueFrom(this.chatService.chatConnectionService.userJid$);
        const isAddressedToMe = me === messageStanza.getAttribute('to');
        const messageDirection = isAddressedToMe ? Direction.in : Direction.out;

        const messageFromArchive = archiveDelayElement != null;

        const delayElement = archiveDelayElement ?? messageStanza.querySelector('delay');
        const stamp = delayElement?.getAttribute('stamp');
        const datetime = stamp ? new Date(stamp) : new Date() /* TODO: replace with entity time plugin */;

        if (messageDirection === Direction.in && !messageFromArchive) {
            this.logService.debug('message received <=', messageStanza.querySelector('body').textContent);
        }

        const message = {
            body: messageStanza.querySelector('body').textContent.trim(),
            direction: messageDirection,
            datetime,
            delayed: !!delayElement,
            fromArchive: messageFromArchive,
        };

        const messageReceivedEvent = new MessageReceivedEvent();
        //TODO: should be removed after setting the messages into the message list with id.
        this.chatService.plugins.messageState.afterReceiveMessage(message, messageStanza, messageReceivedEvent);

        if (messageReceivedEvent.discard) {
            return;
        }

        const contactJid = isAddressedToMe ? messageStanza.getAttribute('from') : messageStanza.getAttribute('to');
        const contact = await this.chatService.getOrCreateContactById(contactJid);
        contact.addMessage(message);

        const invites = Array.from(messageStanza.querySelectorAll('x'));
        const isRoomInviteMessage =
            invites.find(el => el.getAttribute('xmlns') === nsMucUser)
            || invites.find(el => el.getAttribute('xmlns') === nsConference);

        if (isRoomInviteMessage) {
            contact.pendingRoomInvite$.next(this.extractInvitationFromMessage(messageStanza));
        }

        if (messageDirection === Direction.in && !messageFromArchive) {
            this.chatService.message$.next(contact);
        }
    }

    private extractInvitationFromMessage(messageStanza: MessageWithBodyStanza): Invitation {
        const invitations = Array.from(messageStanza.querySelectorAll('x'));
        const mediatedInvitation = invitations.find(el => el.getAttribute('xmlns') === nsMucUser);
        if (mediatedInvitation) {
            const inviteEl = mediatedInvitation.querySelector('invite');
            return {
                from: parseJid(inviteEl.getAttribute('from')),
                roomJid: parseJid(messageStanza.getAttribute('from')),
                reason: inviteEl.querySelector('reason').textContent,
                password: mediatedInvitation.querySelector('password').textContent,
            };
        }

        const directInvitation = invitations.find(el => el.getAttribute('xmlns') === nsConference);
        if (directInvitation) {
            return {
                from: parseJid(messageStanza.getAttribute('from')),
                roomJid: parseJid(directInvitation.getAttribute('jid')),
                reason: directInvitation.getAttribute('reason'),
                password: directInvitation.getAttribute('password'),
            };
        }

        throw new Error(`unknown invitation format: ${messageStanza.toString()}`);
    }

}
