import * as i3 from '@angular/common';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import * as i0 from '@angular/core';
import { PLATFORM_ID, Injectable, Inject, InjectionToken, Directive, HostBinding, Input, EventEmitter, Component, ViewChild, ContentChildren, Output, NgModule } from '@angular/core';
import { fromEvent, merge, BehaviorSubject, Subject, combineLatest, from, asyncScheduler } from 'rxjs';
import { map, withLatestFrom, filter, distinctUntilChanged, share, tap, switchMap, takeUntil, mapTo, auditTime, first, observeOn, startWith, concatMapTo } from 'rxjs/operators';

const DEFAULT_CONFIG = {
    selectedClass: 'selected',
    shortcuts: {
        moveRangeStart: 'shift+r',
        disableSelection: 'alt',
        toggleSingleItem: 'meta',
        addToSelection: 'shift',
        removeFromSelection: 'shift+meta',
    },
};

const AUDIT_TIME = 16;
const MIN_WIDTH = 5;
const MIN_HEIGHT = 5;
const NO_SELECT_CLASS = 'dts-no-select';

const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item) && item !== null;
};
function mergeDeep(target, source) {
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                mergeDeep(target[key], source[key]);
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        });
    }
    return target;
}
const hasMinimumSize = (selectBox, minWidth = MIN_WIDTH, minHeight = MIN_HEIGHT) => {
    return selectBox.width > minWidth || selectBox.height > minHeight;
};
const clearSelection = (window) => {
    const selection = window.getSelection();
    if (!selection) {
        return;
    }
    if (selection.removeAllRanges) {
        selection.removeAllRanges();
    }
    else if (selection.empty) {
        selection.empty();
    }
};
const inBoundingBox = (point, box) => {
    return (box.left <= point.x && point.x <= box.left + box.width && box.top <= point.y && point.y <= box.top + box.height);
};
const boxIntersects = (boxA, boxB) => {
    return (boxA.left <= boxB.left + boxB.width &&
        boxA.left + boxA.width >= boxB.left &&
        boxA.top <= boxB.top + boxB.height &&
        boxA.top + boxA.height >= boxB.top);
};
const calculateBoundingClientRect = (element) => {
    return element.getBoundingClientRect();
};
const getMousePosition = (event) => {
    return {
        x: event.clientX,
        y: event.clientY,
    };
};
const getScroll = () => {
    if (!document || !document.documentElement) {
        return {
            x: 0,
            y: 0,
        };
    }
    return {
        x: document.documentElement.scrollLeft || document.body.scrollLeft,
        y: document.documentElement.scrollTop || document.body.scrollTop,
    };
};
const getRelativeMousePosition = (event, container) => {
    const { x: clientX, y: clientY } = getMousePosition(event);
    const scroll = getScroll();
    const borderSize = (container.boundingClientRect.width - container.clientWidth) / 2;
    const offsetLeft = container.boundingClientRect.left + scroll.x;
    const offsetTop = container.boundingClientRect.top + scroll.y;
    return {
        x: clientX - borderSize - (offsetLeft - window.pageXOffset) + container.scrollLeft,
        y: clientY - borderSize - (offsetTop - window.pageYOffset) + container.scrollTop,
    };
};
const cursorWithinElement = (event, element) => {
    const mousePoint = getMousePosition(event);
    return inBoundingBox(mousePoint, calculateBoundingClientRect(element));
};

const createSelectBox = (container) => {
    return (source) => {
        return source.pipe(map(([event, opacity, { x, y }]) => {
            // Type annotation is required here, because `getRelativeMousePosition` returns a `MousePosition`,
            // the TS compiler cannot figure out the shape of this type.
            const mousePosition = getRelativeMousePosition(event, container);
            const width = opacity > 0 ? mousePosition.x - x : 0;
            const height = opacity > 0 ? mousePosition.y - y : 0;
            return {
                top: height < 0 ? mousePosition.y : y,
                left: width < 0 ? mousePosition.x : x,
                width: Math.abs(width),
                height: Math.abs(height),
                opacity,
            };
        }));
    };
};
const whenSelectBoxVisible = (selectBox$) => (source) => source.pipe(withLatestFrom(selectBox$), filter(([, selectBox]) => hasMinimumSize(selectBox, 0, 0)), map(([event, _]) => event));
const distinctKeyEvents = () => (source) => source.pipe(distinctUntilChanged((prev, curr) => {
    return prev && curr && prev.code === curr.code;
}));

