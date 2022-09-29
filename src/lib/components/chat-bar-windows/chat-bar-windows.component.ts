import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input } from '@angular/core';
import { ChatListStateService } from '../../services/components/chat-list-state.service';

@Component({
    selector: 'ngx-chat-bar-windows',
    templateUrl: './chat-bar-windows.component.html',
    styleUrls: ['./chat-bar-windows.component.less'],
    animations: [
        trigger('rosterVisibility', [
            state('hidden', style({
                right: '1em',
            })),
            state('shown', style({
                right: '15em',
            })),
            transition('hidden => shown', animate('400ms ease')),
            transition('shown => hidden', animate('400ms ease'))
        ])
    ]
})
export class ChatBarWindowsComponent {

    @Input()
    rosterState: string;

    constructor(public chatListService: ChatListStateService) {
    }

}
