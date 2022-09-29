import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatBubbleAvatarComponent} from './chat-bubble-avatar.component';
import {ChatAvatarModule} from '../chat-avatar/chat-avatar.module';


@NgModule({
    imports: [
        CommonModule,
        ChatAvatarModule
    ],
    declarations: [
        ChatBubbleAvatarComponent,
    ],
    exports: [
        ChatBubbleAvatarComponent
    ],
})
export class ChatBubbleAvatarModule {

}
