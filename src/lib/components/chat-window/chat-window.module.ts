import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatWindowComponent} from './chat-window.component';
import {ChatWindowFrameModule} from '../chat-window-frame/chat-window-frame.module';
import {ChatWindowContentModule} from '../chat-window-content/chat-window-content.module';
import {ChatWindowHeaderModule} from '../chat-window-header/chat-window-header.module';


@NgModule({
    imports: [
        CommonModule,
        ChatWindowFrameModule,
        ChatWindowHeaderModule,
        ChatWindowContentModule
    ],
    declarations: [
        ChatWindowComponent,
    ],
    exports: [ChatWindowComponent],
})
export class ChatWindowModule {

}
