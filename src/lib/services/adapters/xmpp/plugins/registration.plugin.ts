import {LogService} from '../service/log.service';
import {getConnectionsUrls, StropheChatConnectionService} from '../service/strophe-chat-connection.service';
import {StropheConnection} from '../strophe-connection';
import {reject} from 'lodash-es';

const nsXForm = 'jabber:x:data';
const nsRegister = 'jabber:iq:register';

enum StropheRegisterStatus {
    REGIFAIL = 13,
    REGISTERED = 14,
    CONFLICT = 15,
    NOTACCEPTABLE = 17
}

/**
 * XEP-0077: In-Band Registration
 * see: https://xmpp.org/extensions/xep-0077.html
 * Handles registration over the XMPP chat instead of relaying on an admin user account management
 */
export class RegistrationPlugin {
    private registered = false;
    private _registering = false;

    fields = {};
    urls = [];
    title = '';
    instructions = '';
    domain = null;
    form_type = null;

    constructor(
        private readonly logService: LogService,
        private readonly connectionService: StropheChatConnectionService,
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
        if (username.indexOf('@') > -1) {
            this.logService.warn('username should not contain domain, only local part, this can lead to errors!');
        }

        console.log('REGISTER CALL');

        const connectionURLs = getConnectionsUrls({domain, service});

        this.connectionService.connection = await StropheConnection.createConnection(this.logService, connectionURLs);

        return new Promise<void>((resolve, reject) => {
            try {
                this._registering = true;

                this.connectionService.connection?.connect(domain, '',
                    (statusCode, _, req) => {
                        this.getRegistrationFields(req as any).then(() => {
                            resolve();
                        }).catch((e) => {
                            reject(e);
                        });

                        /*                    console.log('StatusChangeCalled: ', statusCode);
                                            if ([Strophe.Status.DISCONNECTED,
                                                Strophe.Status.CONNFAIL,
                                                StropheRegisterStatus.REGIFAIL,
                                                StropheRegisterStatus.NOTACCEPTABLE,
                                                StropheRegisterStatus.CONFLICT
                                            ].includes(statusCode)) {
                                                (connection._proto as any)._abortAllRequests();
                                                connection.reset();
                                            } else if (statusCode === StropheRegisterStatus.REGISTERED) {
                                                connection.reset();


                                                // automatically log the user in
                                                connection.connect(username.toLowerCase() + '@' + domain.toLowerCase(), password);

                                                this.reset();
                                            }*/
                    });

                /*
                            this.connectionService.connection._addSysHandler((stanza: Element) => {
                                if (stanza.getAttribute('type') === 'error') {
                                    this.logService.error('Registration failed.', stanza);
                                    let error = stanza.getElementsByTagName('error');
                                    if (error.length !== 1) {
                                        this.connectionService.connection._changeConnectStatus(StropheRegisterStatus.REGIFAIL, 'unknown');
                                        return false;
                                    }
                                    const errorText = error[0].firstElementChild.tagName.toLowerCase();
                                    if (errorText === 'conflict') {
                                        this.connectionService.connection._changeConnectStatus(StropheRegisterStatus.CONFLICT, errorText);
                                    } else if (errorText === 'not-acceptable') {
                                        this.connectionService.connection._changeConnectStatus(StropheRegisterStatus.NOTACCEPTABLE, errorText);
                                    } else {
                                        this.connectionService.connection._changeConnectStatus(StropheRegisterStatus.REGIFAIL, errorText);
                                    }
                                } else {
                                    this.connectionService.connection._changeConnectStatus(StropheRegisterStatus.REGISTERED, null);
                                }
                                return false;
                            }, null, 'iq', null, null);

                            console.log('Before Register');
                            await this.connectionService
                                .$iq({type: 'set'})
                                .c('query', {xmlns: nsRegister})
                                .c('x', {xmlns: nsXForm, type: 'submit'})
                                .c('username', {}, username)
                                .up().c('password', {}, password)
                                .send();

                            await this.connectionService.logIn({username, password, service, domain});
                */

                this._registering = false;
                console.log('After Register');
            } catch (e) {
                this.logService.warn('error registering', e);
                throw e;
            }
        });
    }

