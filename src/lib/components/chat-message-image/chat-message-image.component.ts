import {Component, Input, OnInit} from '@angular/core';
import {extractUrls} from '../../core/utils-links';
import {HttpClient} from '@angular/common/http';
import {filter, finalize, merge, Observable, race, Subject, take, map} from 'rxjs';

const MAX_IMAGE_SIZE = 250 * 1024;

@Component({
    selector: 'ngx-chat-message-image',
    templateUrl: './chat-message-image.component.html',
    styleUrls: ['./chat-message-image.component.less'],
})
export class ChatMessageImageComponent implements OnInit {

    @Input()
    textContent: string;

    imageLink$: Observable<string>;

    showImagePlaceholder = true;

    private readonly checkedHttpLinksSubject = new Subject<void>();

    constructor(private httpClient: HttpClient) {
    }

    ngOnInit() {
        this.tryFindImageLink();
    }

    private tryFindImageLink() {
        const candidateUrlsRegexArray = extractUrls(this.textContent);

        if (candidateUrlsRegexArray.length === 0) {
            this.showImagePlaceholder = false;
            return;
        }

        const candidateUrls = candidateUrlsRegexArray.map(regExp => regExp.toString());

        this.imageLink$ = race(
            merge(...candidateUrls.map(url => this.httpClient.head(url, {observe: 'response'})
                .pipe(
                    map((headRequest) => {
                        const contentType = headRequest.headers.get('Content-Type');
                        const isImage = contentType?.startsWith('image');
                        const contentLength = headRequest.headers.get('Content-Length');
                        return {isImage, contentLength, url};
                    }),
                    filter(({isImage, contentLength}) => {
                        this.checkedHttpLinksSubject.next();
                        return isImage && parseInt(contentLength, 10) < MAX_IMAGE_SIZE;
                    }),
                    map(({url}) => url)
                )))
                .pipe(take(1)),
            this.checkedHttpLinksSubject
                .pipe(
                    take(candidateUrls.length),
                    finalize(() => this.showImagePlaceholder = false),
                    map(() => '')
                )
        );
    }

    afterImageLoaded() {
        this.showImagePlaceholder = false;
    }
}
