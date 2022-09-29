import {Component, Inject, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import {Recipient} from '../../core/recipient';
import {CHAT_SERVICE_TOKEN, ChatService} from '../../services/adapters/xmpp/interface/chat.service';

@Component({
    selector: 'ngx-chat-roster-recipient',
    templateUrl: './roster-recipient.component.html',
    styleUrls: ['./roster-recipient.component.less'],
})
export class RosterRecipientComponent implements OnInit {

    @Input()
    recipient: Recipient;

    unreadCount$: Observable<number>;

    constructor(@Inject(CHAT_SERVICE_TOKEN) private chatService: ChatService) {
    }

    ngOnInit() {
        this.unreadCount$ = this.chatService.jidToUnreadCount$
            .pipe(
                map(jidToUnreadCount => jidToUnreadCount.get(this.recipient.jid.toString()) || 0),
                distinctUntilChanged(),
                debounceTime(20),
            );
    }

}
