import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {XmppServiceModule} from '../../services/adapters/xmpp.service.module';
import {ChatMessageContactRequestComponent} from './chat-message-contact-request.component';
import {ChatBubbleModule} from '../chat-bubble/chat-bubble.module';


@NgModule({
    imports: [
        CommonModule,
        XmppServiceModule,
        ChatBubbleModule
    ],
    declarations: [
        ChatMessageContactRequestComponent,
    ],
    exports: [
        ChatMessageContactRequestComponent
    ],
})
export class ChatMessageContactRequestModule {
}
