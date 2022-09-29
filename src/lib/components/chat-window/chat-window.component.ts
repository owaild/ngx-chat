import {ChangeDetectionStrategy, Component, Inject, Input, OnDestroy, OnInit} from '@angular/core';
import {merge, Observable, scan, Subject} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {Direction} from '../../core/message';
import {ChatListStateService, ChatWindowState} from '../../services/components/chat-list-state.service';
import {CHAT_SERVICE_TOKEN, ChatService} from '../../services/adapters/xmpp/interface/chat.service';

@Component({
    selector: 'ngx-chat-window',
    templateUrl: './chat-window.component.html',
    styleUrls: ['./chat-window.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWindowComponent implements OnInit, OnDestroy {

    @Input()
    chatWindowState: ChatWindowState;

    isWindowOpen$: Observable<boolean>;

    private readonly headerClickedSubject = new Subject<void>();

    private readonly ngDestroy = new Subject<void>();

    constructor(
        @Inject(CHAT_SERVICE_TOKEN) readonly chatService: ChatService,
        private readonly chatListService: ChatListStateService,
    ) {
    }

    ngOnInit() {
        const openOnInit$ = this.chatWindowState.recipient.messages$
            .pipe(
                filter(message => message.direction === Direction.in),
                map(() => true),
                takeUntil(this.ngDestroy),
            );

        const toggleOpen$ = this.headerClickedSubject.pipe(
            scan((toggle) => !toggle, false)
        );
        this.isWindowOpen$ = merge(openOnInit$, toggleOpen$);
    }

    ngOnDestroy() {
        this.ngDestroy.next();
        this.ngDestroy.complete();
    }

    public onClickHeader() {
        this.headerClickedSubject.next();
    }

    public onClickClose() {
        this.chatListService.closeChat(this.chatWindowState.recipient);
    }
}
