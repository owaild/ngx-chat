import {LogService} from '../service/log.service';
import {getConnectionsUrls, StropheConnectionService} from '../service/strophe-connection.service';
import {StropheConnection} from '../strophe-connection';
import {Strophe} from 'strophe.js';

const nsXForm = 'jabber:x:data'; // currently generic registration forms are not implemented
const nsRegister = 'jabber:iq:register';

enum StropheRegisterStatus {
    REGIFAIL = 13,
    REGISTER = 14,
    REGISTERED = 15,
    CONFLICT = 16,
    NOTACCEPTABLE = 17
}

/**
 * XEP-0077: In-Band Registration
 * see: https://xmpp.org/extensions/xep-0077.html
 * Handles registration over the XMPP chat instead of relaying on an admin user account management
 */
export class RegistrationPlugin {

    constructor(
        private readonly logService: LogService,
        private readonly connectionService: StropheConnectionService,
    ) {
    }

    /**
     * Promise resolves if user account is registered successfully,
     * rejects if an error happens while registering, e.g. the username is already taken.
     */
    public async register(
        username: string,
        password: string,
        service: string,
        domain: string
    ): Promise<void> {
        let registering = false;
        let processed_features = false;
        let connect_cb_data = {req: null, raw: null};

        if (username.indexOf('@') > -1) {
            this.logService.warn('username should not contain domain, only local part, this can lead to errors!');
        }

        const connectionURLs = getConnectionsUrls({domain, service});

        this.connectionService.connection = await StropheConnection.createConnection(this.logService, connectionURLs);
        const conn = this.connectionService.connection as Strophe.Connection & {
            _connect_cb: (req: Strophe.Request, _callback: (arg) => void, raw: unknown) => void
        };

        const readyToStartRegistration = new Promise<void>(resolve => {
            // hooking strophe's _connect_cb
            const connect_callback = conn._connect_cb.bind(conn);
            conn._connect_cb = (req, callback, raw) => {
                if (registering) {
                    // Save this request in case we want to authenticate later
                    connect_cb_data = {
                        req: req,
                        raw: raw
                    };
                    resolve();
                    return;
                }

                if (processed_features) {
                    // exchange Input hooks to not print the stream:features twice
                    const xmlInput = conn.xmlInput;
                    conn.xmlInput = Strophe.Connection.prototype.xmlInput;
                    const rawInput = conn.rawInput;
                    conn.rawInput = Strophe.Connection.prototype.rawInput;
                    connect_callback(req, callback, raw);
                    conn.xmlInput = xmlInput;
                    conn.rawInput = rawInput;
                }

                connect_callback(req, callback, raw);
            };

            // hooking strophe`s authenticate
            const auth_old = conn.authenticate.bind(conn);
            conn.authenticate = function(matched) {
                const isMatched = typeof matched !== 'undefined';
                if (isMatched) {
                    auth_old(matched);
                    return;
                }
                if (!this.fields.username || !this.domain || !this.fields.password) {
                    console.info('Register a JID first!');
                    return;
                }

                conn.jid = this.fields.username + '@' + this.domain;
                conn.authzid = Strophe.getBareJidFromJid(conn.jid);
                conn.authcid = Strophe.getNodeFromJid(conn.jid);
                conn.pass = this.fields.password;

                const req = this._connect_cb_data.req;
                const raw = this._connect_cb_data.raw;
                conn._connect_cb(req, connect_callback, raw);
            }.bind(this);
        })

        // anonymous connection
        conn.connect(domain, '', this.connectionService.createConnectionStatusHandler(username, domain, () => {}, () => {}), 60, 1)

        registering = true;
        await readyToStartRegistration;

        await this.queryForRegistrationForm(conn, domain, username);
        await this.submitRegisterInformationQuery(conn, username, password);

        registering = false;
        processed_features = true;
        // here we should have switched after processing the feature's stanza to the regular callback after login
        conn.reset();
    }

    private async queryForRegistrationForm(conn: Strophe.Connection, domain, username) {
        return new Promise<void>((resolve, reject) => {
            // send a get request for registration, to get all required data fields
            conn._addSysHandler((stanza) => {
                const query = stanza.getElementsByTagName('query');
                if (query.length !== 1) {
                    conn._changeConnectStatus(StropheRegisterStatus.REGIFAIL, 'unknown');
                    reject('registration failed by unknown reason');
                    return false;
                }

                conn._changeConnectStatus(StropheRegisterStatus.REGISTER, null);

                resolve();
                return false;
            }, null, 'iq', null, null);

            conn.sendIQ($iq({type: 'get'}).c('query', {xmlns: nsRegister}).tree());
        });
    }

    private async submitRegisterInformationQuery(conn: Strophe.Connection, username: string, password: string) {
        return new Promise<void>((resolve, reject) => {
            conn._addSysHandler((stanza) => {
                let error = null;

                if (stanza.getAttribute('type') === 'error') {
                    error = stanza.getElementsByTagName('error');
                    if (error.length !== 1) {
                        conn._changeConnectStatus(StropheRegisterStatus.REGIFAIL, 'unknown');
                        reject();
                        return false;
                    }

                    // this is either 'conflict' or 'not-acceptable'
                    error = error[0].firstChild.tagName.toLowerCase();
                    if (error === 'conflict') {
                        conn._changeConnectStatus(StropheRegisterStatus.CONFLICT, error);
                        reject();
                    } else if (error === 'not-acceptable') {
                        conn._changeConnectStatus(StropheRegisterStatus.NOTACCEPTABLE, error);
                        reject();
                    } else {
                        conn._changeConnectStatus(StropheRegisterStatus.REGIFAIL, error);
                        reject();
                    }
                } else {
                    conn._changeConnectStatus(StropheRegisterStatus.REGISTERED, null);
                    resolve();
                }

                return false; // makes strophe delete the sysHandler
            }, null, 'iq', null, null);

            conn.sendIQ($iq({type: 'set'})
                .c('query', {xmlns: nsRegister})
                .c('username', {}, username)
                .c('password', {}, password));
        });
    }
}
