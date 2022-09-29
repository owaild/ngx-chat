import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatAvatarComponent} from './chat-avatar.component';


@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        ChatAvatarComponent,
    ],
    exports: [
        ChatAvatarComponent
    ],
})
export class ChatAvatarModule {

}
