import {Contact} from '../../../../core/contact';
import {Presence} from '../../../../core/presence';
import {PresenceStanza, Stanza} from '../../../../core/stanza';
import {ContactSubscription} from '../../../../core/subscription';
import {LogService} from '../service/log.service';
import {XmppService} from '../../xmpp.service';
import {StanzaHandlerChatPlugin} from '../../../../core/plugin';
import {ChatConnection} from '../interface/chat-connection';
import {Finder} from '../shared/finder';
import {nsMuc} from './multi-user-chat/multi-user-chat-constants';
import {BehaviorSubject, firstValueFrom, Subject} from 'rxjs';

/**
 * Current @TODOS:
 * 1. rename ns constants to nsNameCase
 * 2. move contacts observable to roster plugin as source of truth, inner Behaviour Subject outer Observable
 * 3. actions on contact as private subjects to avoid async
 *
 */

export const nsRoster = 'jabber:iq:roster';
// https://xmpp.org/extensions/xep-0144.html
export const nsRosterX = 'jabber:x:roster';

/**
 * https://xmpp.org/rfcs/rfc6121.html#roster-add-success
 */
export class RosterPlugin implements StanzaHandlerChatPlugin {

    readonly nameSpace = nsRoster;

    private readonly authorizePresenceSubscriptionSubject = new Subject<string>();

    private readonly acknowledgeRosterStanzaPushSubject = new Subject<string>();
    private readonly acknowledgeSubscribeSubject = new Subject<string>();
    private readonly acknowledgeUnsubscribeSubject = new Subject<string>();

    private readonly addContactFromRosterXPushSubject = new Subject<string>();

    private rosterPushHandler;
    private contactSuggestionHandler;
    private presenceHandler;

    constructor(
        private readonly chatService: XmppService,
        private readonly contactsSubject: BehaviorSubject<Contact[]>,
        private readonly logService: LogService,
    ) {
        chatService.onBeforeOnline$.subscribe(async () => {
            await this.registerHandler(this.chatService.chatConnectionService);
            await this.onBeforeOnline();
        });
        chatService.onOffline$.subscribe(async () => {
            await this.unregisterHandler(this.chatService.chatConnectionService);
            this.contactsSubject.next([]);
        });
    }

    async registerHandler(connection: ChatConnection): Promise<void> {
        const from = await firstValueFrom(this.chatService.chatConnectionService.userJid$);

        this.authorizePresenceSubscriptionSubject.subscribe(async (jid) => {
            await this.authorizePresenceSubscription(jid);
            const contact = await this.chatService.getOrCreateContactById(jid);
            contact.pendingIn$.next(false);
        });

        this.acknowledgeRosterStanzaPushSubject.subscribe(async (id) =>
            await this.chatService.chatConnectionService
                .$iq({from, id, type: 'result'})
                .send());
        this.acknowledgeSubscribeSubject.subscribe(async (jid) => await this.sendAcknowledgeSubscribe(jid));
        this.acknowledgeUnsubscribeSubject.subscribe(async (jid) => await this.sendAcknowledgeUnsubscribe(jid));
        this.addContactFromRosterXPushSubject.subscribe(async (jid) => await this.addRosterContact(jid));

        this.rosterPushHandler = connection.addHandler(elem => this.handleRosterPushStanza(elem, from), {
            ns: nsRoster,
            name: 'iq',
            type: 'set'
        });
        this.contactSuggestionHandler = connection.addHandler(elem => this.handleRosterXPush(elem), {ns: nsRosterX, name: 'message'});
        this.presenceHandler = connection.addHandler((elem) => this.handlePresenceStanza(elem, from), {name: 'presence'});
    }

    unregisterHandler(connection: ChatConnection): Promise<void> {
        connection.deleteHandler(this.rosterPushHandler);
        connection.deleteHandler(this.contactSuggestionHandler);
        connection.deleteHandler(this.presenceHandler);
        return Promise.resolve();
    }

