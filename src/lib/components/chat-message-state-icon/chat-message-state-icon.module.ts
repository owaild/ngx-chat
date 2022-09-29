import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatMessageStateIconComponent} from './chat-message-state-icon.component';


@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        ChatMessageStateIconComponent,
    ],
    exports: [
        ChatMessageStateIconComponent
    ],
})
export class ChatMessageStateIconModule {

}
