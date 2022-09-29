import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatWindowFrameComponent} from './chat-window-frame.component';


@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        ChatWindowFrameComponent,
    ],
    exports: [
        ChatWindowFrameComponent
    ],
})
export class ChatWindowFrameModule{

}