class KeyboardEventsService {
    constructor(platformId) {
        this.platformId = platformId;
        if (isPlatformBrowser(this.platformId)) {
            this._initializeKeyboardStreams();
        }
    }
    _initializeKeyboardStreams() {
        this.keydown$ = fromEvent(window, 'keydown').pipe(share());
        this.keyup$ = fromEvent(window, 'keyup').pipe(share());
        // distinctKeyEvents is used to prevent multiple key events to be fired repeatedly
        // on Windows when a key is being pressed
        this.distinctKeydown$ = this.keydown$.pipe(distinctKeyEvents(), share());
        this.distinctKeyup$ = this.keyup$.pipe(distinctKeyEvents(), share());
        this.mouseup$ = fromEvent(window, 'mouseup').pipe(share());
        this.mousemove$ = fromEvent(window, 'mousemove').pipe(share());
    }
}
KeyboardEventsService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: KeyboardEventsService, deps: [{ token: PLATFORM_ID }], target: i0.ɵɵFactoryTarget.Injectable });
KeyboardEventsService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: KeyboardEventsService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: KeyboardEventsService, decorators: [{
            type: Injectable
        }], ctorParameters: function () {
        return [{ type: undefined, decorators: [{
                        type: Inject,
                        args: [PLATFORM_ID]
                    }] }];
    } });

const CONFIG = new InjectionToken('DRAG_TO_SELECT_CONFIG');
const USER_CONFIG = new InjectionToken('USER_CONFIG');

const SELECT_ITEM_INSTANCE = Symbol();
class SelectItemDirective {
    constructor(config, platformId, host, renderer) {
        this.config = config;
        this.platformId = platformId;
        this.host = host;
        this.renderer = renderer;
        this.selected = false;
        this.rangeStart = false;
        this.hostClass = true;
        this.dtsDisabled = false;
    }
    get value() {
        return this.dtsSelectItem ? this.dtsSelectItem : this;
    }
    ngOnInit() {
        this.nativeElememnt[SELECT_ITEM_INSTANCE] = this;
    }
    ngDoCheck() {
        this.applySelectedClass();
    }
    toggleRangeStart() {
        this.rangeStart = !this.rangeStart;
    }
    get nativeElememnt() {
        return this.host.nativeElement;
    }
    getBoundingClientRect() {
        if (isPlatformBrowser(this.platformId) && !this._boundingClientRect) {
            this.calculateBoundingClientRect();
        }
        return this._boundingClientRect;
    }
    calculateBoundingClientRect() {
        const boundingBox = calculateBoundingClientRect(this.host.nativeElement);
        this._boundingClientRect = boundingBox;
        return boundingBox;
    }
    _select() {
        this.selected = true;
    }
    _deselect() {
        this.selected = false;
    }
    applySelectedClass() {
        if (this.selected) {
            this.renderer.addClass(this.host.nativeElement, this.config.selectedClass);
        }
        else {
            this.renderer.removeClass(this.host.nativeElement, this.config.selectedClass);
        }
    }
}
SelectItemDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: SelectItemDirective, deps: [{ token: CONFIG }, { token: PLATFORM_ID }, { token: i0.ElementRef }, { token: i0.Renderer2 }], target: i0.ɵɵFactoryTarget.Directive });
SelectItemDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.3", type: SelectItemDirective, selector: "[dtsSelectItem]", inputs: { dtsSelectItem: "dtsSelectItem", dtsDisabled: "dtsDisabled" }, host: { properties: { "class.dts-range-start": "this.rangeStart", "class.dts-select-item": "this.hostClass", "class.dts-disabled": "this.dtsDisabled" } }, exportAs: ["dtsSelectItem"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: SelectItemDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[dtsSelectItem]',
                    exportAs: 'dtsSelectItem',
                }]
        }], ctorParameters: function () {
        return [{ type: undefined, decorators: [{
                        type: Inject,
                        args: [CONFIG]
                    }] }, { type: undefined, decorators: [{
                        type: Inject,
                        args: [PLATFORM_ID]
                    }] }, { type: i0.ElementRef }, { type: i0.Renderer2 }];
    }, propDecorators: { rangeStart: [{
                type: HostBinding,
                args: ['class.dts-range-start']
            }], hostClass: [{
                type: HostBinding,
                args: ['class.dts-select-item']
            }], dtsSelectItem: [{
                type: Input
            }], dtsDisabled: [{
                type: Input
            }, {
                type: HostBinding,
                args: ['class.dts-disabled']
            }] } });

var UpdateActions;
(function (UpdateActions) {
    UpdateActions[UpdateActions["Add"] = 0] = "Add";
    UpdateActions[UpdateActions["Remove"] = 1] = "Remove";
})(UpdateActions || (UpdateActions = {}));
var Action;
(function (Action) {
    Action[Action["Add"] = 0] = "Add";
    Action[Action["Delete"] = 1] = "Delete";
    Action[Action["None"] = 2] = "None";
})(Action || (Action = {}));

