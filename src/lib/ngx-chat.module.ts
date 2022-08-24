import {TextFieldModule} from '@angular/cdk/text-field';
import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ChatAvatarComponent} from './components/chat-avatar/chat-avatar.component';
import {FileDropComponent} from './components/chat-filedrop/file-drop.component';
import {ChatMessageInputComponent} from './components/chat-message-input/chat-message-input.component';
import {ChatMessageLinkComponent} from './components/chat-message-link/chat-message-link.component';
import {ChatMessageListComponent} from './components/chat-message-list/chat-message-list.component';
import {ChatMessageSimpleComponent} from './components/chat-message-simple/chat-message-simple.component';
import {ChatMessageTextComponent} from './components/chat-message-text/chat-message-text.component';
import {ChatMessageComponent} from './components/chat-message/chat-message.component';
import {ChatVideoWindowComponent} from './components/chat-video-window/chat-video-window.component';
import {ChatWindowFrameComponent} from './components/chat-window-frame/chat-window-frame.component';
import {ChatWindowListComponent} from './components/chat-window-list/chat-window-list.component';
import {ChatWindowComponent} from './components/chat-window/chat-window.component';
import {ChatComponent} from './components/chat.component';
import {RosterListComponent} from './components/roster-list/roster-list.component';
import {RosterRecipientComponent} from './components/roster-recipient/roster-recipient.component';
import {IntersectionObserverDirective} from './directives/intersection-observer.directive';
import {LinksDirective} from './directives/links.directive';
import {ChatMessageContactComponent} from './components/chat-message-contact/chat-message-contact.component';
import {XmppServiceModule} from './services/adapters/xmpp.service.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        HttpClientModule,
        TextFieldModule,
        XmppServiceModule
    ],
    declarations: [
        ChatComponent,
        ChatMessageComponent,
        ChatMessageInputComponent,
        ChatMessageLinkComponent,
        ChatMessageContactComponent,
        ChatMessageListComponent,
        ChatMessageSimpleComponent,
        ChatMessageTextComponent,
        ChatWindowComponent,
        ChatWindowListComponent,
        LinksDirective,
        IntersectionObserverDirective,
        RosterListComponent,
        FileDropComponent,
        ChatWindowFrameComponent,
        ChatVideoWindowComponent,
        ChatAvatarComponent,
        RosterRecipientComponent,
    ],
    exports: [
        ChatComponent,
        ChatMessageInputComponent,
        ChatMessageListComponent,
        ChatMessageSimpleComponent,
        FileDropComponent,
        LinksDirective,
        XmppServiceModule
    ],
})
export class NgxChatModule {}
