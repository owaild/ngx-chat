import {Component, Inject, Input} from '@angular/core';
import {CHAT_SERVICE_TOKEN, ChatService} from '../../services/adapters/xmpp/interface/chat.service';
import {Contact} from '../../services/adapters/xmpp/core/contact';

@Component({
    selector: 'ngx-chat-roster-recipient-presence',
    templateUrl: './roster-recipient-presence.component.html',
    styleUrls: ['./roster-recipient-presence.component.less'],
})
export class RosterRecipientPresenceComponent {

    @Input()
    contact: Contact;

    constructor(@Inject(CHAT_SERVICE_TOKEN) private chatService: ChatService) {}
}
