import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Recipient } from '../../core/recipient';
import { CHAT_SERVICE_TOKEN, ChatService } from '../adapters/xmpp/interface/chat.service';

export class ChatWindowState {
    constructor(readonly recipient: Recipient,
                public isCollapsed: boolean) {
    }
}

export interface AttachableTrack {
    attach(elem: HTMLVideoElement): void;
}

/**
 * Used to open chat windows programmatically.
 */
@Injectable()
export class ChatListStateService {

    public openChats$ = new BehaviorSubject<ChatWindowState[]>([]);
    public openTracks$ = new BehaviorSubject<AttachableTrack[]>([]);

    constructor(@Inject(CHAT_SERVICE_TOKEN) private chatService: ChatService) {
        this.chatService.state$
            .pipe(filter(newState => newState === 'disconnected'))
            .subscribe(() => {
                this.openChats$.next([]);
            });

        this.chatService.contactRequestsReceived$.subscribe(contacts => {
            for (const contact of contacts) {
                this.openChat(contact);
            }
        });
    }

    public openChat(recipient: Recipient, collapsedWindow = false) {
        if (this.isChatWithRecipientOpen(recipient)) {
            return;
        }
        const openChats = this.openChats$.getValue();
        console.log('OpenChat with Recipient:', recipient)
        const chatWindow = new ChatWindowState(recipient, collapsedWindow);
        this.openChats$.next([chatWindow].concat(openChats));
    }

    public closeChat(recipient: Recipient) {
        const openChats = this.openChats$.getValue();
        const index = this.findChatWindowStateIndexByRecipient(recipient);
        if (index >= 0) {
            const copyWithoutContact = openChats.slice();
            copyWithoutContact.splice(index, 1);
            this.openChats$.next(copyWithoutContact);
        }
    }

    public openTrack(track: AttachableTrack) {
        this.openTracks$.next(this.openTracks$.getValue().concat([track]));
    }

    public closeTrack(track: AttachableTrack) {
        this.openTracks$.next(
            this.openTracks$.getValue().filter(s => s !== track)
        );
    }

    isChatWithRecipientOpen(recipient: Recipient): boolean {
        return this.findChatWindowStateByRecipient(recipient) !== undefined;
    }

    private findChatWindowStateIndexByRecipient(recipient: Recipient): number {
        return this.openChats$.getValue()
            .findIndex((chatWindowState) => chatWindowState.recipient.equalsJid(recipient));
    }

    private findChatWindowStateByRecipient(recipient: Recipient): ChatWindowState | undefined {
        return this.openChats$.getValue().find(chat => chat.recipient.equalsJid(recipient));
    }
}
