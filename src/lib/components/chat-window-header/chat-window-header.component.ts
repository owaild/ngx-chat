import {Component, EventEmitter, Inject, Input, OnInit, Optional, Output} from '@angular/core';
import {ChatWindowState} from '../../services/components/chat-list-state.service';
import {ChatContactClickHandler, CONTACT_CLICK_HANDLER_TOKEN} from '../../hooks/chat-contact-click-handler';
import {Contact, isContact} from '../../services/adapters/xmpp/core/contact';
import {CHAT_SERVICE_TOKEN, ChatService} from '../../services/adapters/xmpp/interface/chat.service';

@Component({
    selector: 'ngx-chat-window-header',
    templateUrl: './chat-window-header.component.html',
    styleUrls: ['./chat-window-header.component.less']
})
export class ChatWindowHeaderComponent {

    @Input()
    chatWindowState: ChatWindowState;

    @Output()
    closeClick = new EventEmitter<void>();

    @Output()
    headerClick = new EventEmitter<void>();

    constructor(
        @Inject(CHAT_SERVICE_TOKEN) readonly chatService: ChatService,
        @Inject(CONTACT_CLICK_HANDLER_TOKEN) @Optional() readonly contactClickHandler: ChatContactClickHandler) {
    }

    onContactClick($event: MouseEvent) {
        if (this.contactClickHandler && !this.chatWindowState.isCollapsed) {
            $event.stopPropagation();
            this.contactClickHandler.onClick(this.chatWindowState.recipient);
        }
    }

    isContactInWindow(chatWindowState: ChatWindowState): chatWindowState is {recipient: Contact, isCollapsed:  boolean} {
        return isContact(chatWindowState.recipient);
    }

    get recipientAsContact(): Contact {
        return this.chatWindowState.recipient as Contact;
    }

}
