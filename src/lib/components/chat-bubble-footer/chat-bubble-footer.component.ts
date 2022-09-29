import {Component, Input} from '@angular/core';

@Component({
    selector: 'ngx-chat-bubble-footer',
    templateUrl: './chat-bubble-footer.component.html',
    styleUrls: ['./chat-bubble-footer.component.less'],
})
export class ChatBubbleFooterComponent {
    @Input()
    nick?: string;

    @Input()
    formattedDate: string;
}
