import { type ChatWindowComponent} from './components/chat-window/chat-window.component';

export interface ChatActionContext {
    contact: string;
    chatWindow: ChatWindowComponent;
}
