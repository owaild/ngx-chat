import Storage from './Storage';
import {IConnection} from './connection/Connection.interface';
import Connector from './connection/xmpp/Connector';
import StorageConnection from './connection/storage/Connection';
import JID from './JID';
import Contact from './Contact';
import {Presence} from './connection/AbstractConnection';
import Client from './Client';
import {NoticeManager} from './NoticeManager';
import PluginRepository from './plugin/PluginRepository';
import DiscoInfoRepository from './DiscoInfoRepository';
import DiscoInfoChangeable from './DiscoInfoChangeable';
import HookRepository from './util/HookRepository';
import Options from './Options';
import UUID from './util/UUID';
import Pipe from './util/Pipe';
import {IJID} from './JID.interface';
import {IContact} from './Contact.interface';
import RosterContactProvider from './RosterContactProvider';
import ContactManager from './ContactManager';
import FallbackContactProvider from './FallbackContactProvider';
import Log from './util/Log';
import CommandRepository from './CommandRepository';
import CallManager from './CallManager';
import MenuChatMessage from './MenuChatMessage';

type ConnectionCallback = (status: number, condition?: string) => void;

export default class Account {
    private storage: Storage;

    private sessionStorage: Storage;

    private readonly sessionId: string;

    private readonly uid: string;

    private connection: IConnection;

    private connector: Connector;

    private readonly contact: Contact;

    private noticeManager: NoticeManager;

    private readonly pluginRepository: PluginRepository;

    private discoInfoRepository: DiscoInfoRepository;

    private ownDiscoInfo: DiscoInfoChangeable;

    private hookRepository = new HookRepository();

    private contactManager: ContactManager;

    private commandRepository: CommandRepository;

    private callManager: CallManager;

    private chatMessageMenu: MenuChatMessage;

    private readonly options: Options;

    private pipes = {};

    // tslint:disable-next-line:unified-signatures
    constructor(url: string, jid: string, sid: string, rid: string);
    constructor(url: string, jid: string, password: string);
    constructor(uid: string);
    constructor() {
        if (arguments.length === 1) {
            this.uid = arguments[0];
            this.sessionId = this.getStorage().getItem('sessionId');
        } else if (arguments.length === 3 || arguments.length === 4) {
            const jid = new JID(arguments[1]);

            // anonymous accounts start without node
            this.uid = jid.node ? jid.bare : UUID.v4().slice(0, 8) + '=' + jid.domain;
            this.sessionId = UUID.v4();

            const oldSessionId = this.getStorage().getItem('sessionId');
            this.getStorage().setItem('sessionId', this.sessionId);

            if (oldSessionId) {
                Storage.clear(this.uid + '@' + oldSessionId);
            }
        } else {
            throw new Error('Unsupported number of arguments');
        }

        this.options = new Options(this.getStorage());

        this.connector = new Connector(this, arguments[0], arguments[1], arguments[2], arguments[3]);
        this.connection = new StorageConnection(this);

        if (arguments.length === 1) {
            this.pluginRepository = new PluginRepository(this);
        }

        this.contact = new Contact(this, new JID(this.uid), this.uid);

        const rosterContactProvider = new RosterContactProvider(this.getContactManager(), this);
        this.getContactManager().registerContactProvider(rosterContactProvider);

        const fallbackContactProvider = new FallbackContactProvider(this.getContactManager(), this);
        this.getContactManager().registerContactProvider(fallbackContactProvider);

        const connectionCallback = this.getOption('connectionCallback');

        if (typeof connectionCallback === 'function') {
            this.registerConnectionHook((status, condition) => {
                connectionCallback(this.uid, status, condition);
            });
        }

        this.getContactManager().restoreCache();
        this.getNoticeManager();
    }

    public getOptions(): Options {
        return this.options;
    }

    public getOption(key: string) {
        return this.options.get(key);
    }

    public setOption(key: string, value: any) {
        this.options.set(key, value);
    }

    public connect = (pause: boolean = false): Promise<void> => {
        const targetPresence = Client.getPresenceController().getTargetPresence();

        if (targetPresence === Presence.offline) {
            Client.getPresenceController().setTargetPresence(Presence.online);
        }

        return this.connector
            .connect()
            .then(async ([status, connection]) => {
                this.connection = connection;

                if (pause) {
                    connection.pause();
                }

                const storage = this.getSessionStorage();

                if (!storage.getItem('connection', 'created')) {
                    storage.setItem('connection', 'created', new Date());
                }

                if (!storage.getItem('options', 'loaded')) {
                    const jid = this.connector.getJID();
                    await Options.load(jid.bare, this.connector.getPassword(), jid);
                    this.connector.clearPassword();

                    storage.setItem('options', 'loaded', true);
                }

                if (!pause) {
                    this.initConnection(status);
                }
            })
            .catch(err => {
                if (Client.getAccountManager().getAccounts().length <= 1) {
                    Client.getPresenceController().setTargetPresence(Presence.offline);
                }

                throw err;
            });
    }

