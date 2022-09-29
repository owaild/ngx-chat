import {Component, ElementRef, EventEmitter, Inject, Input, Output, ViewChild} from '@angular/core';
import {Recipient} from '../../core/recipient';
import {CHAT_SERVICE_TOKEN, ChatService} from '../../services/adapters/xmpp/interface/chat.service';

@Component({
    selector: 'ngx-chat-window-input',
    templateUrl: './chat-window-input.component.html',
    styleUrls: ['./chat-window-input.component.less'],
})
export class ChatWindowInputComponent {

    @Input()
    public recipient: Recipient;

    @Output()
    public messageSent = new EventEmitter<void>();

    public message = '';

    @ViewChild('chatInput')
    chatInput: ElementRef;

    constructor(@Inject(CHAT_SERVICE_TOKEN) public chatService: ChatService) {
    }

    async onKeydownEnter($event: KeyboardEvent) {
        $event?.preventDefault();
        await this.onSendMessage();
    }

    async onSendMessage() {
        await this.chatService.sendMessage(this.recipient, this.message);
        this.message = '';
        this.messageSent.emit();
    }

    focus() {
        this.chatInput.nativeElement.focus();
    }

}
