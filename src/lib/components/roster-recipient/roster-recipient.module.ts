import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RosterRecipientComponent} from './roster-recipient.component';
import {ChatAvatarModule} from '../chat-avatar/chat-avatar.module';


@NgModule({
    imports: [
        CommonModule,
        ChatAvatarModule
    ],
    declarations: [
        RosterRecipientComponent
    ],
    exports: [RosterRecipientComponent],
})
export class RosterRecipientModule {

}
