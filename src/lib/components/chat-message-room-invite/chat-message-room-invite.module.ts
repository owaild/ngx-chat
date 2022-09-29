import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {XmppServiceModule} from '../../services/adapters/xmpp.service.module';
import {ChatMessageRoomInviteComponent} from './chat-message-room-invite.component';
import {ChatMessageInModule} from '../chat-message-in/chat-message-in.module';


@NgModule({
    imports: [
        CommonModule,
        ChatMessageInModule,
        XmppServiceModule
    ],
    declarations: [
        ChatMessageRoomInviteComponent,
    ],
    exports: [
        ChatMessageRoomInviteComponent
    ],
})
export class ChatMessageRoomInviteModule {

}
