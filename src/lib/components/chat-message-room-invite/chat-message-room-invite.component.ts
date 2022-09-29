import {Component, Input} from '@angular/core';
import {XmppService} from '../../services/adapters/xmpp.service';
import {Direction} from '../../core/message';
import {Contact, Invitation} from '../../core/contact';


@Component({
    selector: 'ngx-chat-message-room-invite',
    templateUrl: './chat-message-room-invite.component.html',
    styleUrls: ['./chat-message-room-invite.component.less'],
})
export class ChatMessageRoomInviteComponent {

    @Input()
    invitation: Invitation;

    @Input()
    contact: Contact;

    readonly Direction = Direction;

    constructor(readonly chatService: XmppService) {
    }

    async acceptRoomInvite(event: MouseEvent) {
        event.preventDefault();
        await this.chatService.joinRoom(this.invitation.roomJid);
        this.contact.pendingRoomInvite$.next(null);
        this.invitation = null;
    }

    async declineRoomInvite(event: MouseEvent) {
        event.preventDefault();
        await this.chatService.declineRoomInvite(this.invitation.roomJid);
        this.contact.pendingRoomInvite$.next(null);
        this.invitation = null;
        await this.chatService.removeContact(this.contact.jid.toString());
    }
}
