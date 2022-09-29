import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatFileDropModule} from '../chat-file-drop/chat-file-drop.module';
import {ChatWindowContentComponent} from './chat-window-content.component';
import {ChatHistoryModule} from '../chat-history/chat-history.module';
import {ChatWindowInputModule} from '../chat-window-input/chat-window-input.module';


@NgModule({
    imports: [
        CommonModule,
        ChatFileDropModule,
        ChatHistoryModule,
        ChatWindowInputModule
    ],
    declarations: [
        ChatWindowContentComponent,
    ],
    exports: [ChatWindowContentComponent],
})
export class ChatWindowContentModule {

}
