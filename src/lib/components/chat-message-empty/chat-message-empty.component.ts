import {Component, Inject} from '@angular/core';
import {CHAT_SERVICE_TOKEN, ChatService} from '../../services/adapters/xmpp/interface/chat.service';


@Component({
    selector: 'ngx-chat-message-empty',
    templateUrl: './chat-message-empty.component.html',
    styleUrls: ['./chat-message-empty.component.less'],
})
export class ChatMessageEmptyComponent {
    constructor(@Inject(CHAT_SERVICE_TOKEN) readonly chatService: ChatService) {
    }
}