    /**
     * Send an IQ stanza to the XMPP server asking for the registration fields.
     * @private
     * @method _converse.RegisterPanel#getRegistrationFields
     * @param { Strophe.Request } req - The current request
     */
    async getRegistrationFields(req: Strophe.Request): Promise<void> {
        const conn = this.connectionService.connection;
        conn.connected = true;

        const body = conn._proto._reqToData(req);
        if (!body) {
            throw new Error(`body is empty or null, body: ${String(body)}`);
        }
        if (conn._proto._connect_cb(body) === Strophe.Status.CONNFAIL) {
            throw new Error(`connect result is CONNFAIL, body: ${String(body)}`);
        }
        const register = body.getElementsByTagName('register');
        const mechanisms = body.getElementsByTagName('mechanism');
        if (register.length === 0 && mechanisms.length === 0) {
            conn._proto._no_auth_received(null);
            throw new Error(`no registration and mechanisms specified, body: ${String(body)}`);
        }
        if (register.length === 0) {
            conn._changeConnectStatus(StropheRegisterStatus.REGIFAIL);
            return;
        }

        const onRegistrationFields = (stanza: Element) => {
            if (stanza.getAttribute('type') === 'error' || stanza.getElementsByTagName('query').length !== 1) {
                this.connectionService.connection._changeConnectStatus(StropheRegisterStatus.REGIFAIL);
                return false;
            }
            this.setFields(stanza);
            return true;
        };

        // Send an IQ stanza to get all required data fields
        conn._addSysHandler(onRegistrationFields, null, 'iq', null, null);
        console.log('GET REG FIELDS RQ');
        await this.connectionService.$iq({type: 'get', 'id': conn.getUniqueId('sendIQ')}).c('query', {xmlns: nsRegister}).send();
        console.log('After REG FIELDS RQ');
        conn.connected = false;
    }

    /* Stores the values that will be sent to the XMPP server during attempted registration.
    * @param { Element } stanza - the IQ stanza that will be sent to the XMPP server.
    */
    setFields(stanza: Element) {
        const query = stanza.querySelector('query');
        const xform = Array.from(stanza.querySelectorAll('x')).filter(el => el.getAttribute('xmlns') === nsXForm);
        if (xform.length > 0) {
            this._setFieldsFromXForm(xform.pop());
        } else {
            this._setFieldsFromLegacy(query);
        }
    }

    _setFieldsFromLegacy(query) {
        [].forEach.call(query.children, (field: Element) => {
            if (field.tagName.toLowerCase() === 'instructions') {
                this.instructions = Strophe.getText(field);
                return;
            } else if (field.tagName.toLowerCase() === 'x') {
                if (field.getAttribute('xmlns') === 'jabber:x:oob') {
                    this.urls.concat(Array.from(field.querySelectorAll('url')).map(u => u.textContent));
                }
                return;
            }
            this.fields[field.tagName.toLowerCase()] = Strophe.getText(field);
        });
        this.form_type = 'legacy';
    }

    _setFieldsFromXForm(xform) {
        this.title = xform.querySelector('title')?.textContent;
        this.instructions = xform.querySelector('instructions')?.textContent;
        xform.querySelectorAll('field').forEach(field => {
            const _var = field.getAttribute('var');
            if (_var) {
                this.fields[_var.toLowerCase()] = field.querySelector('value')?.textContent ?? '';
            } else {
                // TODO: other option seems to be type="fixed"
                this.logService.warn('Found field we couldn\'t parse');
            }
        });
    }

    reset() {
        this.fields = {};
        this.urls = [];
        this.title = '';
        this.instructions = '';
        this.registered = false;
        this._registering = false;
        this.domain = null;
        this.form_type = null;
    }
}
