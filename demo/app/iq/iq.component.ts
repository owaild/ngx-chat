import {Component, Inject} from '@angular/core';
import {CHAT_SERVICE_TOKEN} from '@pazznetwork/ngx-chat';
import {ChatService} from '../../../src/lib/services/adapters/xmpp/interface/chat.service';

@Component({
    selector: 'app-iq',
    templateUrl: './iq.component.html',
})
export class IqComponent {
    iqRequest: string;
    iqResponse: string;

    constructor(@Inject(CHAT_SERVICE_TOKEN) public chatService: ChatService) {
    }

    async sendIq() {
        const parser = new globalThis.DOMParser();
        const element = parser.parseFromString(this.iqRequest, 'text/xml').documentElement;
        const attributes = Array.from(element.attributes).reduce((acc, val) => acc[val.name] = val.value, {});
        const response = await this.chatService.chatConnectionService.$iq(attributes).cNode(element.firstElementChild).sendAwaitingResponse();
        this.iqResponse = response.outerHTML;
    }
}