    private async initConnection(status): Promise<void> {
        const storage = this.getSessionStorage();

        if (storage.getItem('connection', 'inited')) {
            return;
        }

        await this.getContactManager().loadContacts();

        const targetPresence = Client.getPresenceController().getTargetPresence();
        this.getConnection().sendPresence(targetPresence);

        storage.setItem('connection', 'inited', true);
    }

    public triggerPresenceHook = (contact: IContact, presence, oldPresence) => {
        this.hookRepository.trigger('presence', contact, presence, oldPresence);
    }

    public registerPresenceHook = func => {
        this.hookRepository.registerHook('presence', func);
    }

    public triggerConnectionHook = (status: number, condition?: string) => {
        this.hookRepository.trigger('connection', status, condition);
    }

    public registerConnectionHook = (func: ConnectionCallback) => {
        this.hookRepository.registerHook('connection', func);
    }

    public triggerChatWindowInitializedHook = (chatRootElement: Element, contact: Contact) => {
        this.hookRepository.trigger('chatWindowInitialized', chatRootElement, contact);
    }

    public registerChatWindowInitializedHook = (func: (chatRootElement?: Element, contact?: Contact) => void) => {
        this.hookRepository.registerHook('chatWindowInitialized', func);
    }

    public triggerChatWindowClearedHook = (chatRootElement: Element, contact: Contact) => {
        this.hookRepository.trigger('chatWindowCleared', chatRootElement, contact);
    }

    public registerChatWindowClearedHook = (func: (chatRootElement?: Element, contact?: Contact) => void) => {
        this.hookRepository.registerHook('chatWindowCleared', func);
    }

    public getContactManager(): ContactManager {
        if (!this.contactManager) {
            this.contactManager = new ContactManager(this);
        }

        return this.contactManager;
    }

    public getPluginRepository(): PluginRepository {
        return this.pluginRepository;
    }

    public getDiscoInfoRepository(): DiscoInfoRepository {
        if (!this.discoInfoRepository) {
            this.discoInfoRepository = new DiscoInfoRepository(this);
        }

        return this.discoInfoRepository;
    }

    public getDiscoInfo(): DiscoInfoChangeable {
        if (!this.ownDiscoInfo) {
            this.ownDiscoInfo = new DiscoInfoChangeable(this.uid);
        }

        return this.ownDiscoInfo;
    }

    public getCommandRepository(): CommandRepository {
        if (!this.commandRepository) {
            this.commandRepository = new CommandRepository();
        }

        return this.commandRepository;
    }

    public getCallManager() {
        if (!this.callManager) {
            this.callManager = new CallManager(this);
        }

        return this.callManager;
    }

    public getChatMessageMenu(): MenuChatMessage {
        if (!this.chatMessageMenu) {
            this.chatMessageMenu = new MenuChatMessage();
        }

        return this.chatMessageMenu;
    }

    public getContact(jid?: IJID): IContact {
        return jid && jid.bare !== this.getJID().bare ? this.getContactManager().getContact(jid) : this.contact;
    }

    public getNoticeManager(): NoticeManager {
        if (!this.noticeManager) {
            this.noticeManager = new NoticeManager(this.getStorage());
        }

        return this.noticeManager;
    }

    public getStorage() {
        if (!this.storage) {
            this.storage = new Storage(this.uid);
        }

        return this.storage;
    }

    public getSessionStorage() {
        if (!this.sessionStorage) {
            const name = this.uid + '@' + this.sessionId;

            this.sessionStorage = new Storage(name);
        }

        return this.sessionStorage;
    }

    public getPresence(): Presence {
        const sessionStorage = this.getSessionStorage();
        const presence = sessionStorage.getItem('presence');

        return typeof presence === 'number' ? presence : Presence.offline;
    }

    public setPresence(presence: Presence) {
        this.getSessionStorage().setItem('presence', presence);
    }

    public getConnection(): IConnection {
        return this.connection;
    }

    public getUid(): string {
        return this.uid;
    }

    public getSessionId(): string {
        return this.sessionId;
    }

    public getJID(): JID {
        const jid = this.connector.getJID();

        if (!jid) {
            Log.warn('Empty JID for account', this.getUid());
        }

        return jid;
    }

    public getConnectionUrl(): string {
        return this.connector.getUrl();
    }

    public getPipe<params extends any[] = any[]>(name: string): Pipe<params> {
        if (!this.pipes[name]) {
            this.pipes[name] = new Pipe<params>();
        }

        return this.pipes[name];
    }

    public remove() {
        this.destroy();

        Client.getAccountManager().removeAccount(this);
    }

    public destroy() {
        this.getContactManager().removeAllContactsFromCache();

        this.getConnection().close();
        this.getStorage().destroy();
        this.getSessionStorage().destroy();
        this.getNoticeManager().removeAll();

        Object.keys(this.pipes).forEach((name) => this.pipes[name].destroy());

        if (this.getPluginRepository()) {
            this.getPluginRepository().destroyAllPlugins();
        }
    }

    public connectionDisconnected() {
        this.setPresence(Presence.offline);

        this.remove();
    }
}
