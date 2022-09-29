import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatAvatarModule} from '../chat-avatar/chat-avatar.module';
import {ChatBubbleComponent} from './chat-bubble.component';


@NgModule({
    imports: [
        CommonModule,
        ChatAvatarModule
    ],
    declarations: [
        ChatBubbleComponent,
    ],
    exports: [
        ChatBubbleComponent
    ],
})
export class ChatBubbleModule {

}
