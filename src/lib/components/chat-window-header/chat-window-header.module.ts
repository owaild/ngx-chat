import {NgModule} from '@angular/core';
import {ChatWindowHeaderComponent} from './chat-window-header.component';
import {CommonModule} from '@angular/common';
import {ChatAvatarModule} from '../chat-avatar/chat-avatar.module';


@NgModule({
    imports: [
        CommonModule,
        ChatAvatarModule
    ],
    declarations: [
        ChatWindowHeaderComponent,
    ],
    exports: [ChatWindowHeaderComponent],
})
export class ChatWindowHeaderModule {

}
