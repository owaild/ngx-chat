import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {XmppServiceModule} from '../../services/adapters/xmpp.service.module';
import {ChatWindowInputComponent} from './chat-window-input.component';
import {FormsModule} from '@angular/forms';
import {TextFieldModule} from '@angular/cdk/text-field';


@NgModule({
    imports: [
        CommonModule,
        XmppServiceModule,
        FormsModule,
        TextFieldModule
    ],
    declarations: [
        ChatWindowInputComponent,
    ],
    exports: [ChatWindowInputComponent],
})
export class ChatWindowInputModule {

}
