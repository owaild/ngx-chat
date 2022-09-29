import {Direction} from '../../../../core/message';
import {IqResponseStanza, Stanza} from '../../../../core/stanza';
import {XmppService} from '../../xmpp.service';
import {MessageReceivedEvent} from './message.plugin';
import {ChatPlugin} from '../../../../core/plugin';
import {Finder} from '../shared/finder';
import {first} from 'rxjs/operators';
import {firstValueFrom} from 'rxjs';

export const nsCarbons = 'urn:xmpp:carbons:2';
export const nsForward = 'urn:xmpp:forward:0';
export const nsClient = 'jabber:client';

/**
 * XEP-0280 Message Carbons
 * See XEP-0280 https://xmpp.org/extensions/xep-0280.html#enabling
 */
export class MessageCarbonsPlugin implements ChatPlugin {

    nameSpace = nsCarbons;

    constructor(private readonly xmppService: XmppService) {
        this.xmppService.onBeforeOnline$.subscribe(async () => await this.onBeforeOnline());
    }

    /**
     * Ask the XMPP server to enable Message Carbons
     */
    async enableCarbons(): Promise<IqResponseStanza> {
       return await this.xmppService.chatConnectionService
            .$iq({type: 'set'})
            .c('enable', {xmlns: nsCarbons})
            .sendAwaitingResponse();
    }

    async onBeforeOnline(): Promise<IqResponseStanza> {
        return await this.enableCarbons();
    }

    async registerHandler(stanza: Stanza): Promise<boolean> {
        const receivedOrSentElement = Finder.create(stanza).searchByNamespace(this.nameSpace).result;
        const forwarded = Finder.create(receivedOrSentElement).searchByTag('forwarded').searchByNamespace(nsForward);
        const messageElement = forwarded.searchByTag('message').searchByNamespace('jabber:client').result;
        const carbonFrom = stanza.getAttribute('from');
        const userJid = await firstValueFrom(this.xmppService.chatConnectionService.userJid$);
        if (stanza.tagName === 'message' && receivedOrSentElement && messageElement && userJid === carbonFrom) {
            return this.handleCarbonMessageStanza(messageElement, receivedOrSentElement);
        }
        return false;
    }

    private handleCarbonMessageStanza(messageElement: Element, receivedOrSent: Element): boolean {
        const direction = receivedOrSent.tagName === 'received' ? Direction.in : Direction.out;
        // body can be missing on type=chat messageElements
        const body = messageElement.querySelector('body')?.textContent.trim();

        const message = {
            body,
            direction,
            datetime: new Date(), // TODO: replace with entity time plugin
            delayed: false,
            fromArchive: false,
        };

        const messageReceivedEvent = new MessageReceivedEvent();
        this.xmppService.plugins.messageState.afterReceiveMessage(message, messageElement, messageReceivedEvent)
        if (!messageReceivedEvent.discard) {
            const from = messageElement.getAttribute('from');
            const to = messageElement.getAttribute('to');
            const contactJid = direction === Direction.in ? from : to;
            this.xmppService.getOrCreateContactById(contactJid).then((contact) => {
                contact.addMessage(message);

                if (direction === Direction.in) {
                    this.xmppService.message$.next(contact);
                }
            });
        }

        return true;
    }

}
