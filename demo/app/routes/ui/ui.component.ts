import { Component, OnInit } from '@angular/core';
import { Contact, Direction, dummyAvatarContact, MessageState, Room, parseJid, JID } from '@pazznetwork/ngx-chat';

@Component({
    selector: 'app-ui',
    templateUrl: './ui.component.html',
    styleUrls: ['./ui.component.less'],
})
export class UiComponent implements OnInit {

    contact: Contact;
    Direction = Direction;
    MessageState = MessageState;
    dummyAvatarContact = dummyAvatarContact;
    room: Room;
    private myJid: JID = parseJid('me@example.com');
    private otherContactJid: JID = parseJid('other@example.com');
    outMessages = [
        {
            contact: {
                avatar: dummyAvatarContact,
                nick: "chat partner",
            },
            message: {
            },
        },
        {},
        // <ngx-chat-message-out class="chat-message--out"
        //     [avatar]="dummyAvatarContact"
        // formattedDate="2020-06-04 18:35"
        // nick="chat partner"
        //     [messageState]="MessageState.SENDING">
        //     Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        //     Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
        // dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
        // proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        // </ngx-chat-message-out>
        // <ngx-chat-message-out class="chat-message--out"
        //     [avatar]="dummyAvatarContact"
        //     [direction]="Direction.out"
        // formattedDate="2020-06-04 18:35"
        // nick="chat partner"
        //     [messageState]="MessageState.SENDING">
        //     sending
        //     </ngx-chat-message-out>
        //     <ngx-chat-message-out class="chat-message--out"
        //     [avatar]="dummyAvatarContact"
        //     [direction]="Direction.out"
        // formattedDate="2020-06-04 18:35"
        // nick="chat partner"
        //     [messageState]="MessageState.SENT">
        //     sent
        //     </ngx-chat-message-out>
        //     <ngx-chat-message-out class="chat-message--out"
        //     [avatar]="dummyAvatarContact"
        //     [direction]="Direction.out"
        // formattedDate="2020-06-04 18:35"
        // nick="chat partner"
        //     [messageState]="MessageState.RECIPIENT_RECEIVED">
        //     recipient received
        // </ngx-chat-message-out>
        // <ngx-chat-message-out class="chat-message--out"
        //     [avatar]="dummyAvatarContact"
        // formattedDate="2020-06-04 18:36"
        // nick="chat partner"
        //     [messageState]="MessageState.RECIPIENT_SEEN">
        //     recipient seen
        // </ngx-chat-message-out>
        // <ngx-chat-message-out class="chat-message--out"
        //     [direction]="Direction.out"
        // formattedDate="2020-06-04 18:37"
        // imageLink="https://dummyimage.com/600x400/000/fff"
        // nick="chat partner">
        //     content goes here
        // </ngx-chat-message-out>
    ]

    ngOnInit(): void {
        this.contact = new Contact(this.otherContactJid.toString(), 'chat partner name');
        this.room = new Room(this.myJid, null);

        this.add({
            body: 'This is an incoming example message',
            datetime: new Date('2019-12-22T14:00:00'),
            direction: Direction.in,
        });
        this.add({
            body: 'This is an incoming example message on another day',
            datetime: new Date('2019-12-24T14:00:00'),
            direction: Direction.in,
        });
        this.add({
            body: 'This is an incoming example message with a really long link https://forum.golem.de/kommentare/wissenschaft/satelliten-oneweb-macht-der-astronomie-mehr-sorgen-als-starlink/oneweb-ist-doch-bald-pleite/137396,5739317,5739317,read.html#msg-5739317 which has content after the link',
            datetime: new Date('2019-12-24T14:00:00'),
            direction: Direction.in,
        });
        this.add({
            body: 'This is an incoming example message with a really long link https://forum.golem.de/satelliten-oneweb-macht-der-astronomie-mehr-sorgen-als-starlink/ which has content after the link',
            datetime: new Date('2019-12-24T14:00:00'),
            direction: Direction.in,
        });
        this.add({
            body: 'This is an outgoing example message with a really long link https://forum.golem.de/kommentare/wissenschaft/satelliten-oneweb-macht-der-astronomie-mehr-sorgen-als-starlink/oneweb-ist-doch-bald-pleite/137396,5739317,5739317,read.html#msg-5739317 which has content after the link',
            datetime: new Date('2019-12-24T14:00:00'),
            direction: Direction.out,
        });
        this.add({
            body: 'This is an outgoing example message with a really long link https://forum.golem.de/satelliten-oneweb-macht-der-astronomie-mehr-sorgen-als-starlink/ which has content after the link',
            datetime: new Date('2019-12-24T14:00:00'),
            direction: Direction.out,
        });
        this.add({
            body: 'This is an outgoing example message',
            datetime: new Date('2019-12-24T14:05:01'),
            direction: Direction.out,
        });
        this.add({
            body: '123',
            datetime: new Date('2019-12-24T14:05:01'),
            direction: Direction.out,
        });
        this.add({
            body: 'This is an outgoing message with a link to an image https://dummyimage.com/600x400/000/fff and some text after the link',
            datetime: new Date('2019-12-24T14:05:01'),
            direction: Direction.out,
        });
        this.add({
            body: 'This is an incoming message with a link to an image https://dummyimage.com/600x400/000/fff and some text after the link',
            datetime: new Date('2019-12-24T14:05:01'),
            direction: Direction.in,
        });
        this.add({
            body: 'Really tall image https://dummyimage.com/600x4000/000/fff',
            datetime: new Date('2019-12-24T14:05:01'),
            direction: Direction.in,
        });
        this.add({
            body: 'Really wide image https://dummyimage.com/6000x400/000/fff',
            datetime: new Date('2019-12-24T14:05:01'),
            direction: Direction.in,
        });
        this.add({
            body: 'Rinderkennzeichnungs- und Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz',
            datetime: new Date('2019-12-24T14:05:01'),
            direction: Direction.in,
        });
    }

    private add(message: { body: string, datetime: Date, direction: Direction }) {
        this.contact.addMessage({
            ...message,
            delayed: false,
            fromArchive: false,
            id: null,
        });

        this.room.addMessage({
            ...message,
            delayed: false,
            fromArchive: false,
            from: message.direction === Direction.in ? this.otherContactJid : this.myJid,
        });
    }

}
