import {Client} from '@xmpp/client';
import {XmppService} from '../../xmpp.service';
import {ServiceDiscoveryPlugin} from './service-discovery.plugin';
import {XmppServiceModule} from '../../xmpp.service.module';
import {EjabberdClient} from '../../../../test/ejabberd-client';

describe('service discovery plugin', () => {

    let chatService: XmppService;
    let client: EjabberdClient;
    let serviceDiscoveryPlugin: ServiceDiscoveryPlugin;
    let xmppClientMock: jasmine.SpyObj<Client>;

    beforeEach(() => {
        const {xmppService, ejabberdClient} = XmppServiceModule.configureTestingModule();
        chatService = xmppService;
        client = ejabberdClient;

        // chatConnectionService.client = xmppClientMock;
        // chatConnectionService.userJid = parseJid('me', 'jabber.example.com', 'something');
    });

    it('should discover the multi user chat service', async () => {
        let infoCallCounter = 0;
        // given
        xmppClientMock.send.and.callFake((content) => {
            if (content.attrs.to === 'jabber.example.com'
                && content.getChild('query').attrs.xmlns === 'http://jabber.org/protocol/disco#items') {

                /* chatConnectionService.onStanzaReceived(
                    xml('iq', {type: 'result', id: content.attrs.id},
                        xml('query', {xmlns: 'http://jabber.org/protocol/disco#items'},
                            xml('item', {jid: 'conference.jabber.example.com'}),
                            xml('item', {jid: 'conference.jabber.example.com'}),
                            xml('item', {jid: 'conference.jabber.example.com'}),
                            xml('item', {jid: 'conference.jabber.example.com'}),
                        )
                    ) as Stanza
                ); */
            } else if (content.getChild('query') && content.getChild('query').attrs.xmlns === 'http://jabber.org/protocol/disco#info') {
                infoCallCounter++;
                if (content.attrs.to === 'conference.jabber.example.com') {
                    /* chatConnectionService.onStanzaReceived(
                        xml('iq', {type: 'result', id: content.attrs.id, from: content.attrs.to},
                            xml('query', {xmlns: 'http://jabber.org/protocol/disco#info'},
                                xml('identity', {type: 'text', category: 'conference'})
                            )
                        ) as Stanza
                    ); */
                } else {
                    /* chatConnectionService.onStanzaReceived(
                        xml('iq', {type: 'result', id: content.attrs.id, from: content.attrs.to},
                            xml('query', {xmlns: 'http://jabber.org/protocol/disco#info'},
                                xml('identity', {type: 'type', category: 'category'})
                            )
                        ) as Stanza
                    ); */
                }
            } else {
                fail('unexpected stanza: ' + content.toString());
            }
            return Promise.resolve();
        });

        // when
        const service = await serviceDiscoveryPlugin.findService('conference', 'text');

        // then
        expect(service.jid).toEqual('conference.jabber.example.com');
        expect(infoCallCounter).toEqual(2);
    });

});
