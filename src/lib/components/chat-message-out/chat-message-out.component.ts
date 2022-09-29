import {Component, Inject, Input} from '@angular/core';
import {Message, MessageState} from '../../core/message';
import {Recipient} from '../../core/recipient';
import {CHAT_SERVICE_TOKEN, ChatService} from '../../services/adapters/xmpp/interface/chat.service';


@Component({
    selector: 'ngx-chat-message-out',
    templateUrl: './chat-message-out.component.html',
    styleUrls: ['./chat-message-out.component.less'],
})
export class ChatMessageOutComponent {
    @Input()
    showAvatar: boolean;

    @Input()
    message: Message;

    @Input()
    contact: Recipient;

    constructor(
        @Inject(CHAT_SERVICE_TOKEN) public chatService: ChatService,
    ) {
    }

    // TODO: check if message.state can be ensured so this method can be removed
    getMessageState(): MessageState {
        if (this.message.state) {
            return this.message.state;
        } else if (this.chatService.supportsPlugin.messageState && this.contact) {
            return this.chatService.getContactMessageState(this.message, this.contact.jid.toString());
        }
        return MessageState.HIDDEN;
    }
}
