import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatMessageImageComponent} from './chat-message-image.component';
import {HttpClientModule} from '@angular/common/http';


@NgModule({
    imports: [
        CommonModule,
        HttpClientModule
    ],
    declarations: [
        ChatMessageImageComponent,
    ],
    exports: [
        ChatMessageImageComponent
    ],
})
export class ChatMessageImageModule {

}
