import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IntersectionObserverDirective} from './intersection-observer.directive';


@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        IntersectionObserverDirective
    ],
    exports: [
        IntersectionObserverDirective
    ],
})
export class IntersectionObserverModule {

}
