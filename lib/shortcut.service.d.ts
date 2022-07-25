import { KeyboardEventsService } from './keyboard-events.service';
import { DragToSelectConfig } from './models';
import * as i0 from "@angular/core";
export declare class ShortcutService {
    private platformId;
    private keyboardEvents;
    private _shortcuts;
    private _latestShortcut;
    constructor(platformId: Record<string, unknown>, config: DragToSelectConfig, keyboardEvents: KeyboardEventsService);
    disableSelection(event: Event): boolean;
    moveRangeStart(event: Event): boolean;
    toggleSingleItem(event: Event): boolean;
    addToSelection(event: Event): boolean;
    removeFromSelection(event: Event): boolean;
    extendedSelectionShortcut(event: Event): boolean;
    private _createShortcutsFromConfig;
    private _substituteKey;
    private _getErrorMessage;
    private _isShortcutPressed;
    private _isKeyPressed;
    private _isSupportedCombo;
    private _isSingleChar;
    private _isSupportedShortcut;
    static ɵfac: i0.ɵɵFactoryDeclaration<ShortcutService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ShortcutService>;
}
