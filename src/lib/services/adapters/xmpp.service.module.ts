import {NgModule, NgZone} from '@angular/core';
import {ChatBackgroundNotificationService} from '../components/chat-background-notification.service';
import {ChatListStateService} from '../components/chat-list-state.service';
import {ChatMessageListRegistryService} from '../components/chat-message-list-registry.service';
import {ContactFactoryService} from './xmpp/service/contact-factory.service';
import {LogService} from './xmpp/service/log.service';
import {CHAT_CONNECTION_FACTORY_TOKEN, ChatConnectionFactory} from './xmpp/interface/chat-connection';
import {StropheChatConnectionFactory} from './xmpp/service/strophe-connection.service';
import {CHAT_SERVICE_TOKEN, ChatService} from './xmpp/interface/chat.service';
import {HttpBackend, HttpClient, HttpClientModule, HttpHandler} from '@angular/common/http';
import {FILE_UPLOAD_HANDLER_TOKEN} from '../../hooks/file-upload-handler';
import {XmppService} from './xmpp.service';
import {TestBed} from '@angular/core/testing';
import {testLogService} from '../../test/log-service';
import {EjabberdClient} from '../../test/ejabberd-client';
@NgModule({
    providers: [
        ChatBackgroundNotificationService,
        ChatListStateService,
        ChatMessageListRegistryService,
        ContactFactoryService,
        LogService,
        {
            provide: CHAT_CONNECTION_FACTORY_TOKEN,
            useClass: StropheChatConnectionFactory,
        },
        {
            provide: CHAT_SERVICE_TOKEN,
            deps: [
                CHAT_CONNECTION_FACTORY_TOKEN,
                ChatMessageListRegistryService,
                ContactFactoryService,
                HttpClient,
                LogService,
                NgZone,
            ],
            useFactory: XmppServiceModule.xmppServiceFactory,
        },
        {
            provide: FILE_UPLOAD_HANDLER_TOKEN,
            deps: [CHAT_SERVICE_TOKEN],
            useFactory: XmppServiceModule.fileUploadHandlerFactory,
        },
    ],
})
export class XmppServiceModule {

    private static fileUploadHandlerFactory(chatService: ChatService) {
        return chatService.fileUploadHandler;
    }

    private static xmppServiceFactory(
        chatConnectionFactory: ChatConnectionFactory,
        chatMessageListRegistryService: ChatMessageListRegistryService,
        contactFactory: ContactFactoryService,
        httpClient: HttpClient,
        logService: LogService,
        ngZone: NgZone,
    ): XmppService {
        return new XmppService(
            logService,
            contactFactory,
            chatConnectionFactory,
            chatMessageListRegistryService,
            ngZone,
            httpClient
        );
    }

    static configureTestingModule(){
        TestBed.configureTestingModule({
            providers: [
                ChatMessageListRegistryService,
                ContactFactoryService,
                {provide: HttpHandler, useClass: HttpBackend},
                HttpClient,
                LogService,
                {provide: CHAT_CONNECTION_FACTORY_TOKEN, useClass: StropheChatConnectionFactory},
                {provide: CHAT_SERVICE_TOKEN, useClass: XmppService},
                {provide: LogService, useValue: testLogService()},
                ContactFactoryService,
            ],
            imports: [HttpClientModule]
        });
        return {
            xmppService: TestBed.inject(CHAT_SERVICE_TOKEN) as XmppService,
            ejabberdClient: new EjabberdClient(),
        }
    }
}
