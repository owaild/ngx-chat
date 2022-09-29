import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatMessageInComponent} from './chat-message-in.component';
import {ChatBubbleModule} from '../chat-bubble/chat-bubble.module';
import {ChatBubbleAvatarModule} from '../chat-bubble-avatar/chat-bubble-avatar.module';
import {ChatMessageTextAreaModule} from '../chat-message-text-area/chat-message-text-area.module';
import {ChatMessageImageModule} from '../chat-message-image/chat-message-image.module';
import {ChatBubbleFooterModule} from '../chat-bubble-footer/chat-bubble-footer.module';


@NgModule({
    imports: [
        CommonModule,
        ChatBubbleModule,
        ChatBubbleAvatarModule,
        ChatMessageTextAreaModule,
        ChatMessageImageModule,
        ChatBubbleFooterModule
    ],
    declarations: [
        ChatMessageInComponent,
    ],
    exports: [
        ChatMessageInComponent
    ],
})
export class ChatMessageInModule {

}
