import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatBarWindowsComponent} from './chat-bar-windows.component';
import {ChatVideoWindowModule} from '../chat-video-window/chat-video-window.module';
import {ChatWindowModule} from '../chat-window/chat-window.module';


@NgModule({
    imports: [
        CommonModule,
        ChatVideoWindowModule,
        ChatWindowModule
    ],
    declarations: [
        ChatBarWindowsComponent,
    ],
    exports: [
        ChatBarWindowsComponent
    ],
})
export class ChatBarWindowsModule {

}
