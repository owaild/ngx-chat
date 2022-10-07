import {Component, Input} from '@angular/core';
import { MessageState } from '../../services/adapters/xmpp/core/message';

@Component({
    selector: 'ngx-chat-message-state-icon',
    templateUrl: './chat-message-state-icon.component.html',
    styleUrls: ['./chat-message-state-icon.component.less'],
})
export class ChatMessageStateIconComponent {

    @Input()
    messageState: MessageState;

    MessageState = MessageState;
}
