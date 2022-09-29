import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatBubbleFooterComponent} from './chat-bubble-footer.component';


@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        ChatBubbleFooterComponent,
    ],
    exports: [
        ChatBubbleFooterComponent
    ],
})
export class ChatBubbleFooterModule {

}
