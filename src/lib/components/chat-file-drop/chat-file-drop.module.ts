import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatFileDropComponent} from './chat-file-drop.component';


@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        ChatFileDropComponent,
    ],
    exports: [
        ChatFileDropComponent
    ],
})
export class ChatFileDropModule {

}
