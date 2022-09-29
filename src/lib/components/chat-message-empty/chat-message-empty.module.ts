import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatMessageEmptyComponent} from './chat-message-empty.component';


@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        ChatMessageEmptyComponent,
    ],
    exports: [
        ChatMessageEmptyComponent
    ],
})
export class ChatMessageEmptyModule{

}