    private handleRosterPushStanza(stanza: Stanza, currentUser: string) {
        console.log('handleRosterPushStanza: Stanza=', stanza);
        console.log('handleRosterPushStanza: currentUser=', currentUser);
        const rosterItem = Finder.create(stanza).searchByTag('query').searchByTag('item').result;
        const from = rosterItem.getAttribute('from');

        if (currentUser !== from) {
            // Security Warning: Traditionally, a roster push included no 'from' address, with the result that all roster pushes were sent
            // implicitly from the bare JID of the account itself. However, this specification allows entities other than the user's server
            // to maintain roster information, which means that a roster push might include a 'from' address other than the bare JID of the
            // user's account. Therefore, the client MUST check the 'from' address to verify that the sender of the roster push is authorized
            // to update the roster. If the client receives a roster push from an unauthorized entity, it MUST NOT process the pushed data; in
            // addition, the client can either return a stanza error of <service-unavailable/> error or refuse to return a stanza error at all
            // (the latter behavior overrides a MUST-level requirement from [XMPP‑CORE] for the purpose of preventing a presence leak).
            return true;
        }

        const id = rosterItem.getAttribute('id');

        // acknowledge the reception of the pushed roster stanza
        this.acknowledgeRosterStanzaPushSubject.next(id);

        let handled = false;
        this.rosterItemToContact(stanza).then(() => {

            // TODO: Should be unnecessary already done in xmpp.service.getOrCreateContactById
            // const existingContacts = this.contactsSubject.getValue();
            // this.contactsSubject.next(existingContacts);
            handled = true;
        });


        return handled;
    }

    private async rosterItemToContact(rosterItem: Stanza) {
        const to = rosterItem.getAttribute('jid');
        const name = rosterItem.getAttribute('name');
        const ask = rosterItem.getAttribute('ask');

        const subscription = rosterItem.getAttribute('subscription');
        const contact = await this.chatService.getOrCreateContactById(to, name || to);
        contact.pendingOut$.next(ask === 'subscribe');
        const subscriptionStatus = subscription || 'none';
        const contactSubscription = this.parseSubscription(subscriptionStatus);

        if (subscriptionStatus === 'remove') {
            contact.pendingOut$.next(false);
            contact.subscription$.next(ContactSubscription.none);
        } else {
            contact.subscription$.next(contactSubscription);
        }
        return contact;
    }

    private handlePresenceStanza(stanza: PresenceStanza, userJid: string): boolean {
        console.log('handlePresenceStanza: Stanza=', stanza);
        const type = stanza.getAttribute('type');

        if (type === 'error') {
            return true;
        }

        const fromJid = stanza.getAttribute('from');
        if (userJid.split('/')[0] === fromJid.split('/')[0]) {
            return true;
        }

        const stanzaFinder = Finder.create(stanza);

        if (stanzaFinder.searchByTag('query').searchByNamespace(nsMuc).result) {
            return false;
        }
        let handled = false;
        this.chatService.getOrCreateContactById(fromJid).then(fromContact => {
            const statusMessage = stanzaFinder.searchByTag('status')?.result?.textContent;

            if (statusMessage) {
                fromContact.setStatus(statusMessage);
            }

            if (!type) {
                // https://xmpp.org/rfcs/rfc3921.html#stanzas-presence-children-show
                const show = stanzaFinder.searchByTag('show').result.textContent;
                const presenceMapping: { [key: string]: Presence } = {
                    chat: Presence.present,
                    null: Presence.present,
                    away: Presence.away,
                    dnd: Presence.away,
                    xa: Presence.away,
                };
                fromContact.updateResourcePresence(fromJid, presenceMapping[show]);
                handled = true;
                return;
            }

            if (type === 'unavailable') {
                fromContact.updateResourcePresence(fromJid, Presence.unavailable);
                handled = true;
                return;
            }

            if (type === 'subscribe') {
                if (fromContact.isSubscribed() || fromContact.pendingOut$.getValue()) {
                    // subscriber is already a contact of us, approve subscription
                    fromContact.pendingIn$.next(false);
                    this.authorizePresenceSubscriptionSubject.next(fromJid);
                    fromContact.subscription$.next(
                        this.transitionSubscriptionRequestReceivedAccepted(fromContact.subscription$.getValue()));
                    handled = true;
                    return;
                } else if (fromContact) {
                    // subscriber is known but not subscribed or pending
                    fromContact.pendingIn$.next(true);
                    this.contactsSubject.next(this.contactsSubject.getValue());
                    handled = true;
                    return;
                }
            }

            if (type === 'subscribed') {
                fromContact.pendingOut$.next(false);
                fromContact.subscription$.next(this.transitionSubscriptionRequestSentAccepted(fromContact.subscription$.getValue()));
                this.contactsSubject.next(this.contactsSubject.getValue());
                this.acknowledgeSubscribeSubject.next(fromJid);
                handled = true;
                return;
            }

            if (type === 'unsubscribed') {
                this.acknowledgeUnsubscribeSubject.next(fromJid);
                handled = true;
                return;
            }
            // do nothing on true and for false we didn't handle the stanza properly
            handled = type === 'unsubscribe';
            return;
        });

        return handled;
    }

    private transitionSubscriptionRequestReceivedAccepted(subscription: ContactSubscription) {
        switch (subscription) {
            case ContactSubscription.none:
                return ContactSubscription.from;
            case ContactSubscription.to:
                return ContactSubscription.both;
            default:
                return subscription;
        }
    }

