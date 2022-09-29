import {Component, Inject, Input} from '@angular/core';
import {Message} from '../../core/message';
import {Recipient} from '../../core/recipient';
import {CHAT_SERVICE_TOKEN, ChatService} from '../../services/adapters/xmpp/interface/chat.service';


@Component({
    selector: 'ngx-chat-message-in',
    templateUrl: './chat-message-in.component.html',
    styleUrls: ['./chat-message-in.component.less'],
})
export class ChatMessageInComponent {
    @Input()
    message: Message;

    @Input()
    contact: Recipient;

    @Input()
    showAvatar: boolean;

    constructor(
        @Inject(CHAT_SERVICE_TOKEN) public chatService: ChatService,
    ) {
    }
}
