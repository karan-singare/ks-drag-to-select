import { Observable } from 'rxjs';
import * as i0 from "@angular/core";
export declare class KeyboardEventsService {
    private platformId;
    keydown$: Observable<KeyboardEvent>;
    keyup$: Observable<KeyboardEvent>;
    distinctKeydown$: Observable<KeyboardEvent>;
    distinctKeyup$: Observable<KeyboardEvent>;
    mouseup$: Observable<MouseEvent>;
    mousemove$: Observable<MouseEvent>;
    constructor(platformId: Record<string, unknown>);
    private _initializeKeyboardStreams;
    static ɵfac: i0.ɵɵFactoryDeclaration<KeyboardEventsService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<KeyboardEventsService>;
}