    private transitionSubscriptionRequestSentAccepted(subscription: ContactSubscription) {
        switch (subscription) {
            case ContactSubscription.none:
                return ContactSubscription.to;
            case ContactSubscription.from:
                return ContactSubscription.both;
            default:
                return subscription;
        }
    }

    private async authorizePresenceSubscription(jid: string) {
        await this.chatService.chatConnectionService
            .$pres({to: jid, type: 'subscribed'})
            .send();
    }

    public async onBeforeOnline(): Promise<void> {
        await this.refreshRosterContacts();
    }

    async getRosterContacts(): Promise<Contact[]> {
        const responseStanza = await this.chatService.chatConnectionService
            .$iq({type: 'get'})
            .c('query', {xmlns: 'jabber:iq:roster'})
            .sendAwaitingResponse();

        return await Promise.all(
            Finder
                .create(responseStanza)
                .searchByTag('query')
                .searchByTag('item')
                .results
                .map(rosterItem => this.rosterItemToContact(rosterItem)));

    }

    private parseSubscription(subscription: string): ContactSubscription {
        switch (subscription) {
            case 'to':
                return ContactSubscription.to;
            case 'from':
                return ContactSubscription.from;
            case 'both':
                return ContactSubscription.both;
            case 'none':
                return ContactSubscription.none;
            default:
                throw new Error(`Unhandled subscription value: ${subscription}`);
        }
    }

    async addRosterContact(jid: string): Promise<void> {
        await this.authorizePresenceSubscription(jid);
        await this.sendAddToRoster(jid);
        await this.sendSubscribeToPresence(jid);
        const contact = await this.chatService.getOrCreateContactById(jid);
        contact.pendingIn$.next(false);
    }

    private async sendAddToRoster(jid: string) {
        return await this.chatService.chatConnectionService
            .$iq({type: 'set'})
            .c('query', {xmlns: this.nameSpace})
            .c('item', {jid})
            .send();
    }

    private async sendSubscribeToPresence(jid: string) {
        await this.chatService.chatConnectionService
            .$pres({to: jid, type: 'subscribe'})
            .send();
    }

    async removeRosterContact(jid: string): Promise<void> {
        const contact = await this.chatService.getContactById(jid);
        if (contact) {
            contact.subscription$.next(ContactSubscription.none);
            contact.pendingOut$.next(false);
            contact.pendingIn$.next(false);
            await this.sendRemoveFromRoster(jid);
            await this.unauthorizePresenceSubscription(jid);
            const contacts = await firstValueFrom(this.contactsSubject);
            this.contactsSubject.next(contacts.filter(c => c.jid.toString() === jid));
        }
    }

    private async sendRemoveFromRoster(jid: string) {
        await this.chatService.chatConnectionService
            .$iq({type: 'set'})
            .c('query', {xmlns: this.nameSpace})
            .c('item', {jid, subscription: 'remove'})
            .send();
    }

    private async unauthorizePresenceSubscription(jid: string) {
        await this.chatService.chatConnectionService
            .$pres({to: jid, type: 'unsubscribed'})
            .send();
    }

    /**
     * Upon receiving the presence stanza of type "subscribed",
     * the user SHOULD acknowledge receipt of that subscription
     * state notification by sending a presence stanza of type
     * "subscribe" to the contact
     * @param jid - The Jabber ID of the user to whom one is subscribing
     */
    private async sendAcknowledgeSubscribe(jid: string) {
        await this.chatService.chatConnectionService
            .$pres({to: jid, type: 'subscribe'})
            .send();
    }

    /**
     * Upon receiving the presence stanza of type "unsubscribed",
     * the user SHOULD acknowledge receipt of that subscription state
     * notification by sending a presence stanza of type "unsubscribe"
     * this step lets the user's server know that it MUST no longer
     * send notification of the subscription state change to the user.
     * @param jid - The Jabber ID of the user who is unsubscribing
     */
    private async sendAcknowledgeUnsubscribe(jid: string) {
        await this.chatService.chatConnectionService
            .$pres({to: jid, type: 'unsubscribe'})
            .send();
    }

    async refreshRosterContacts(): Promise<void> {
        console.log('REFRESH CONTACTS');
        this.contactsSubject.next(await this.getRosterContacts());
    }

    private handleRosterXPush(elem: Element): boolean {
        console.log('handleRosterXPush: elem=', elem);
        const items = Array.from(elem.querySelectorAll('item')).filter(item => item.getAttribute('action') === 'add');
        for (const item of items) {
            this.addContactFromRosterXPushSubject.next(item.getAttribute('jid'));
        }
        return true;
    }
}
