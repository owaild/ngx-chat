import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatVideoWindowComponent} from './chat-video-window.component';
import {ChatWindowFrameModule} from '../chat-window-frame/chat-window-frame.module';


@NgModule({
    imports: [
        CommonModule,
        ChatWindowFrameModule
    ],
    declarations: [
        ChatVideoWindowComponent,
    ],
    exports: [ChatVideoWindowComponent],
})
export class ChatVideoWindowModule {

}
