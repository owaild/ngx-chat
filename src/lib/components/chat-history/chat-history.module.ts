import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatHistoryComponent} from './chat-history.component';
import {ChatMessageEmptyModule} from '../chat-message-empty/chat-message-empty.module';
import {IntersectionObserverModule} from '../../directives/intersection-observer.module';
import {ChatMessageContactRequestModule} from '../chat-message-contact-request/chat-message-contact-request.module';
import {ChatMessageInModule} from '../chat-message-in/chat-message-in.module';
import {ChatMessageOutModule} from '../chat-message-out/chat-message-out.module';


@NgModule({
    imports: [
        CommonModule,
        ChatMessageEmptyModule,
        ChatMessageInModule,
        ChatMessageOutModule,
        IntersectionObserverModule,
        ChatMessageContactRequestModule,
    ],
    declarations: [
        ChatHistoryComponent,
    ],
    exports: [
        ChatHistoryComponent
    ],
})
export class ChatHistoryModule {

}
