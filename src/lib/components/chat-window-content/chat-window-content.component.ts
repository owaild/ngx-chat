import {Component, Inject, Input, ViewChild} from '@angular/core';
import {FILE_UPLOAD_HANDLER_TOKEN, FileUploadHandler} from '../../hooks/file-upload-handler';
import {CHAT_SERVICE_TOKEN, ChatService} from '../../services/adapters/xmpp/interface/chat.service';
import {Recipient} from '../../core/recipient';
import {ChatWindowInputComponent} from '../chat-window-input/chat-window-input.component';
import {ChatHistoryComponent} from '../chat-history/chat-history.component';

@Component({
    selector: 'ngx-chat-window-content',
    templateUrl: './chat-window-content.component.html',
    styleUrls: ['./chat-window-content.component.less']
})
export class ChatWindowContentComponent {

    @Input()
    recipient: Recipient;

    @ViewChild(ChatWindowInputComponent)
    private readonly messageInput: ChatWindowInputComponent;

    @ViewChild(ChatHistoryComponent)
    private readonly contactMessageList: ChatHistoryComponent;

    constructor(
        @Inject(CHAT_SERVICE_TOKEN) readonly chatService: ChatService,
        @Inject(FILE_UPLOAD_HANDLER_TOKEN) readonly fileUploadHandler: FileUploadHandler) {
    }

    async sendMessage() {
        await this.messageInput.onSendMessage();
    }

    async uploadFile(file: File) {
        const url = await this.fileUploadHandler.upload(file);
        await this.chatService.sendMessage(this.recipient, url);
    }

    afterSendMessage() {
        this.contactMessageList.scheduleScrollToLastMessage();
    }

    onFocus() {
        this.messageInput.focus();
    }
}
