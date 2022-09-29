import {NgModule} from '@angular/core';
import {XmppServiceModule} from './services/adapters/xmpp.service.module';
import {ChatComponentModule} from './components/chat.module';
import {ChatWindowInputModule} from './components/chat-window-input/chat-window-input.module';
import {ChatFileDropModule} from './components/chat-file-drop/chat-file-drop.module';
import {ChatBubbleModule} from './components/chat-bubble/chat-bubble.module';
import {ChatHistoryModule} from './components/chat-history/chat-history.module';
import {ChatAvatarModule} from './components/chat-avatar/chat-avatar.module';
import {ChatBubbleAvatarModule} from './components/chat-bubble-avatar/chat-bubble-avatar.module';
import {ChatBubbleFooterModule} from './components/chat-bubble-footer/chat-bubble-footer.module';
import {ChatMessageContactRequestModule} from './components/chat-message-contact-request/chat-message-contact-request.module';
import {ChatMessageEmptyModule} from './components/chat-message-empty/chat-message-empty.module';
import {ChatMessageImageModule} from './components/chat-message-image/chat-message-image.module';
import {ChatMessageInModule} from './components/chat-message-in/chat-message-in.module';
import {ChatMessageOutModule} from './components/chat-message-out/chat-message-out.module';
import {ChatMessageRoomInviteModule} from './components/chat-message-room-invite/chat-message-room-invite.module';
import {ChatMessageStateIconModule} from './components/chat-message-state-icon/chat-message-state-icon.module';
import {ChatMessageTextAreaModule} from './components/chat-message-text-area/chat-message-text-area.module';
import {ChatVideoWindowModule} from './components/chat-video-window/chat-video-window.module';
import {ChatWindowContentModule} from './components/chat-window-content/chat-window-content.module';
import {ChatWindowFrameModule} from './components/chat-window-frame/chat-window-frame.module';
import {ChatWindowHeaderModule} from './components/chat-window-header/chat-window-header.module';
import {RosterListModule} from './components/roster-list/roster-list.module';
import {RosterRecipientModule} from './components/roster-recipient/roster-recipient.module';

@NgModule({
    imports: [
        ChatAvatarModule,
        ChatBubbleAvatarModule,
        ChatBubbleFooterModule,
        ChatBubbleModule,
        ChatComponentModule,
        ChatFileDropModule,
        ChatHistoryModule,
        ChatMessageContactRequestModule,
        ChatMessageEmptyModule,
        ChatMessageImageModule,
        ChatMessageInModule,
        ChatMessageOutModule,
        ChatMessageRoomInviteModule,
        ChatMessageStateIconModule,
        ChatMessageTextAreaModule,
        ChatVideoWindowModule,
        ChatWindowContentModule,
        ChatWindowFrameModule,
        ChatWindowHeaderModule,
        ChatWindowInputModule,
        ChatWindowInputModule,
        RosterListModule,
        RosterRecipientModule,
        XmppServiceModule,
    ],
    exports: [
        ChatAvatarModule,
        ChatBubbleAvatarModule,
        ChatBubbleFooterModule,
        ChatBubbleModule,
        ChatComponentModule,
        ChatFileDropModule,
        ChatHistoryModule,
        ChatMessageContactRequestModule,
        ChatMessageEmptyModule,
        ChatMessageImageModule,
        ChatMessageInModule,
        ChatMessageOutModule,
        ChatMessageRoomInviteModule,
        ChatMessageStateIconModule,
        ChatMessageTextAreaModule,
        ChatVideoWindowModule,
        ChatWindowContentModule,
        ChatWindowFrameModule,
        ChatWindowHeaderModule,
        ChatWindowInputModule,
        ChatWindowInputModule,
        RosterListModule,
        RosterRecipientModule,
        XmppServiceModule,
    ],
})
export class NgxChatModule {
}