const SUPPORTED_META_KEYS = {
    alt: true,
    shift: true,
    meta: true,
    ctrl: true,
};
const SUPPORTED_KEYS = /[a-z]/;
const META_KEY = 'meta';
const KEY_ALIASES = {
    [META_KEY]: ['ctrl', 'meta'],
};
const SUPPORTED_SHORTCUTS = {
    moveRangeStart: true,
    disableSelection: true,
    toggleSingleItem: true,
    addToSelection: true,
    removeFromSelection: true,
};
const ERROR_PREFIX = '[ShortcutService]';
class ShortcutService {
    constructor(platformId, config, keyboardEvents) {
        this.platformId = platformId;
        this.keyboardEvents = keyboardEvents;
        this._shortcuts = {};
        this._latestShortcut = new Map();
        this._shortcuts = this._createShortcutsFromConfig(config.shortcuts);
        if (isPlatformBrowser(this.platformId)) {
            const keydown$ = this.keyboardEvents.keydown$.pipe(map((event) => ({ code: event.code, pressed: true })));
            const keyup$ = this.keyboardEvents.keyup$.pipe(map((event) => ({ code: event.code, pressed: false })));
            merge(keydown$, keyup$)
                .pipe(distinctUntilChanged((prev, curr) => {
                return prev.pressed === curr.pressed && prev.code === curr.code;
            }))
                .subscribe((keyState) => {
                if (keyState.pressed) {
                    this._latestShortcut.set(keyState.code, true);
                }
                else {
                    this._latestShortcut.delete(keyState.code);
                }
            });
        }
    }
    disableSelection(event) {
        return this._isShortcutPressed('disableSelection', event);
    }
    moveRangeStart(event) {
        return this._isShortcutPressed('moveRangeStart', event);
    }
    toggleSingleItem(event) {
        return this._isShortcutPressed('toggleSingleItem', event);
    }
    addToSelection(event) {
        return this._isShortcutPressed('addToSelection', event);
    }
    removeFromSelection(event) {
        return this._isShortcutPressed('removeFromSelection', event);
    }
    extendedSelectionShortcut(event) {
        return this.addToSelection(event) || this.removeFromSelection(event);
    }
    _createShortcutsFromConfig(shortcuts) {
        const shortcutMap = {};
        for (const [key, shortcutsForCommand] of Object.entries(shortcuts)) {
            if (!this._isSupportedShortcut(key)) {
                throw new Error(this._getErrorMessage(`Shortcut ${key} not supported`));
            }
            shortcutsForCommand
                .replace(/ /g, '')
                .split(',')
                .forEach((shortcut) => {
                if (!shortcutMap[key]) {
                    shortcutMap[key] = [];
                }
                const combo = shortcut.split('+');
                const cleanCombos = this._substituteKey(shortcut, combo, META_KEY);
                cleanCombos.forEach((cleanCombo) => {
                    const unsupportedKey = this._isSupportedCombo(cleanCombo);
                    if (unsupportedKey) {
                        throw new Error(this._getErrorMessage(`Key '${unsupportedKey}' in shortcut ${shortcut} not supported`));
                    }
                    shortcutMap[key].push(cleanCombo.map((comboKey) => {
                        return SUPPORTED_META_KEYS[comboKey] ? `${comboKey}Key` : `Key${comboKey.toUpperCase()}`;
                    }));
                });
            });
        }
        return shortcutMap;
    }
    _substituteKey(shortcut, combo, substituteKey) {
        const hasSpecialKey = shortcut.includes(substituteKey);
        const substitutedShortcut = [];
        if (hasSpecialKey) {
            const cleanShortcut = combo.filter((element) => element !== META_KEY);
            KEY_ALIASES.meta.forEach((alias) => {
                substitutedShortcut.push([...cleanShortcut, alias]);
            });
        }
        else {
            substitutedShortcut.push(combo);
        }
        return substitutedShortcut;
    }
    _getErrorMessage(message) {
        return `${ERROR_PREFIX} ${message}`;
    }
    _isShortcutPressed(shortcutName, event) {
        const shortcuts = this._shortcuts[shortcutName];
        return shortcuts.some((shortcut) => {
            return shortcut.every((key) => this._isKeyPressed(event, key));
        });
    }
    _isKeyPressed(event, key) {
        return key.startsWith('Key') ? this._latestShortcut.has(key) : event[key];
    }
    _isSupportedCombo(combo) {
        let unsupportedKey = null;
        combo.forEach((key) => {
            if (!SUPPORTED_META_KEYS[key] && (!SUPPORTED_KEYS.test(key) || this._isSingleChar(key))) {
                unsupportedKey = key;
                return;
            }
        });
        return unsupportedKey;
    }
    _isSingleChar(key) {
        return key.length > 1;
    }
    _isSupportedShortcut(shortcut) {
        return SUPPORTED_SHORTCUTS[shortcut];
    }
}
ShortcutService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: ShortcutService, deps: [{ token: PLATFORM_ID }, { token: CONFIG }, { token: KeyboardEventsService }], target: i0.ɵɵFactoryTarget.Injectable });
ShortcutService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: ShortcutService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: ShortcutService, decorators: [{
            type: Injectable
        }], ctorParameters: function () {
        return [{ type: undefined, decorators: [{
                        type: Inject,
                        args: [PLATFORM_ID]
                    }] }, { type: undefined, decorators: [{
                        type: Inject,
                        args: [CONFIG]
                    }] }, { type: KeyboardEventsService }];
    } });

