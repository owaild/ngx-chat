import {DateMessagesGroup} from './message-store';
import {Message} from './message';
import {Subject} from 'rxjs';
import { JID } from './jid';

export interface Recipient {
    recipientType: 'contact' | 'room';
    avatar: string;
    name: string
    readonly jid: JID;
    get messages$(): Subject<Message>;
    get messages(): Message[];
    get dateMessagesGroups(): DateMessagesGroup<Message>[];
    get oldestMessage(): Message | undefined;
    get mostRecentMessage(): Message | undefined;
    get mostRecentMessageReceived(): Message | undefined;
    get mostRecentMessageSent(): Message | undefined;
    equalsJid(other: Recipient | JID): boolean;
}

export function isJid(o: any): o is JID {
    // due to unknown reasons, `o instanceof JID` does not work when
    // JID is instantiated by an application instead of ngx-chat
    return !!o.bare;
}
