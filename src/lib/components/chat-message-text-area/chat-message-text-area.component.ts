import {Component, ComponentFactoryResolver, Input, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {extractUrls} from '../../core/utils-links';
import {ChatMessageTextComponent} from './chat-message-text/chat-message-text.component';
import {ChatMessageLinkComponent} from './chat-message-link/chat-message-link.component';

@Component({
    selector: 'ngx-chat-message-text-area',
    templateUrl: './chat-message-text-area.component.html',
})
export class ChatMessageTextAreaComponent implements OnInit {

    @Input()
    text: string;

    @ViewChild('textContainerRef', { read: ViewContainerRef })
    textContainerRef: ViewContainerRef;

    constructor(private readonly resolver: ComponentFactoryResolver) {}

    ngOnInit(): void {
        this.transform();
    }

    private transform(): void {
        const message = this.text;

        if (!message) {
            return;
        }

        const links = extractUrls(message);

        const chatMessageTextFactory = this.resolver.resolveComponentFactory(ChatMessageTextComponent);
        const chatMessageLinkFactory = this.resolver.resolveComponentFactory(ChatMessageLinkComponent);

        let lastIndex = 0;
        for (const link of links) {
            const currentIndex = message.indexOf(link, lastIndex);

            const textBeforeLink = message.substring(lastIndex, currentIndex);
            if (textBeforeLink) {
                const textBeforeLinkComponent = this.textContainerRef.createComponent(chatMessageTextFactory);
                textBeforeLinkComponent.instance.text = textBeforeLink;
            }

            const linkRef = this.textContainerRef.createComponent(chatMessageLinkFactory);
            linkRef.instance.link = link;
            linkRef.instance.text = this.shorten(link);

            lastIndex = currentIndex + link.length;
        }

        const textAfterLastLink = message.substring(lastIndex);
        if (textAfterLastLink) {
            const textAfterLastLinkComponent = this.textContainerRef.createComponent(chatMessageTextFactory);
            textAfterLastLinkComponent.instance.text = textAfterLastLink;
        }
    }

    private shorten(url: string): string {
        const parser = document.createElement('a');
        parser.href = url;

        let shortenedPathname = parser.pathname;
        if (shortenedPathname.length > 17) {
            shortenedPathname = shortenedPathname.substring(0, 5) + '...' + shortenedPathname.substring(shortenedPathname.length - 10);
        }

        return parser.protocol + '//' + parser.host + shortenedPathname;
    }
}
