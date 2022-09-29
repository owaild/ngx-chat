import {LogInRequest} from '../../../../core/log-in-request';
import {jid} from '@xmpp/jid';
import {firstValueFrom} from 'rxjs';
import {XmppServiceModule} from '../../xmpp.service.module';
import {XmppService} from '../../xmpp.service';
import {EjabberdClient} from '../../../../test/ejabberd-client';

const domain = 'local-jabber.entenhausen.pazz.de';
const service = 'wss://' + domain + ':5280/websocket';

const timLogin: LogInRequest = {
    domain,
    service,
    username: 'tim',
    password: 'tim'
};

const bobLogin: LogInRequest = {
    domain,
    service,
    username: 'bob',
    password: 'bob'
};

const timJID = jid(timLogin.username + '@' + timLogin.domain);
const bobJID = jid(bobLogin.username + '@' + bobLogin.domain);

fdescribe('roster plugin', () => {

    let chatService: XmppService;
    let client: EjabberdClient;

    beforeAll(async () => {
        const {xmppService, ejabberdClient} = XmppServiceModule.configureTestingModule();
        chatService = xmppService;
        client = ejabberdClient;
        await client.cleanUpJabber(domain);

        await client.register(bobLogin);
        await client.register(timLogin);
    });

    afterAll(async () => {
        await client.cleanUpJabber(domain);
    });


    fit('should handle adding a contact with a pending request to roster', async () => {
        await chatService.logIn(bobLogin);

        await chatService.addContact(timJID.toString());
        const contacts = await firstValueFrom(chatService.contacts$);

        console.log('Contacts are: ', contacts.map(i => i.name));

        expect(contacts.length).toEqual(1);
        await chatService.logOut();
    });

    fit('should be able to reject a contact request', async () => {
        await chatService.logIn(timLogin);

        const contacts = await firstValueFrom(chatService.contacts$);

        expect(contacts.length).toEqual(1);

        await chatService.removeContact(contacts[0].jid.toString())

        expect(contacts.length).toEqual(0);
        await chatService.logOut();
    });

    it('should be able to remove a contact request', async () => {
    });

    it('should handle adding multiple contacts to roster', async () => {
    });

    it('should load all contacts in the roster after logout and login', async () => {
    });

    it('should handle removing a contact from roster', async () => {
    });

    it('should be able to block a contact', async () => {
    });

    it('should be able to unblock a contact', async () => {
    });

    it('should handle a block by a contact from roster', async () => {
    });

    it('should handle a unblock by a contact from roster', async () => {
    });

    it('should be able to load roster with blocked, unblocked and normal contacts', async () => {
    });

    it('should be able show presence as away (away)', async () => {
    });

    it('should be able show presence as chat (present)', async () => {
    });

    it('should be able show presence as dnd (away)', async () => {
    });

    it('should be able show presence as xa (away)', async () => {
    });


    it('should handle presence available', async () => {
        /*
                // const contact = await setupMockContact();

                expect(contact.presence$.getValue()).toEqual(Presence.unavailable);

                expect(handled).toBeTruthy();

                expect(contact.presence$.getValue()).toEqual(Presence.present);
        */
    });

    it('should handle presence unavailable stanzas', async () => {
        /*
                const contact = await setupMockContact();

                contact.updateResourcePresence(contact.jidBare.toString() + '/bla', Presence.present);
                expect(contact.presence$.getValue()).toEqual(Presence.present);

                const handled = rosterPlugin.registerHandler(
                    xml('presence', {from: 'test@example.com/bla', to: 'me@example.com/bla', type: 'unavailable'})
                );
                expect(handled).toBeTruthy();

                expect(contact.presence$.getValue()).toEqual(Presence.unavailable);
        */
    });

    it('should handle multiple resources and summarize the status', async () => {
        /*const contact = await setupMockContact();

        contact.updateResourcePresence(contact.jidBare.toString() + '/foo', Presence.away);
        expect(contact.presence$.getValue()).toEqual(Presence.away);

        contact.updateResourcePresence(contact.jidBare.toString() + '/bar', Presence.present);
        expect(contact.presence$.getValue()).toEqual(Presence.present);

        contact.updateResourcePresence(contact.jidBare.toString() + '/bar', Presence.unavailable);
        expect(contact.presence$.getValue()).toEqual(Presence.away);

        contact.updateResourcePresence(contact.jidBare.toString() + '/foo', Presence.unavailable);
        expect(contact.presence$.getValue()).toEqual(Presence.unavailable);*/

    });

    it('should handle subscribe from a contact and promote subscription from "to" to "both"', async () => {
        /*const contact = await setupMockContact();
        contact.pendingIn$.next(true);
        contact.subscription$.next(ContactSubscription.to);

        const handled = rosterPlugin.registerHandler(
            xml('presence', {from: 'test@example.com', to: 'me@example.com/resource', type: 'subscribe'})
        );
        expect(handled).toBeTruthy();

        expect(contact.pendingIn$.getValue()).toBeFalsy();
        assertAcceptedPresenceSubscription();
        expect(contact.subscription$.getValue()).toEqual(ContactSubscription.both);*/
    });

    it('should handle subscribe from a contact and promote subscription from "none" to "from"', async () => {
        /* const contact = await setupMockContact();
         contact.pendingOut$.next(true);
         contact.pendingIn$.next(true);
         contact.subscription$.next(ContactSubscription.none);

         const handled = rosterPlugin.registerHandler(
             xml('presence', {from: 'test@example.com', to: 'me@example.com/resource', type: 'subscribe'})
         );
         expect(handled).toBeTruthy();

         expect(contact.pendingIn$.getValue()).toBeFalsy();
         assertAcceptedPresenceSubscription();
         expect(contact.subscription$.getValue()).toEqual(ContactSubscription.from);*/
    });

    it('should add a pending in flag to a contact where we have no subscription or pending subscription to', async () => {
        /*const contact = contactFactory.createContact('test@example.com', 'jon doe');
        chatAdapter.contacts$.next([contact]);

        const handled = rosterPlugin.registerHandler(
            xml('presence', {from: 'test@example.com', to: 'me@example.com/resource', type: 'subscribe'})
        );
        expect(handled).toBeTruthy();

        expect(contact.pendingIn$.getValue()).toBeTruthy();*/
    });

    it('should add a pending in flag and create a contact when we never seen him before', async () => {
        /* const handled = rosterPlugin.registerHandler(
             xml('presence', {from: 'test@example.com', to: 'me@example.com/resource', type: 'subscribe'})
         );
         expect(handled).toBeTruthy();

         chatAdapter.contactRequestsReceived$.subscribe(contacts => {
             expect(contacts.length).toEqual(1);
             const contact = contacts[0];
             expect(contact.pendingIn$.getValue()).toBeTruthy();
             expect(contact.subscription$.getValue()).toEqual(ContactSubscription.none);
         });*/
    });

    it('should reset pending out on contact and transition subscription state if contact accepts our subscription', async () => {
        /*const contact = await setupMockContact();
        contact.subscription$.next(ContactSubscription.none);
        contact.pendingOut$.next(true);

        const handled = rosterPlugin.registerHandler(
            xml('presence', {from: 'test@example.com', to: 'me@example.com/resource', type: 'subscribed'})
        );
        expect(handled).toBeTruthy();

        chatAdapter.contactsSubscribed$.subscribe(contacts => {
            expect(contacts.length).toEqual(1);
            const subscribedContact = contacts[0];
            expect(subscribedContact).toEqual(contact);
            expect(subscribedContact.pendingOut$.getValue()).toBeFalsy();
            expect(subscribedContact.subscription$.getValue()).toEqual(ContactSubscription.to);
        });*/
    });

    it('should not handle muc presence stanzas', async () => {
        /*const handled = rosterPlugin.registerHandler(
            xml('presence', {from: 'test@example.com', to: 'me@example.com/resource'},
                xml('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
            )
        );
        expect(handled).toBeFalsy();*/
    });
});
