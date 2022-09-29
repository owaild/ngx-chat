import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RosterRecipientPresenceComponent} from './roster-recipient-presence.component';


@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        RosterRecipientPresenceComponent
    ],
    exports: [RosterRecipientPresenceComponent],
})
export class RosterRecipientPresenceModule {

}
