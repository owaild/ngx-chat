import {Component, Inject, Input, OnDestroy, OnInit, Optional, Output,} from '@angular/core';
import {combineLatest, Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ChatListStateService} from '../../services/components/chat-list-state.service';
import {CHAT_SERVICE_TOKEN, ChatService} from '../../services/adapters/xmpp/interface/chat.service';
import {REPORT_USER_INJECTION_TOKEN, ReportUserService} from '../../hooks/report-user-service';
import {Contact} from '../../services/adapters/xmpp/core/contact';
import {ContactSubscription} from '../../services/adapters/xmpp/core/subscription';
import {Recipient} from '../../services/adapters/xmpp/core/recipient';

enum SubscriptionAction {
    PENDING_REQUEST,
    SHOW_BLOCK_ACTIONS,
    // There is no contact request on both sites but only a message
    BLOCK_FOR_UNAFFILIATED,
    NO_PENDING_REQUEST,
}

@Component({
    selector: 'ngx-chat-message-contact-request',
    templateUrl: './chat-message-contact-request.component.html',
    styleUrls: ['./chat-message-contact-request.component.less'],
})
export class ChatMessageContactRequestComponent implements OnInit, OnDestroy {

    @Input()
    set recipient(value: Recipient) {
        this.contact = value as Contact;
    }

    @Output()
    get scheduleScrollToLastMessage$(): Observable<void> {
        return this.scheduleScrollToLastMessageSubject.asObservable();
    }

    isShown: boolean;

    private readonly scheduleScrollToLastMessageSubject = new Subject<void>();

    subscriptionAction = SubscriptionAction.NO_PENDING_REQUEST;

    private ngDestroy = new Subject<void>();

    private contact: Contact;

    constructor(
        public chatListService: ChatListStateService,
        @Inject(CHAT_SERVICE_TOKEN) public chatService: ChatService,
        @Optional() @Inject(REPORT_USER_INJECTION_TOKEN) public reportUserService: ReportUserService,
    ) {
    }

    async ngOnInit() {
        combineLatest([
            this.contact.pendingIn$,
            this.contact.subscription$
        ]).pipe(takeUntil(this.ngDestroy))
            .subscribe(([pendingIn, subscription]) => {
                if (pendingIn) {
                    this.subscriptionAction = SubscriptionAction.PENDING_REQUEST;
                } else if (subscription === ContactSubscription.none) {
                    this.subscriptionAction = SubscriptionAction.BLOCK_FOR_UNAFFILIATED;
                }
                const subscriptionNeedingAResponse = [SubscriptionAction.PENDING_REQUEST, SubscriptionAction.SHOW_BLOCK_ACTIONS, SubscriptionAction.BLOCK_FOR_UNAFFILIATED].includes(this.subscriptionAction);
                this.isShown = this.contact.recipientType === 'contact' && subscriptionNeedingAResponse;
                this.scheduleScrollToLastMessageSubject.next();
            });
    }


    ngOnDestroy(): void {
        this.ngDestroy.next();
    }

    showDenyActions() {
        return [SubscriptionAction.SHOW_BLOCK_ACTIONS, SubscriptionAction.BLOCK_FOR_UNAFFILIATED].includes(this.subscriptionAction);
    }

    isActionDisabled() {
        return this.subscriptionAction === SubscriptionAction.SHOW_BLOCK_ACTIONS;
    }

    isActionShown() {
        return this.subscriptionAction !== SubscriptionAction.BLOCK_FOR_UNAFFILIATED;
    }

    async acceptSubscriptionRequest(event: Event) {
        event.preventDefault();
        if (this.subscriptionAction === SubscriptionAction.PENDING_REQUEST) {
            await this.chatService.addContact(this.contact.jid.toString());
            this.subscriptionAction = SubscriptionAction.NO_PENDING_REQUEST;
            this.scheduleScrollToLastMessageSubject.next();
        }
    }

    async denySubscriptionRequest(event: Event) {
        event.preventDefault();
        if (this.subscriptionAction === SubscriptionAction.PENDING_REQUEST) {
            await this.chatService.removeContact(this.contact.jid.toString());
            this.subscriptionAction = SubscriptionAction.SHOW_BLOCK_ACTIONS;
            this.scheduleScrollToLastMessageSubject.next();
        }
    }

    async blockContact($event: MouseEvent) {
        $event.preventDefault();
        await this.chatService.blockJid(this.contact.jid.toString());
        this.chatListService.closeChat(this.contact);
        this.subscriptionAction = SubscriptionAction.NO_PENDING_REQUEST;
    }

    async blockContactAndReport($event: MouseEvent) {
        $event.preventDefault();
        this.reportUserService.reportUser(this.contact);
        await this.blockContact($event);
    }

    dismissBlockOptions($event: MouseEvent) {
        $event.preventDefault();
        this.subscriptionAction = SubscriptionAction.NO_PENDING_REQUEST;
    }

    getMessage() {
        const isUnaffiliated = this.subscriptionAction === SubscriptionAction.BLOCK_FOR_UNAFFILIATED;
        const {unaffiliatedMessage, subscriptionRequestMessage} = this.chatService.translations;
        return isUnaffiliated ? unaffiliatedMessage : subscriptionRequestMessage;
    }
}
