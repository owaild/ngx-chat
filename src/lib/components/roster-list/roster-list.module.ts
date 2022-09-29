import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RosterListComponent} from './roster-list.component';
import {RosterRecipientModule} from '../roster-recipient/roster-recipient.module';
import {RosterRecipientPresenceModule} from '../roster-recipient-presence/roster-recipient-presence.module';


@NgModule({
    imports: [
        CommonModule,
        RosterRecipientModule,
        RosterRecipientPresenceModule
    ],
    declarations: [
        RosterListComponent,
    ],
    exports: [RosterListComponent],
})
export class RosterListModule{

}
