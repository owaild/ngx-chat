import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
    selector: 'ngx-chat-bubble',
    templateUrl: './chat-bubble.component.html',
    styleUrls: ['./chat-bubble.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatBubbleComponent {


}
