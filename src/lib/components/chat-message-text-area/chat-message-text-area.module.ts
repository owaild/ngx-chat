import {NgModule} from '@angular/core';
import {ChatMessageTextAreaComponent} from './chat-message-text-area.component';
import {CommonModule} from '@angular/common';


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ChatMessageTextAreaComponent,
    ],
    exports: [ChatMessageTextAreaComponent],
})
export class ChatMessageTextAreaModule {

}
