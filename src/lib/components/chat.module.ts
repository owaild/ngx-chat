import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatComponent} from './chat.component';
import {XmppServiceModule} from '../services/adapters/xmpp.service.module';
import {RosterListModule} from './roster-list/roster-list.module';
import {ChatBarWindowsModule} from './chat-bar-windows/chat-bar-windows.module';


@NgModule({
    imports: [
        CommonModule,
        XmppServiceModule,
        RosterListModule,
        ChatBarWindowsModule
    ],
    declarations: [
        ChatComponent,
    ],
    exports: [
        ChatComponent,
    ],
})
export class ChatComponentModule {

}
