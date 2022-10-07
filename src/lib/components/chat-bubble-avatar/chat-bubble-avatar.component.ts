import {Component, Inject, Input, Optional} from '@angular/core';
import {ChatContactClickHandler, CONTACT_CLICK_HANDLER_TOKEN} from '../../hooks/chat-contact-click-handler';
import {Recipient} from '../../services/adapters/xmpp/core/recipient';

@Component({
    selector: 'ngx-chat-bubble-avatar',
    templateUrl: './chat-bubble-avatar.component.html',
    styleUrls: ['./chat-bubble-avatar.component.less'],
})
export class ChatBubbleAvatarComponent {

    @Input()
    avatar: string;

    @Input()
    avatarClickable = false;

    @Input()
    contact: Recipient;

    @Input()
    showAvatar: boolean;

    constructor(@Inject(CONTACT_CLICK_HANDLER_TOKEN) @Optional() public contactClickHandler: ChatContactClickHandler) {
    }

    onContactClick() {
        if (!this.contactClickHandler) {
            return;
        }
        this.contactClickHandler.onClick(this.contact);
    }
}
