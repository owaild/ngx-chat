import {BehaviorSubject, Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {Recipient} from '../core/recipient';
import {Stanza} from '../core/stanza';
import {LogService} from '../service/log.service';
import {XmppService} from '../../xmpp.service';
import {MultiUserChatPlugin, nsRSM} from './multi-user-chat/multi-user-chat.plugin';
import {ServiceDiscoveryPlugin} from './service-discovery.plugin';
import {nsPubSubEvent} from './publish-subscribe.plugin';
import {MessagePlugin} from './message.plugin';
import {Form, serializeToSubmitForm} from '../core/form';
import {StanzaHandlerChatPlugin} from '../core/plugin';
import {Contact} from '../core/contact';
import {Finder} from '../shared/finder';
import {MUC_SUB_EVENT_TYPE} from './multi-user-chat/muc-sub-event-type';
import {ChatConnection} from '../interface/chat-connection';

const nsMAM = 'urn:xmpp:mam:2';

/**
 * https://xmpp.org/extensions/xep-0313.html
 * Message Archive Management
 */
export class MessageArchivePlugin implements StanzaHandlerChatPlugin {
    readonly nameSpace = nsMAM;

    private readonly mamMessageReceivedSubject = new Subject<void>();
    private readonly mamStanzaSubject = new Subject<Stanza>();

    private readonly unsubscribeSubject = new Subject<void>();

    private mamHandler: object;

    constructor(
        private readonly chatService: XmppService,
        private readonly serviceDiscoveryPlugin: ServiceDiscoveryPlugin,
        private readonly multiUserChatPlugin: MultiUserChatPlugin,
        private readonly messagePlugin: MessagePlugin,
        private readonly contactsSubject: BehaviorSubject<Contact[]>,
        private readonly logService: LogService,
    ) {
        this.chatService.onBeforeOnline$.subscribe(async () => {
            await this.requestNewestMessages();
            await this.registerHandler(this.chatService.chatConnectionService);
        });

        this.chatService.onOffline$.subscribe(async () => {
            await this.unregisterHandler(this.chatService.chatConnectionService);
        });

        this.mamStanzaSubject
            .pipe(takeUntil(this.unsubscribeSubject))
            .subscribe(async (stanza) => await this.handleMamMessageStanza(stanza));

        // emit contacts to refresh contact list after receiving mam messages
        this.mamMessageReceivedSubject
            .pipe(debounceTime(10))
            .subscribe(() => this.contactsSubject.next(this.contactsSubject.getValue()));
    }

    async registerHandler(connection: ChatConnection): Promise<void> {
        this.mamHandler = connection.addHandler((stanza) => {
            console.log('handleMamStanzaSubject');
            this.mamStanzaSubject.next(stanza);
            return true;
        }, {ns: this.nameSpace, name: 'message'});
    }

    async unregisterHandler(connection: ChatConnection): Promise<void> {
        connection.deleteHandler(this.mamHandler);
        this.unsubscribeSubject.next();
    }


    private async requestNewestMessages(): Promise<void> {
        await this.chatService.chatConnectionService
            .$iq({type: 'set'})
            .c('query', {xmlns: this.nameSpace})
            .c('set', {xmlns: nsRSM})
            .c('max', {}, '250')
            .up().c('before')
            .send();
    }

    async loadMostRecentUnloadedMessages(recipient: Recipient): Promise<void> {
        // for user-to-user chats no to-attribute is necessary, in case of multi-user-chats it has to be set to the bare room jid
        const to = recipient.recipientType === 'room' ? recipient.jid.toString() : undefined;

        const form: Form = {
            type: 'submit',
            instructions: [],
            fields: [
                {type: 'hidden', variable: 'FORM_TYPE', value: this.nameSpace},
                ...(recipient.recipientType === 'contact'
                    ? [{type: 'jid-single', variable: 'with', value: (recipient as Contact).jid.toString()}] as const
                    : []),
                ...(recipient.oldestMessage
                    ? [{type: 'text-single', variable: 'end', value: recipient.oldestMessage.datetime.toISOString()}] as const
                    : []),
            ],
        };

        await this.chatService.chatConnectionService
            .$iq({type: 'set', to})
            .c('query', {xmlns: this.nameSpace})
            .cCreateMethod(builder => serializeToSubmitForm(builder, form))
            .c('set', {xmlns: nsRSM})
            .c('max', {}, '100')
            .up().c('before').send();
    }

    async loadAllMessages(): Promise<void> {
        let lastMamResponse = await this.chatService.chatConnectionService
            .$iq({type: 'set'})
            .c('query', {xmlns: this.nameSpace})
            .sendAwaitingResponse();

        while (lastMamResponse.querySelector('fin').getAttribute('complete') !== 'true') {
            const lastReceivedMessageId = lastMamResponse.querySelector('fin').querySelector('set').querySelector('last').textContent;
            lastMamResponse = await this.chatService.chatConnectionService
                .$iq({type: 'set'})
                .c('query', {xmlns: this.nameSpace})
                .c('set', {xmlns: nsRSM})
                .c('max', {}, '250')
                .up().c('after', {}, lastReceivedMessageId)
                .sendAwaitingResponse();
        }
    }

    private async handleMamMessageStanza(stanza: Stanza): Promise<void> {
        const messageElement = Finder.create(stanza)
            .searchByTag('result')
            .searchByTag('forwarded')
            .searchByTag('message')
            .result;

        const delayElement = Finder.create(stanza)
            .searchByTag('result')
            .searchByTag('forwarded')
            .searchByTag('delay')
            .result;

        const eventElement = Finder.create(stanza)
            .searchByTag('result')
            .searchByTag('forwarded')
            .searchByTag('message')
            .searchByTag('event')
            .searchByNamespace(nsPubSubEvent)
            .result;

        console.log('handleMamMessageStanza eventElement=', eventElement);
        if (eventElement) {
            const itemsElement = eventElement.querySelector('items');
            const itemsNode = itemsElement?.getAttribute('node');

            if (itemsNode !== MUC_SUB_EVENT_TYPE.messages) {
                this.logService.warn(`Handling of MUC/Sub message types other than ${MUC_SUB_EVENT_TYPE.messages} isn't implemented yet!`);
                return;
            }

            const itemElements = Array.from(itemsElement.querySelectorAll('item'));
            console.log('all itemElements=', itemElements);
            await Promise.all(itemElements.map((itemEl) => this.handleMessage(itemEl.querySelector('message'), delayElement)));
        } else {
            console.log('handleMamMessageStanza messageElement=', messageElement);
            await this.handleMessage(messageElement, delayElement);
        }

    }

    private async handleMessage(messageElement: Element, delayElement: Element) {
        const type = messageElement.getAttribute('type');
        if (type === 'chat') {
            await this.messagePlugin.handleMessageStanza(messageElement, delayElement);
            this.mamMessageReceivedSubject.next();
        } else if (type === 'groupchat' || this.multiUserChatPlugin.isRoomInvitationStanza(messageElement)) {
            throw new Error('type:groupchat NOT IMPLEMENTED');
        } else {
            throw new Error(`unknown archived message type: ${type}`);
        }
    }
}
