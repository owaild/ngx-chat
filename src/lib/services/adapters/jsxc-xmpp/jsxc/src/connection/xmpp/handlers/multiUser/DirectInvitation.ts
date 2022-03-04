import JID from '../../../../JID';
import AbstractHandler from '../../AbstractHandler';
import { TYPE as NOTICETYPE, FUNCTION as NOTICEFUNCTION } from '../../../../Notice';
import Log from '../../../../util/Log';

export default class extends AbstractHandler {
   public processStanza(stanza: Element): boolean {
      const from = new JID($(stanza).attr('from'));
      const contact = this.account.getContact(from);

      if (!contact) {
         Log.warn('Got invitation from stranger. Ignore silently.');
      } else if (contact.getType() === 'groupchat') {
         Log.warn('I don\'t accept direct invitations from MUC rooms.');
      }

      const xElement = $(stanza).find('x[xmlns="jabber:x:conference"]');
      const roomJid = new JID(xElement.attr('jid'));
      const password = xElement.attr('password');
      const reason = xElement.attr('reason') || xElement.text(); // pidgin workaround

      this.account.getNoticeManager().addNotice({
         title: 'Invitation',
         description: `for ${roomJid.bare}`,
         type: NOTICETYPE.invitation,
         fnName: NOTICEFUNCTION.multiUserInvitation,
         fnParams: ['direct', from.bare, roomJid.bare, reason, password, this.account.getUid()],
      });

      return this.PRESERVE_HANDLER;
   }
}
