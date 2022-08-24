import {LogService} from '../service/log.service';
import {XmppService} from '../../xmpp.service';
import {ChatPlugin} from '../../../../core/plugin';
import {combineLatest, map, of, tap, timeout, timer} from 'rxjs';
import {catchError} from 'rxjs/operators';

const nsPing = 'urn:xmpp:ping';

/**
 * XEP-0199 XMPP Ping (https://xmpp.org/extensions/xep-0199.html)
 */
export class PingPlugin implements ChatPlugin {
    nameSpace = nsPing;
    private readonly pingInterval = 60_000;

    constructor(
        private readonly xmppChatAdapter: XmppService,
        private readonly logService: LogService,
    ) {
        combineLatest([timer(this.pingInterval), this.xmppChatAdapter.onBeforeOnline$])
            .pipe(
                tap(() => this.logService.debug('ping...')),
                map(async () => {
                    await this.xmppChatAdapter.chatConnectionService
                        .$iq({type: 'get'})
                        .c('ping', {xmlns: this.nameSpace})
                        .sendAwaitingResponse()
                    this.logService.debug('... pong');
                    }
                ),
                timeout(10_000),
                catchError(_ => of(() => this.logService.error('... pong errored,  connection should be online, waiting for browser websocket timeout')))
            );
    }
}