class SelectContainerComponent {
    constructor(platformId, shortcuts, keyboardEvents, hostElementRef, renderer, ngZone) {
        this.platformId = platformId;
        this.shortcuts = shortcuts;
        this.keyboardEvents = keyboardEvents;
        this.hostElementRef = hostElementRef;
        this.renderer = renderer;
        this.ngZone = ngZone;
        this.selectOnDrag = true;
        this.disabled = false;
        this.disableDrag = false;
        this.selectOnClick = true;
        this.dragOverItems = true;
        this.disableRangeSelection = false;
        this.selectMode = false;
        this.selectWithShortcut = false;
        this.custom = false;
        this.hostClass = true;
        this.selectedItemsChange = new EventEmitter();
        this.select = new EventEmitter();
        this.itemSelected = new EventEmitter();
        this.itemDeselected = new EventEmitter();
        this.selectionStarted = new EventEmitter();
        this.selectionEnded = new EventEmitter();
        this._tmpItems = new Map();
        this._selectedItems$ = new BehaviorSubject([]);
        this._selectableItems = [];
        this.updateItems$ = new Subject();
        this.destroy$ = new Subject();
        this._lastRange = [-1, -1];
        this._lastStartIndex = undefined;
        this._newRangeStart = false;
        this._lastRangeSelection = new Map();
    }
    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.host = this.hostElementRef.nativeElement;
            this._initSelectedItemsChange();
            this._calculateBoundingClientRect();
            this._observeBoundingRectChanges();
            this._observeSelectableItems();
            const mouseup$ = this.keyboardEvents.mouseup$.pipe(filter(() => !this.disabled), tap(() => this._onMouseUp()), share());
            const mousemove$ = this.keyboardEvents.mousemove$.pipe(filter(() => !this.disabled), share());
            const mousedown$ = fromEvent(this.host, 'mousedown').pipe(filter((event) => event.button === 0), // only emit left mouse
            filter(() => !this.disabled), filter((event) => this.selectOnClick || event.target === this.host), tap((event) => this._onMouseDown(event)), share());
            const dragging$ = mousedown$.pipe(filter((event) => !this.shortcuts.disableSelection(event)), filter(() => !this.selectMode), filter(() => !this.disableDrag), filter((event) => this.dragOverItems || event.target === this.host), switchMap(() => mousemove$.pipe(takeUntil(mouseup$))), share());
            const currentMousePosition$ = mousedown$.pipe(map((event) => getRelativeMousePosition(event, this.host)));
            const show$ = dragging$.pipe(mapTo(1));
            const hide$ = mouseup$.pipe(mapTo(0));
            const opacity$ = merge(show$, hide$).pipe(distinctUntilChanged());
            const selectBox$ = combineLatest([dragging$, opacity$, currentMousePosition$]).pipe(createSelectBox(this.host), share());
            this.selectBoxClasses$ = merge(dragging$, mouseup$, this.keyboardEvents.distinctKeydown$, this.keyboardEvents.distinctKeyup$).pipe(auditTime(AUDIT_TIME), withLatestFrom(selectBox$), map(([event, selectBox]) => {
                return {
                    'dts-adding': hasMinimumSize(selectBox, 0, 0) && !this.shortcuts.removeFromSelection(event),
                    'dts-removing': this.shortcuts.removeFromSelection(event),
                };
            }), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)));
            const selectOnMouseUp$ = dragging$.pipe(filter(() => !this.selectOnDrag), filter(() => !this.selectMode), filter((event) => this._cursorWithinHost(event)), switchMap((_) => mouseup$.pipe(first())), filter((event) => (!this.shortcuts.disableSelection(event) && !this.shortcuts.toggleSingleItem(event)) ||
                this.shortcuts.removeFromSelection(event)));
            const selectOnDrag$ = selectBox$.pipe(auditTime(AUDIT_TIME), withLatestFrom(mousemove$, (selectBox, event) => ({
                selectBox,
                event,
            })), filter(() => this.selectOnDrag), filter(({ selectBox }) => hasMinimumSize(selectBox)), map(({ event }) => event));
            const selectOnKeyboardEvent$ = merge(this.keyboardEvents.distinctKeydown$, this.keyboardEvents.distinctKeyup$).pipe(auditTime(AUDIT_TIME), whenSelectBoxVisible(selectBox$), tap((event) => {
                if (this._isExtendedSelection(event)) {
                    this._tmpItems.clear();
                }
                else {
                    this._flushItems();
                }
            }));
            merge(selectOnMouseUp$, selectOnDrag$, selectOnKeyboardEvent$)
                .pipe(takeUntil(this.destroy$))
                .subscribe((event) => this._selectItems(event));
            this.selectBoxStyles$ = selectBox$.pipe(map((selectBox) => ({
                top: `${selectBox.top}px`,
                left: `${selectBox.left}px`,
                width: `${selectBox.width}px`,
                height: `${selectBox.height}px`,
                opacity: selectBox.opacity,
            })));
            this._initSelectionOutputs(mousedown$, mouseup$);
        }
    }
    ngAfterContentInit() {
        this._selectableItems = this.$selectableItems.toArray();
    }
    selectAll() {
        this.$selectableItems.forEach((item) => {
            this._selectItem(item);
        });
    }
    toggleItems(predicate) {
        this._filterSelectableItems(predicate).subscribe((item) => this._toggleItem(item));
    }
    selectItems(predicate) {
        this._filterSelectableItems(predicate).subscribe((item) => this._selectItem(item));
    }
    deselectItems(predicate) {
        this._filterSelectableItems(predicate).subscribe((item) => this._deselectItem(item));
    }
    clearSelection() {
        this.$selectableItems.forEach((item) => {
            this._deselectItem(item);
        });
    }
    update() {
        this._calculateBoundingClientRect();
        this.$selectableItems.forEach((item) => item.calculateBoundingClientRect());
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
    _filterSelectableItems(predicate) {
        // Wrap select items in an observable for better efficiency as
        // no intermediate arrays are created and we only need to process
        // every item once.
        return from(this._selectableItems).pipe(filter((item) => predicate(item.value)));
    }
    _initSelectedItemsChange() {
        this._selectedItems$.pipe(auditTime(AUDIT_TIME), takeUntil(this.destroy$)).subscribe({
            next: (selectedItems) => {
                this.selectedItemsChange.emit(selectedItems);
                this.select.emit(selectedItems);
            },
            complete: () => {
                this.selectedItemsChange.emit([]);
            },
        });
    }
    _observeSelectableItems() {
        // Listen for updates and either select or deselect an item
        this.updateItems$
            .pipe(withLatestFrom(this._selectedItems$), takeUntil(this.destroy$), filter(([update]) => !update.item.dtsDisabled))
            .subscribe(([update, selectedItems]) => {
            const item = update.item;
            switch (update.type) {
                case UpdateActions.Add:
                    if (this._addItem(item, selectedItems)) {
                        item._select();
                    }
                    break;
                case UpdateActions.Remove:
                    if (this._removeItem(item, selectedItems)) {
                        item._deselect();
                    }
                    break;
            }
        });
        // Update the container as well as all selectable items if the list has changed
        this.$selectableItems.changes
            .pipe(withLatestFrom(this._selectedItems$), observeOn(asyncScheduler), takeUntil(this.destroy$))
            .subscribe(([items, selectedItems]) => {
            const newList = items.toArray();
            this._selectableItems = newList;
            const newValues = newList.map((item) => item.value);
            const removedItems = selectedItems.filter((item) => !newValues.includes(item));
            if (removedItems.length) {
                removedItems.forEach((item) => this._removeItem(item, selectedItems));
            }
            this.update();
        });
    }
    _observeBoundingRectChanges() {
        this.ngZone.runOutsideAngular(() => {
            const resize$ = fromEvent(window, 'resize');
            const windowScroll$ = fromEvent(window, 'scroll');
            const containerScroll$ = fromEvent(this.host, 'scroll');
            merge(resize$, windowScroll$, containerScroll$)
                .pipe(startWith('INITIAL_UPDATE'), auditTime(AUDIT_TIME), takeUntil(this.destroy$))
                .subscribe(() => {
                this.update();
            });
        });
    }
    _initSelectionOutputs(mousedown$, mouseup$) {
        mousedown$
            .pipe(filter((event) => this._cursorWithinHost(event)), tap(() => this.selectionStarted.emit()), concatMapTo(mouseup$.pipe(first())), withLatestFrom(this._selectedItems$), map(([, items]) => items), takeUntil(this.destroy$))
            .subscribe((items) => {
            this.selectionEnded.emit(items);
        });
    }
    _calculateBoundingClientRect() {
        this.host.boundingClientRect = calculateBoundingClientRect(this.host);
    }
    _cursorWithinHost(event) {
        return cursorWithinElement(event, this.host);
    }
    _onMouseUp() {
        this._flushItems();
        this.renderer.removeClass(document.body, NO_SELECT_CLASS);
    }
    _onMouseDown(event) {
        if (this.shortcuts.disableSelection(event) || this.disabled) {
            return;
        }
        clearSelection(window);
        if (!this.disableDrag) {
            this.renderer.addClass(document.body, NO_SELECT_CLASS);
        }
        if (this.shortcuts.removeFromSelection(event)) {
            return;
        }
        const mousePoint = getMousePosition(event);
        const [currentIndex, clickedItem] = this._getClosestSelectItem(event);
        let [startIndex, endIndex] = this._lastRange;
        const isMoveRangeStart = this.shortcuts.moveRangeStart(event);
        const shouldResetRangeSelection = !this.shortcuts.extendedSelectionShortcut(event) || isMoveRangeStart || this.disableRangeSelection;
        if (shouldResetRangeSelection) {
            this._resetRangeStart();
        }
        // move range start
        if (shouldResetRangeSelection && !this.disableRangeSelection) {
            if (currentIndex > -1) {
                this._newRangeStart = true;
                this._lastStartIndex = currentIndex;
                clickedItem.toggleRangeStart();
                this._lastRangeSelection.clear();
            }
            else {
                this._lastStartIndex = -1;
            }
        }
        if (currentIndex > -1) {
            startIndex = Math.min(this._lastStartIndex, currentIndex);
            endIndex = Math.max(this._lastStartIndex, currentIndex);
            this._lastRange = [startIndex, endIndex];
        }
        if (isMoveRangeStart) {
            return;
        }
        this.$selectableItems.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const withinBoundingBox = inBoundingBox(mousePoint, itemRect);
            if (this.shortcuts.extendedSelectionShortcut(event) && this.disableRangeSelection) {
                return;
            }
            const withinRange = this.shortcuts.extendedSelectionShortcut(event) &&
                startIndex > -1 &&
                endIndex > -1 &&
                index >= startIndex &&
                index <= endIndex &&
                startIndex !== endIndex;
            const shouldAdd = (withinBoundingBox &&
                !this.shortcuts.toggleSingleItem(event) &&
                !this.selectMode &&
                !this.selectWithShortcut) ||
                (this.shortcuts.extendedSelectionShortcut(event) && item.selected && !this._lastRangeSelection.get(item)) ||
                withinRange ||
                (withinBoundingBox && this.shortcuts.toggleSingleItem(event) && !item.selected) ||
                (!withinBoundingBox && this.shortcuts.toggleSingleItem(event) && item.selected) ||
                (withinBoundingBox && !item.selected && this.selectMode) ||
                (!withinBoundingBox && item.selected && this.selectMode);
            const shouldRemove = (!withinBoundingBox &&
                !this.shortcuts.toggleSingleItem(event) &&
                !this.selectMode &&
                !this.shortcuts.extendedSelectionShortcut(event) &&
                !this.selectWithShortcut) ||
                (this.shortcuts.extendedSelectionShortcut(event) && currentIndex > -1) ||
                (!withinBoundingBox && this.shortcuts.toggleSingleItem(event) && !item.selected) ||
                (withinBoundingBox && this.shortcuts.toggleSingleItem(event) && item.selected) ||
                (!withinBoundingBox && !item.selected && this.selectMode) ||
                (withinBoundingBox && item.selected && this.selectMode);
            if (shouldAdd) {
                this._selectItem(item);
            }
            else if (shouldRemove) {
                this._deselectItem(item);
            }
            if (withinRange && !this._lastRangeSelection.get(item)) {
                this._lastRangeSelection.set(item, true);
            }
            else if (!withinRange && !this._newRangeStart && !item.selected) {
                this._lastRangeSelection.delete(item);
            }
        });
        // if we don't toggle a single item, we set `newRangeStart` to `false`
        // meaning that we are building up a range
        if (!this.shortcuts.toggleSingleItem(event)) {
            this._newRangeStart = false;
        }
    }
    _selectItems(event) {
        const selectionBox = calculateBoundingClientRect(this.$selectBox.nativeElement);
        this.$selectableItems.forEach((item, index) => {
            if (this._isExtendedSelection(event)) {
                this._extendedSelectionMode(selectionBox, item, event);
            }
            else {
                this._normalSelectionMode(selectionBox, item, event);
                if (this._lastStartIndex < 0 && item.selected) {
                    item.toggleRangeStart();
                    this._lastStartIndex = index;
                }
            }
        });
    }
    _isExtendedSelection(event) {
        return this.shortcuts.extendedSelectionShortcut(event) && this.selectOnDrag;
    }
    _normalSelectionMode(selectBox, item, event) {
        const inSelection = boxIntersects(selectBox, item.getBoundingClientRect());
        const shouldAdd = inSelection && !item.selected && !this.shortcuts.removeFromSelection(event);
        const shouldRemove = (!inSelection && item.selected && !this.shortcuts.addToSelection(event)) ||
            (inSelection && item.selected && this.shortcuts.removeFromSelection(event));
        if (shouldAdd) {
            this._selectItem(item);
        }
        else if (shouldRemove) {
            this._deselectItem(item);
        }
    }
    _extendedSelectionMode(selectBox, item, event) {
        const inSelection = boxIntersects(selectBox, item.getBoundingClientRect());
        const shoudlAdd = (inSelection && !item.selected && !this.shortcuts.removeFromSelection(event) && !this._tmpItems.has(item)) ||
            (inSelection && item.selected && this.shortcuts.removeFromSelection(event) && !this._tmpItems.has(item));
        const shouldRemove = (!inSelection && item.selected && this.shortcuts.addToSelection(event) && this._tmpItems.has(item)) ||
            (!inSelection && !item.selected && this.shortcuts.removeFromSelection(event) && this._tmpItems.has(item));
        if (shoudlAdd) {
            if (item.selected) {
                item._deselect();
            }
            else {
                item._select();
            }
            const action = this.shortcuts.removeFromSelection(event)
                ? Action.Delete
                : this.shortcuts.addToSelection(event)
                    ? Action.Add
                    : Action.None;
            this._tmpItems.set(item, action);
        }
        else if (shouldRemove) {
            if (this.shortcuts.removeFromSelection(event)) {
                item._select();
            }
            else {
                item._deselect();
            }
            this._tmpItems.delete(item);
        }
    }
    _flushItems() {
        this._tmpItems.forEach((action, item) => {
            if (action === Action.Add) {
                this._selectItem(item);
            }
            if (action === Action.Delete) {
                this._deselectItem(item);
            }
        });
        this._tmpItems.clear();
    }
    _addItem(item, selectedItems) {
        let success = false;
        if (!this._hasItem(item, selectedItems)) {
            success = true;
            selectedItems.push(item.value);
            this._selectedItems$.next(selectedItems);
            this.itemSelected.emit(item.value);
        }
        return success;
    }
    _removeItem(item, selectedItems) {
        let success = false;
        const value = item instanceof SelectItemDirective ? item.value : item;
        const index = selectedItems.indexOf(value);
        if (index > -1) {
            success = true;
            selectedItems.splice(index, 1);
            this._selectedItems$.next(selectedItems);
            this.itemDeselected.emit(value);
        }
        return success;
    }
    _toggleItem(item) {
        if (item.selected) {
            this._deselectItem(item);
        }
        else {
            this._selectItem(item);
        }
    }
    _selectItem(item) {
        this.updateItems$.next({ type: UpdateActions.Add, item });
    }
    _deselectItem(item) {
        this.updateItems$.next({ type: UpdateActions.Remove, item });
    }
    _hasItem(item, selectedItems) {
        return selectedItems.includes(item.value);
    }
    _getClosestSelectItem(event) {
        const target = event.target.closest('.dts-select-item');
        let index = -1;
        let targetItem = null;
        if (target) {
            targetItem = target[SELECT_ITEM_INSTANCE];
            index = this._selectableItems.indexOf(targetItem);
        }
        return [index, targetItem];
    }
    _resetRangeStart() {
        this._lastRange = [-1, -1];
        const lastRangeStart = this._getLastRangeSelection();
        if (lastRangeStart && lastRangeStart.rangeStart) {
            lastRangeStart.toggleRangeStart();
        }
    }
    _getLastRangeSelection() {
        if (this._lastStartIndex >= 0) {
            return this._selectableItems[this._lastStartIndex];
        }
        return null;
    }
}
SelectContainerComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: SelectContainerComponent, deps: [{ token: PLATFORM_ID }, { token: ShortcutService }, { token: KeyboardEventsService }, { token: i0.ElementRef }, { token: i0.Renderer2 }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
SelectContainerComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.3", type: SelectContainerComponent, selector: "dts-select-container", inputs: { selectedItems: "selectedItems", selectOnDrag: "selectOnDrag", disabled: "disabled", disableDrag: "disableDrag", selectOnClick: "selectOnClick", dragOverItems: "dragOverItems", disableRangeSelection: "disableRangeSelection", selectMode: "selectMode", selectWithShortcut: "selectWithShortcut", custom: "custom" }, outputs: { selectedItemsChange: "selectedItemsChange", select: "select", itemSelected: "itemSelected", itemDeselected: "itemDeselected", selectionStarted: "selectionStarted", selectionEnded: "selectionEnded" }, host: { properties: { "class.dts-custom": "this.custom", "class.dts-select-container": "this.hostClass" } }, queries: [{ propertyName: "$selectableItems", predicate: SelectItemDirective, descendants: true }], viewQueries: [{ propertyName: "$selectBox", first: true, predicate: ["selectBox"], descendants: true, static: true }], exportAs: ["dts-select-container"], ngImport: i0, template: `
    <ng-content></ng-content>
    <div
      class="dts-select-box"
      #selectBox
      [ngClass]="selectBoxClasses$ | async"
      [ngStyle]="selectBoxStyles$ | async"
    ></div>
  `, isInline: true, styles: [":host{display:block;position:relative}\n"], directives: [{ type: i3.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }], pipes: { "async": i3.AsyncPipe } });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: SelectContainerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'dts-select-container', exportAs: 'dts-select-container', template: `
    <ng-content></ng-content>
    <div
      class="dts-select-box"
      #selectBox
      [ngClass]="selectBoxClasses$ | async"
      [ngStyle]="selectBoxStyles$ | async"
    ></div>
  `, styles: [":host{display:block;position:relative}\n"] }]
        }], ctorParameters: function () {
        return [{ type: undefined, decorators: [{
                        type: Inject,
                        args: [PLATFORM_ID]
                    }] }, { type: ShortcutService }, { type: KeyboardEventsService }, { type: i0.ElementRef }, { type: i0.Renderer2 }, { type: i0.NgZone }];
    }, propDecorators: { $selectBox: [{
                type: ViewChild,
                args: ['selectBox', { static: true }]
            }], $selectableItems: [{
                type: ContentChildren,
                args: [SelectItemDirective, { descendants: true }]
            }], selectedItems: [{
                type: Input
            }], selectOnDrag: [{
                type: Input
            }], disabled: [{
                type: Input
            }], disableDrag: [{
                type: Input
            }], selectOnClick: [{
                type: Input
            }], dragOverItems: [{
                type: Input
            }], disableRangeSelection: [{
                type: Input
            }], selectMode: [{
                type: Input
            }], selectWithShortcut: [{
                type: Input
            }], custom: [{
                type: Input
            }, {
                type: HostBinding,
                args: ['class.dts-custom']
            }], hostClass: [{
                type: HostBinding,
                args: ['class.dts-select-container']
            }], selectedItemsChange: [{
                type: Output
            }], select: [{
                type: Output
            }], itemSelected: [{
                type: Output
            }], itemDeselected: [{
                type: Output
            }], selectionStarted: [{
                type: Output
            }], selectionEnded: [{
                type: Output
            }] } });

const COMPONENTS = [SelectContainerComponent, SelectItemDirective];
function configFactory(config) {
    return mergeDeep(DEFAULT_CONFIG, config);
}
class DragToSelectModule {
    static forRoot(config = {}) {
        return {
            ngModule: DragToSelectModule,
            providers: [
                ShortcutService,
                KeyboardEventsService,
                { provide: USER_CONFIG, useValue: config },
                {
                    provide: CONFIG,
                    useFactory: configFactory,
                    deps: [USER_CONFIG],
                },
            ],
        };
    }
}
DragToSelectModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DragToSelectModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
DragToSelectModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DragToSelectModule, declarations: [SelectContainerComponent, SelectItemDirective], imports: [CommonModule], exports: [SelectContainerComponent, SelectItemDirective] });
DragToSelectModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DragToSelectModule, imports: [[CommonModule]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DragToSelectModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [CommonModule],
                    declarations: [...COMPONENTS],
                    exports: [...COMPONENTS],
                }]
        }] });

/*
 * Public API Surface of ngx-drag-to-select
 */

/**
 * Generated bundle index. Do not edit.
 */

export { DragToSelectModule, SELECT_ITEM_INSTANCE, SelectContainerComponent, SelectItemDirective };
//# sourceMappingURL=ngx-drag-to-select.mjs.map
