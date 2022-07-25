import { Component, ElementRef, Output, EventEmitter, Input, Renderer2, ViewChild, NgZone, ContentChildren, QueryList, HostBinding, PLATFORM_ID, Inject, } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, combineLatest, merge, from, fromEvent, BehaviorSubject, asyncScheduler } from 'rxjs';
import { switchMap, takeUntil, map, tap, filter, auditTime, mapTo, share, withLatestFrom, distinctUntilChanged, observeOn, startWith, concatMapTo, first, } from 'rxjs/operators';
import { SelectItemDirective, SELECT_ITEM_INSTANCE } from './select-item.directive';
import { ShortcutService } from './shortcut.service';
import { createSelectBox, whenSelectBoxVisible } from './operators';
import { Action, UpdateActions, } from './models';
import { AUDIT_TIME, NO_SELECT_CLASS } from './constants';
import { inBoundingBox, cursorWithinElement, clearSelection, boxIntersects, calculateBoundingClientRect, getRelativeMousePosition, getMousePosition, hasMinimumSize, } from './utils';
import { KeyboardEventsService } from './keyboard-events.service';
import * as i0 from "@angular/core";
import * as i1 from "./shortcut.service";
import * as i2 from "./keyboard-events.service";
import * as i3 from "@angular/common";
export class SelectContainerComponent {
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
SelectContainerComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: SelectContainerComponent, deps: [{ token: PLATFORM_ID }, { token: i1.ShortcutService }, { token: i2.KeyboardEventsService }, { token: i0.ElementRef }, { token: i0.Renderer2 }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
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
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }, { type: i1.ShortcutService }, { type: i2.KeyboardEventsService }, { type: i0.ElementRef }, { type: i0.Renderer2 }, { type: i0.NgZone }]; }, propDecorators: { $selectBox: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LWNvbnRhaW5lci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtZHJhZy10by1zZWxlY3Qvc3JjL2xpYi9zZWxlY3QtY29udGFpbmVyLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixNQUFNLEVBQ04sWUFBWSxFQUNaLEtBQUssRUFFTCxTQUFTLEVBQ1QsU0FBUyxFQUNULE1BQU0sRUFDTixlQUFlLEVBQ2YsU0FBUyxFQUNULFdBQVcsRUFFWCxXQUFXLEVBQ1gsTUFBTSxHQUVQLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRXBELE9BQU8sRUFBYyxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFFbkgsT0FBTyxFQUNMLFNBQVMsRUFDVCxTQUFTLEVBQ1QsR0FBRyxFQUNILEdBQUcsRUFDSCxNQUFNLEVBQ04sU0FBUyxFQUNULEtBQUssRUFDTCxLQUFLLEVBQ0wsY0FBYyxFQUNkLG9CQUFvQixFQUNwQixTQUFTLEVBQ1QsU0FBUyxFQUNULFdBQVcsRUFDWCxLQUFLLEdBQ04sTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QixPQUFPLEVBQUUsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUNwRixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFckQsT0FBTyxFQUFFLGVBQWUsRUFBRSxvQkFBb0IsRUFBcUIsTUFBTSxhQUFhLENBQUM7QUFFdkYsT0FBTyxFQUNMLE1BQU0sRUFLTixhQUFhLEdBR2QsTUFBTSxVQUFVLENBQUM7QUFFbEIsT0FBTyxFQUFFLFVBQVUsRUFBRSxlQUFl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c0JBQW5CLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFJTixNQUFNO3NCQUZMLEtBQUs7O3NCQUNMLFdBQVc7dUJBQUMsa0JBQWtCO2dCQUl0QixTQUFTO3NCQURqQixXQUFXO3VCQUFDLDRCQUE0QjtnQkFJekMsbUJBQW1CO3NCQURsQixNQUFNO2dCQUVHLE1BQU07c0JBQWYsTUFBTTtnQkFDRyxZQUFZO3NCQUFyQixNQUFNO2dCQUNHLGNBQWM7c0JBQXZCLE1BQU07Z0JBQ0csZ0JBQWdCO3NCQUF6QixNQUFNO2dCQUNHLGNBQWM7c0JBQXZCLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIE91dHB1dCxcbiAgRXZlbnRFbWl0dGVyLFxuICBJbnB1dCxcbiAgT25EZXN0cm95LFxuICBSZW5kZXJlcjIsXG4gIFZpZXdDaGlsZCxcbiAgTmdab25lLFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIFF1ZXJ5TGlzdCxcbiAgSG9zdEJpbmRpbmcsXG4gIEFmdGVyVmlld0luaXQsXG4gIFBMQVRGT1JNX0lELFxuICBJbmplY3QsXG4gIEFmdGVyQ29udGVudEluaXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQgeyBpc1BsYXRmb3JtQnJvd3NlciB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5cbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QsIGNvbWJpbmVMYXRlc3QsIG1lcmdlLCBmcm9tLCBmcm9tRXZlbnQsIEJlaGF2aW9yU3ViamVjdCwgYXN5bmNTY2hlZHVsZXIgfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtcbiAgc3dpdGNoTWFwLFxuICB0YWtlVW50aWwsXG4gIG1hcCxcbiAgdGFwLFxuICBmaWx0ZXIsXG4gIGF1ZGl0VGltZSxcbiAgbWFwVG8sXG4gIHNoYXJlLFxuICB3aXRoTGF0ZXN0RnJvbSxcbiAgZGlzdGluY3RVbnRpbENoYW5nZWQsXG4gIG9ic2VydmVPbixcbiAgc3RhcnRXaXRoLFxuICBjb25jYXRNYXBUbyxcbiAgZmlyc3QsXG59IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHsgU2VsZWN0SXRlbURpcmVjdGl2ZSwgU0VMRUNUX0lURU1fSU5TVEFOQ0UgfSBmcm9tICcuL3NlbGVjdC1pdGVtLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBTaG9ydGN1dFNlcnZpY2UgfSBmcm9tICcuL3Nob3J0Y3V0LnNlcnZpY2UnO1xuXG5pbXBvcnQgeyBjcmVhdGVTZWxlY3RCb3gsIHdoZW5TZWxlY3RCb3hWaXNpYmxlLCBkaXN0aW5jdEtleUV2ZW50cyB9IGZyb20gJy4vb3BlcmF0b3JzJztcblxuaW1wb3J0IHtcbiAgQWN0aW9uLFxuICBTZWxlY3RCb3gsXG4gIE1vdXNlUG9zaXRpb24sXG4gIFNlbGVjdENvbnRhaW5lckhvc3QsXG4gIFVwZGF0ZUFjdGlvbixcbiAgVXBkYXRlQWN0aW9ucyxcbiAgUHJlZGljYXRlRm4sXG4gIEJvdW5kaW5nQm94LFxufSBmcm9tICcuL21vZGVscyc7XG5cbmltcG9ydCB7IEFVRElUX1RJTUUsIE5PX1NFTEVDVF9DTEFTUyB9IGZyb20gJy4vY29uc3RhbnRzJztcblxuaW1wb3J0IHtcbiAgaW5Cb3VuZGluZ0JveCxcbiAgY3Vyc29yV2l0aGluRWxlbWVudCxcbiAgY2xlYXJTZWxlY3Rpb24sXG4gIGJveEludGVyc2VjdHMsXG4gIGNhbGN1bGF0ZUJvdW5kaW5nQ2xpZW50UmVjdCxcbiAgZ2V0UmVsYXRpdmVNb3VzZVBvc2l0aW9uLFxuICBnZXRNb3VzZVBvc2l0aW9uLFxuICBoYXNNaW5pbXVtU2l6ZSxcbn0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBLZXlib2FyZEV2ZW50c1NlcnZpY2UgfSBmcm9tICcuL2tleWJvYXJkLWV2ZW50cy5zZXJ2aWNlJztcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnZHRzLXNlbGVjdC1jb250YWluZXInLFxuICBleHBvcnRBczogJ2R0cy1zZWxlY3QtY29udGFpbmVyJyxcbiAgdGVtcGxhdGU6IGBcbiAgICA8bmctY29udGVudD48L25nLWNvbnRlbnQ+XG4gICAgPGRpdlxuICAgICAgY2xhc3M9XCJkdHMtc2VsZWN0LWJveFwiXG4gICAgICAjc2VsZWN0Qm94XG4gICAgICBbbmdDbGFzc109XCJzZWxlY3RCb3hDbGFzc2VzJCB8IGFzeW5jXCJcbiAgICAgIFtuZ1N0eWxlXT1cInNlbGVjdEJveFN0eWxlcyQgfCBhc3luY1wiXG4gICAgPjwvZGl2PlxuICBgLFxuICBzdHlsZVVybHM6IFsnLi9zZWxlY3QtY29udGFpbmVyLmNvbXBvbmVudC5zY3NzJ10sXG59KVxuZXhwb3J0IGNsYXNzIFNlbGVjdENvbnRhaW5lckNvbXBvbmVudCBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSwgQWZ0ZXJDb250ZW50SW5pdCB7XG4gIGhvc3Q6IFNlbGVjdENvbnRhaW5lckhvc3Q7XG4gIHNlbGVjdEJveFN0eWxlcyQ6IE9ic2VydmFibGU8U2VsZWN0Qm94PHN0cmluZz4+O1xuICBzZWxlY3RCb3hDbGFzc2VzJDogT2JzZXJ2YWJsZTx7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfT47XG5cbiAgQFZpZXdDaGlsZCgnc2VsZWN0Qm94JywgeyBzdGF0aWM6IHRydWUgfSlcbiAgcHJpdmF0ZSAkc2VsZWN0Qm94OiBFbGVtZW50UmVmO1xuXG4gIEBDb250ZW50Q2hpbGRyZW4oU2VsZWN0SXRlbURpcmVjdGl2ZSwgeyBkZXNjZW5kYW50czogdHJ1ZSB9KVxuICBwcml2YXRlICRzZWxlY3RhYmxlSXRlbXM6IFF1ZXJ5TGlzdDxTZWxlY3RJdGVtRGlyZWN0aXZlPjtcblxuICBASW5wdXQoKSBzZWxlY3RlZEl0ZW1zOiBhbnk7XG4gIEBJbnB1dCgpIHNlbGVjdE9uRHJhZyA9IHRydWU7XG4gIEBJbnB1dCgpIGRpc2FibGVkID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVEcmFnID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdE9uQ2xpY2sgPSB0cnVlO1xuICBASW5wdXQoKSBkcmFnT3Zlckl0ZW1zID0gdHJ1ZTtcbiAgQElucHV0KCkgZGlzYWJsZVJhbmdlU2VsZWN0aW9uID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdE1vZGUgPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0V2l0aFNob3J0Y3V0ID0gZmFsc2U7XG5cbiAgQElucHV0KClcbiAgQEhvc3RCaW5kaW5nKCdjbGFzcy5kdHMtY3VzdG9tJylcbiAgY3VzdG9tID0gZmFsc2U7XG5cbiAgQEhvc3RCaW5kaW5nKCdjbGFzcy5kdHMtc2VsZWN0LWNvbnRhaW5lcicpXG4gIHJlYWRvbmx5IGhvc3RDbGFzcyA9IHRydWU7XG5cbiAgQE91dHB1dCgpXG4gIHNlbGVjdGVkSXRlbXNDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIHNlbGVjdCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICBAT3V0cHV0KCkgaXRlbVNlbGVjdGVkID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIEBPdXRwdXQoKSBpdGVtRGVzZWxlY3RlZCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICBAT3V0cHV0KCkgc2VsZWN0aW9uU3RhcnRlZCA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcbiAgQE91dHB1dCgpIHNlbGVjdGlvbkVuZGVkID0gbmV3IEV2ZW50RW1pdHRlcjxBcnJheTxhbnk+PigpO1xuXG4gIHByaXZhdGUgX3RtcEl0ZW1zID0gbmV3IE1hcDxTZWxlY3RJdGVtRGlyZWN0aXZlLCBBY3Rpb24+KCk7XG5cbiAgcHJpdmF0ZSBfc2VsZWN0ZWRJdGVtcyQgPSBuZXcgQmVoYXZpb3JTdWJqZWN0PEFycmF5PGFueT4+KFtdKTtcbiAgcHJpdmF0ZSBfc2VsZWN0YWJsZUl0ZW1zOiBBcnJheTxTZWxlY3RJdGVtRGlyZWN0aXZlPiA9IFtdO1xuICBwcml2YXRlIHVwZGF0ZUl0ZW1zJCA9IG5ldyBTdWJqZWN0PFVwZGF0ZUFjdGlvbj4oKTtcbiAgcHJpdmF0ZSBkZXN0cm95JCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgcHJpdmF0ZSBfbGFzdFJhbmdlOiBbbnVtYmVyLCBudW1iZXJdID0gWy0xLCAtMV07XG4gIHByaXZhdGUgX2xhc3RTdGFydEluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX25ld1JhbmdlU3RhcnQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfbGFzdFJhbmdlU2VsZWN0aW9uOiBNYXA8U2VsZWN0SXRlbURpcmVjdGl2ZSwgYm9vbGVhbj4gPSBuZXcgTWFwKCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChQTEFURk9STV9JRCkgcHJpdmF0ZSBwbGF0Zm9ybUlkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICBwcml2YXRlIHNob3J0Y3V0czogU2hvcnRjdXRTZXJ2aWNlLFxuICAgIHByaXZhdGUga2V5Ym9hcmRFdmVudHM6IEtleWJvYXJkRXZlbnRzU2VydmljZSxcbiAgICBwcml2YXRlIGhvc3RFbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgIHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICBwcml2YXRlIG5nWm9uZTogTmdab25lXG4gICkge31cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgaWYgKGlzUGxhdGZvcm1Ccm93c2VyKHRoaXMucGxhdGZvcm1JZCkpIHtcbiAgICAgIHRoaXMuaG9zdCA9IHRoaXMuaG9zdEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcblxuICAgICAgdGhpcy5faW5pdFNlbGVjdGVkSXRlbXNDaGFuZ2UoKTtcblxuICAgICAgdGhpcy5fY2FsY3VsYXRlQm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICB0aGlzLl9vYnNlcnZlQm91bmRpbmdSZWN0Q2hhbmdlcygpO1xuICAgICAgdGhpcy5fb2JzZXJ2ZVNlbGVjdGFibGVJdGVtcygpO1xuXG4gICAgICBjb25zdCBtb3VzZXVwJCA9IHRoaXMua2V5Ym9hcmRFdmVudHMubW91c2V1cCQucGlwZShcbiAgICAgICAgZmlsdGVyKCgpID0+ICF0aGlzLmRpc2FibGVkKSxcbiAgICAgICAgdGFwKCgpID0+IHRoaXMuX29uTW91c2VVcCgpKSxcbiAgICAgICAgc2hhcmUoKVxuICAgICAgKTtcblxuICAgICAgY29uc3QgbW91c2Vtb3ZlJCA9IHRoaXMua2V5Ym9hcmRFdmVudHMubW91c2Vtb3ZlJC5waXBlKFxuICAgICAgICBmaWx0ZXIoKCkgPT4gIXRoaXMuZGlzYWJsZWQpLFxuICAgICAgICBzaGFyZSgpXG4gICAgICApO1xuXG4gICAgICBjb25zdCBtb3VzZWRvd24kID0gZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KHRoaXMuaG9zdCwgJ21vdXNlZG93bicpLnBpcGUoXG4gICAgICAgIGZpbHRlcigoZXZlbnQpID0+IGV2ZW50LmJ1dHRvbiA9PT0gMCksIC8vIG9ubHkgZW1pdCBsZWZ0IG1vdXNlXG4gICAgICAgIGZpbHRlcigoKSA9PiAhdGhpcy5kaXNhYmxlZCksXG4gICAgICAgIGZpbHRlcigoZXZlbnQpID0+IHRoaXMuc2VsZWN0T25DbGljayB8fCBldmVudC50YXJnZXQgPT09IHRoaXMuaG9zdCksXG4gICAgICAgIHRhcCgoZXZlbnQpID0+IHRoaXMuX29uTW91c2VEb3duKGV2ZW50KSksXG4gICAgICAgIHNoYXJlKClcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGRyYWdnaW5nJCA9IG1vdXNlZG93biQucGlwZShcbiAgICAgICAgZmlsdGVyKChldmVudCkgPT4gIXRoaXMuc2hvcnRjdXRzLmRpc2FibGVTZWxlY3Rpb24oZXZlbnQpKSxcbiAgICAgICAgZmlsdGVyKCgpID0+ICF0aGlzLnNlbGVjdE1vZGUpLFxuICAgICAgICBmaWx0ZXIoKCkgPT4gIXRoaXMuZGlzYWJsZURyYWcpLFxuICAgICAgICBmaWx0ZXIoKGV2ZW50KSA9PiB0aGlzLmRyYWdPdmVySXRlbXMgfHwgZXZlbnQudGFyZ2V0ID09PSB0aGlzLmhvc3QpLFxuICAgICAgICBzd2l0Y2hNYXAoKCkgPT4gbW91c2Vtb3ZlJC5waXBlKHRha2VVbnRpbChtb3VzZXVwJCkpKSxcbiAgICAgICAgc2hhcmUoKVxuICAgICAgKTtcblxuICAgICAgY29uc3QgY3VycmVudE1vdXNlUG9zaXRpb24kOiBPYnNlcnZhYmxlPE1vdXNlUG9zaXRpb24+ID0gbW91c2Vkb3duJC5waXBlKFxuICAgICAgICBtYXAoKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiBnZXRSZWxhdGl2ZU1vdXNlUG9zaXRpb24oZXZlbnQsIHRoaXMuaG9zdCkpXG4gICAgICApO1xuXG4gICAgICBjb25zdCBzaG93JCA9IGRyYWdnaW5nJC5waXBlKG1hcFRvKDEpKTtcbiAgICAgIGNvbnN0IGhpZGUkID0gbW91c2V1cCQucGlwZShtYXBUbygwKSk7XG4gICAgICBjb25zdCBvcGFjaXR5JCA9IG1lcmdlKHNob3ckLCBoaWRlJCkucGlwZShkaXN0aW5jdFVudGlsQ2hhbmdlZCgpKTtcblxuICAgICAgY29uc3Qgc2VsZWN0Qm94JCA9IGNvbWJpbmVMYXRlc3QoW2RyYWdnaW5nJCwgb3BhY2l0eSQsIGN1cnJlbnRNb3VzZVBvc2l0aW9uJF0pLnBpcGUoXG4gICAgICAgIGNyZWF0ZVNlbGVjdEJveCh0aGlzLmhvc3QpLFxuICAgICAgICBzaGFyZSgpXG4gICAgICApO1xuXG4gICAgICB0aGlzLnNlbGVjdEJveENsYXNzZXMkID0gbWVyZ2UoXG4gICAgICAgIGRyYWdnaW5nJCxcbiAgICAgICAgbW91c2V1cCQsXG4gICAgICAgIHRoaXMua2V5Ym9hcmRFdmVudHMuZGlzdGluY3RLZXlkb3duJCxcbiAgICAgICAgdGhpcy5rZXlib2FyZEV2ZW50cy5kaXN0aW5jdEtleXVwJFxuICAgICAgKS5waXBlKFxuICAgICAgICBhdWRpdFRpbWUoQVVESVRfVElNRSksXG4gICAgICAgIHdpdGhMYXRlc3RGcm9tKHNlbGVjdEJveCQpLFxuICAgICAgICBtYXAoKFtldmVudCwgc2VsZWN0Qm94XSkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnZHRzLWFkZGluZyc6IGhhc01pbmltdW1TaXplKHNlbGVjdEJveCwgMCwgMCkgJiYgIXRoaXMuc2hvcnRjdXRzLnJlbW92ZUZyb21TZWxlY3Rpb24oZXZlbnQpLFxuICAgICAgICAgICAgJ2R0cy1yZW1vdmluZyc6IHRoaXMuc2hvcnRjdXRzLnJlbW92ZUZyb21TZWxlY3Rpb24oZXZlbnQpLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pLFxuICAgICAgICBkaXN0aW5jdFVudGlsQ2hhbmdlZCgoYSwgYikgPT4gSlNPTi5zdHJpbmdpZnkoYSkgPT09IEpTT04uc3RyaW5naWZ5KGIpKVxuICAgICAgKTtcblxuICAgICAgY29uc3Qgc2VsZWN0T25Nb3VzZVVwJCA9IGRyYWdnaW5nJC5waXBlKFxuICAgICAgICBmaWx0ZXIoKCkgPT4gIXRoaXMuc2VsZWN0T25EcmFnKSxcbiAgICAgICAgZmlsdGVyKCgpID0+ICF0aGlzLnNlbGVjdE1vZGUpLFxuICAgICAgICBmaWx0ZXIoKGV2ZW50KSA9PiB0aGlzLl9jdXJzb3JXaXRoaW5Ib3N0KGV2ZW50KSksXG4gICAgICAgIHN3aXRjaE1hcCgoXykgPT4gbW91c2V1cCQucGlwZShmaXJzdCgpKSksXG4gICAgICAgIGZpbHRlcihcbiAgICAgICAgICAoZXZlbnQpID0+XG4gICAgICAgICAgICAoIXRoaXMuc2hvcnRjdXRzLmRpc2FibGVTZWxlY3Rpb24oZXZlbnQpICYmICF0aGlzLnNob3J0Y3V0cy50b2dnbGVTaW5nbGVJdGVtKGV2ZW50KSkgfHxcbiAgICAgICAgICAgIHRoaXMuc2hvcnRjdXRzLnJlbW92ZUZyb21TZWxlY3Rpb24oZXZlbnQpXG4gICAgICAgIClcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHNlbGVjdE9uRHJhZyQgPSBzZWxlY3RCb3gkLnBpcGUoXG4gICAgICAgIGF1ZGl0VGltZShBVURJVF9USU1FKSxcbiAgICAgICAgd2l0aExhdGVzdEZyb20obW91c2Vtb3ZlJCwgKHNlbGVjdEJveCwgZXZlbnQ6IE1vdXNlRXZlbnQpID0+ICh7XG4gICAgICAgICAgc2VsZWN0Qm94LFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICB9KSksXG4gICAgICAgIGZpbHRlcigoKSA9PiB0aGlzLnNlbGVjdE9uRHJhZyksXG4gICAgICAgIGZpbHRlcigoeyBzZWxlY3RCb3ggfSkgPT4gaGFzTWluaW11bVNpemUoc2VsZWN0Qm94KSksXG4gICAgICAgIG1hcCgoeyBldmVudCB9KSA9PiBldmVudClcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHNlbGVjdE9uS2V5Ym9hcmRFdmVudCQgPSBtZXJnZShcbiAgICAgICAgdGhpcy5rZXlib2FyZEV2ZW50cy5kaXN0aW5jdEtleWRvd24kLFxuICAgICAgICB0aGlzLmtleWJvYXJkRXZlbnRzLmRpc3RpbmN0S2V5dXAkXG4gICAgICApLnBpcGUoXG4gICAgICAgIGF1ZGl0VGltZShBVURJVF9USU1FKSxcbiAgICAgICAgd2hlblNlbGVjdEJveFZpc2libGUoc2VsZWN0Qm94JCksXG4gICAgICAgIHRhcCgoZXZlbnQpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5faXNFeHRlbmRlZFNlbGVjdGlvbihldmVudCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3RtcEl0ZW1zLmNsZWFyKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2ZsdXNoSXRlbXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBtZXJnZShzZWxlY3RPbk1vdXNlVXAkLCBzZWxlY3RPbkRyYWckLCBzZWxlY3RPbktleWJvYXJkRXZlbnQkKVxuICAgICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95JCkpXG4gICAgICAgIC5zdWJzY3JpYmUoKGV2ZW50KSA9PiB0aGlzLl9zZWxlY3RJdGVtcyhldmVudCkpO1xuXG4gICAgICB0aGlzLnNlbGVjdEJveFN0eWxlcyQgPSBzZWxlY3RCb3gkLnBpcGUoXG4gICAgICAgIG1hcCgoc2VsZWN0Qm94KSA9PiAoe1xuICAgICAgICAgIHRvcDogYCR7c2VsZWN0Qm94LnRvcH1weGAsXG4gICAgICAgICAgbGVmdDogYCR7c2VsZWN0Qm94LmxlZnR9cHhgLFxuICAgICAgICAgIHdpZHRoOiBgJHtzZWxlY3RCb3gud2lkdGh9cHhgLFxuICAgICAgICAgIGhlaWdodDogYCR7c2VsZWN0Qm94LmhlaWdodH1weGAsXG4gICAgICAgICAgb3BhY2l0eTogc2VsZWN0Qm94Lm9wYWNpdHksXG4gICAgICAgIH0pKVxuICAgICAgKTtcblxuICAgICAgdGhpcy5faW5pdFNlbGVjdGlvbk91dHB1dHMobW91c2Vkb3duJCwgbW91c2V1cCQpO1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICB0aGlzLl9zZWxlY3RhYmxlSXRlbXMgPSB0aGlzLiRzZWxlY3RhYmxlSXRlbXMudG9BcnJheSgpO1xuICB9XG5cbiAgc2VsZWN0QWxsKCkge1xuICAgIHRoaXMuJHNlbGVjdGFibGVJdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICB0aGlzLl9zZWxlY3RJdGVtKGl0ZW0pO1xuICAgIH0pO1xuICB9XG5cbiAgdG9nZ2xlSXRlbXM8VD4ocHJlZGljYXRlOiBQcmVkaWNhdGVGbjxUPikge1xuICAgIHRoaXMuX2ZpbHRlclNlbGVjdGFibGVJdGVtcyhwcmVkaWNhdGUpLnN1YnNjcmliZSgoaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSkgPT4gdGhpcy5fdG9nZ2xlSXRlbShpdGVtKSk7XG4gIH1cblxuICBzZWxlY3RJdGVtczxUPihwcmVkaWNhdGU6IFByZWRpY2F0ZUZuPFQ+KSB7XG4gICAgdGhpcy5fZmlsdGVyU2VsZWN0YWJsZUl0ZW1zKHByZWRpY2F0ZSkuc3Vic2NyaWJlKChpdGVtOiBTZWxlY3RJdGVtRGlyZWN0aXZlKSA9PiB0aGlzLl9zZWxlY3RJdGVtKGl0ZW0pKTtcbiAgfVxuXG4gIGRlc2VsZWN0SXRlbXM8VD4ocHJlZGljYXRlOiBQcmVkaWNhdGVGbjxUPikge1xuICAgIHRoaXMuX2ZpbHRlclNlbGVjdGFibGVJdGVtcyhwcmVkaWNhdGUpLnN1YnNjcmliZSgoaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSkgPT4gdGhpcy5fZGVzZWxlY3RJdGVtKGl0ZW0pKTtcbiAgfVxuXG4gIGNsZWFyU2VsZWN0aW9uKCkge1xuICAgIHRoaXMuJHNlbGVjdGFibGVJdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICB0aGlzLl9kZXNlbGVjdEl0ZW0oaXRlbSk7XG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgdGhpcy5fY2FsY3VsYXRlQm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdGhpcy4kc2VsZWN0YWJsZUl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uY2FsY3VsYXRlQm91bmRpbmdDbGllbnRSZWN0KCkpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5kZXN0cm95JC5uZXh0KCk7XG4gICAgdGhpcy5kZXN0cm95JC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZmlsdGVyU2VsZWN0YWJsZUl0ZW1zPFQ+KHByZWRpY2F0ZTogUHJlZGljYXRlRm48VD4pIHtcbiAgICAvLyBXcmFwIHNlbGVjdCBpdGVtcyBpbiBhbiBvYnNlcnZhYmxlIGZvciBiZXR0ZXIgZWZmaWNpZW5jeSBhc1xuICAgIC8vIG5vIGludGVybWVkaWF0ZSBhcnJheXMgYXJlIGNyZWF0ZWQgYW5kIHdlIG9ubHkgbmVlZCB0byBwcm9jZXNzXG4gICAgLy8gZXZlcnkgaXRlbSBvbmNlLlxuICAgIHJldHVybiBmcm9tKHRoaXMuX3NlbGVjdGFibGVJdGVtcykucGlwZShmaWx0ZXIoKGl0ZW0pID0+IHByZWRpY2F0ZShpdGVtLnZhbHVlKSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW5pdFNlbGVjdGVkSXRlbXNDaGFuZ2UoKSB7XG4gICAgdGhpcy5fc2VsZWN0ZWRJdGVtcyQucGlwZShhdWRpdFRpbWUoQVVESVRfVElNRSksIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3kkKSkuc3Vic2NyaWJlKHtcbiAgICAgIG5leHQ6IChzZWxlY3RlZEl0ZW1zKSA9PiB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtc0NoYW5nZS5lbWl0KHNlbGVjdGVkSXRlbXMpO1xuICAgICAgICB0aGlzLnNlbGVjdC5lbWl0KHNlbGVjdGVkSXRlbXMpO1xuICAgICAgfSxcbiAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtc0NoYW5nZS5lbWl0KFtdKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9vYnNlcnZlU2VsZWN0YWJsZUl0ZW1zKCkge1xuICAgIC8vIExpc3RlbiBmb3IgdXBkYXRlcyBhbmQgZWl0aGVyIHNlbGVjdCBvciBkZXNlbGVjdCBhbiBpdGVtXG4gICAgdGhpcy51cGRhdGVJdGVtcyRcbiAgICAgIC5waXBlKFxuICAgICAgICB3aXRoTGF0ZXN0RnJvbSh0aGlzLl9zZWxlY3RlZEl0ZW1zJCksXG4gICAgICAgIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3kkKSxcbiAgICAgICAgZmlsdGVyKChbdXBkYXRlXSkgPT4gIXVwZGF0ZS5pdGVtLmR0c0Rpc2FibGVkKVxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZSgoW3VwZGF0ZSwgc2VsZWN0ZWRJdGVtc106IFtVcGRhdGVBY3Rpb24sIGFueVtdXSkgPT4ge1xuICAgICAgICBjb25zdCBpdGVtID0gdXBkYXRlLml0ZW07XG5cbiAgICAgICAgc3dpdGNoICh1cGRhdGUudHlwZSkge1xuICAgICAgICAgIGNhc2UgVXBkYXRlQWN0aW9ucy5BZGQ6XG4gICAgICAgICAgICBpZiAodGhpcy5fYWRkSXRlbShpdGVtLCBzZWxlY3RlZEl0ZW1zKSkge1xuICAgICAgICAgICAgICBpdGVtLl9zZWxlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgVXBkYXRlQWN0aW9ucy5SZW1vdmU6XG4gICAgICAgICAgICBpZiAodGhpcy5fcmVtb3ZlSXRlbShpdGVtLCBzZWxlY3RlZEl0ZW1zKSkge1xuICAgICAgICAgICAgICBpdGVtLl9kZXNlbGVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjb250YWluZXIgYXMgd2VsbCBhcyBhbGwgc2VsZWN0YWJsZSBpdGVtcyBpZiB0aGUgbGlzdCBoYXMgY2hhbmdlZFxuICAgIHRoaXMuJHNlbGVjdGFibGVJdGVtcy5jaGFuZ2VzXG4gICAgICAucGlwZSh3aXRoTGF0ZXN0RnJvbSh0aGlzLl9zZWxlY3RlZEl0ZW1zJCksIG9ic2VydmVPbihhc3luY1NjaGVkdWxlciksIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3kkKSlcbiAgICAgIC5zdWJzY3JpYmUoKFtpdGVtcywgc2VsZWN0ZWRJdGVtc106IFtRdWVyeUxpc3Q8U2VsZWN0SXRlbURpcmVjdGl2ZT4sIGFueVtdXSkgPT4ge1xuICAgICAgICBjb25zdCBuZXdMaXN0ID0gaXRlbXMudG9BcnJheSgpO1xuICAgICAgICB0aGlzLl9zZWxlY3RhYmxlSXRlbXMgPSBuZXdMaXN0O1xuICAgICAgICBjb25zdCBuZXdWYWx1ZXMgPSBuZXdMaXN0Lm1hcCgoaXRlbSkgPT4gaXRlbS52YWx1ZSk7XG4gICAgICAgIGNvbnN0IHJlbW92ZWRJdGVtcyA9IHNlbGVjdGVkSXRlbXMuZmlsdGVyKChpdGVtKSA9PiAhbmV3VmFsdWVzLmluY2x1ZGVzKGl0ZW0pKTtcblxuICAgICAgICBpZiAocmVtb3ZlZEl0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgIHJlbW92ZWRJdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB0aGlzLl9yZW1vdmVJdGVtKGl0ZW0sIHNlbGVjdGVkSXRlbXMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX29ic2VydmVCb3VuZGluZ1JlY3RDaGFuZ2VzKCkge1xuICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGNvbnN0IHJlc2l6ZSQgPSBmcm9tRXZlbnQod2luZG93LCAncmVzaXplJyk7XG4gICAgICBjb25zdCB3aW5kb3dTY3JvbGwkID0gZnJvbUV2ZW50KHdpbmRvdywgJ3Njcm9sbCcpO1xuICAgICAgY29uc3QgY29udGFpbmVyU2Nyb2xsJCA9IGZyb21FdmVudCh0aGlzLmhvc3QsICdzY3JvbGwnKTtcblxuICAgICAgbWVyZ2UocmVzaXplJCwgd2luZG93U2Nyb2xsJCwgY29udGFpbmVyU2Nyb2xsJClcbiAgICAgICAgLnBpcGUoc3RhcnRXaXRoKCdJTklUSUFMX1VQREFURScpLCBhdWRpdFRpbWUoQVVESVRfVElNRSksIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3kkKSlcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9pbml0U2VsZWN0aW9uT3V0cHV0cyhtb3VzZWRvd24kOiBPYnNlcnZhYmxlPE1vdXNlRXZlbnQ+LCBtb3VzZXVwJDogT2JzZXJ2YWJsZTxNb3VzZUV2ZW50Pikge1xuICAgIG1vdXNlZG93biRcbiAgICAgIC5waXBlKFxuICAgICAgICBmaWx0ZXIoKGV2ZW50KSA9PiB0aGlzLl9jdXJzb3JXaXRoaW5Ib3N0KGV2ZW50KSksXG4gICAgICAgIHRhcCgoKSA9PiB0aGlzLnNlbGVjdGlvblN0YXJ0ZWQuZW1pdCgpKSxcbiAgICAgICAgY29uY2F0TWFwVG8obW91c2V1cCQucGlwZShmaXJzdCgpKSksXG4gICAgICAgIHdpdGhMYXRlc3RGcm9tKHRoaXMuX3NlbGVjdGVkSXRlbXMkKSxcbiAgICAgICAgbWFwKChbLCBpdGVtc10pID0+IGl0ZW1zKSxcbiAgICAgICAgdGFrZVVudGlsKHRoaXMuZGVzdHJveSQpXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKChpdGVtcykgPT4ge1xuICAgICAgICB0aGlzLnNlbGVjdGlvbkVuZGVkLmVtaXQoaXRlbXMpO1xuICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9jYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QoKSB7XG4gICAgdGhpcy5ob3N0LmJvdW5kaW5nQ2xpZW50UmVjdCA9IGNhbGN1bGF0ZUJvdW5kaW5nQ2xpZW50UmVjdCh0aGlzLmhvc3QpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3Vyc29yV2l0aGluSG9zdChldmVudDogTW91c2VFdmVudCkge1xuICAgIHJldHVybiBjdXJzb3JXaXRoaW5FbGVtZW50KGV2ZW50LCB0aGlzLmhvc3QpO1xuICB9XG5cbiAgcHJpdmF0ZSBfb25Nb3VzZVVwKCkge1xuICAgIHRoaXMuX2ZsdXNoSXRlbXMoKTtcbiAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKGRvY3VtZW50LmJvZHksIE5PX1NFTEVDVF9DTEFTUyk7XG4gIH1cblxuICBwcml2YXRlIF9vbk1vdXNlRG93bihldmVudDogTW91c2VFdmVudCkge1xuICAgIGlmICh0aGlzLnNob3J0Y3V0cy5kaXNhYmxlU2VsZWN0aW9uKGV2ZW50KSB8fCB0aGlzLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY2xlYXJTZWxlY3Rpb24od2luZG93KTtcblxuICAgIGlmICghdGhpcy5kaXNhYmxlRHJhZykge1xuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyhkb2N1bWVudC5ib2R5LCBOT19TRUxFQ1RfQ0xBU1MpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1vdXNlUG9pbnQgPSBnZXRNb3VzZVBvc2l0aW9uKGV2ZW50KTtcbiAgICBjb25zdCBbY3VycmVudEluZGV4LCBjbGlja2VkSXRlbV0gPSB0aGlzLl9nZXRDbG9zZXN0U2VsZWN0SXRlbShldmVudCk7XG5cbiAgICBsZXQgW3N0YXJ0SW5kZXgsIGVuZEluZGV4XSA9IHRoaXMuX2xhc3RSYW5nZTtcblxuICAgIGNvbnN0IGlzTW92ZVJhbmdlU3RhcnQgPSB0aGlzLnNob3J0Y3V0cy5tb3ZlUmFuZ2VTdGFydChldmVudCk7XG5cbiAgICBjb25zdCBzaG91bGRSZXNldFJhbmdlU2VsZWN0aW9uID1cbiAgICAgICF0aGlzLnNob3J0Y3V0cy5leHRlbmRlZFNlbGVjdGlvblNob3J0Y3V0KGV2ZW50KSB8fCBpc01vdmVSYW5nZVN0YXJ0IHx8IHRoaXMuZGlzYWJsZVJhbmdlU2VsZWN0aW9uO1xuXG4gICAgaWYgKHNob3VsZFJlc2V0UmFuZ2VTZWxlY3Rpb24pIHtcbiAgICAgIHRoaXMuX3Jlc2V0UmFuZ2VTdGFydCgpO1xuICAgIH1cblxuICAgIC8vIG1vdmUgcmFuZ2Ugc3RhcnRcbiAgICBpZiAoc2hvdWxkUmVzZXRSYW5nZVNlbGVjdGlvbiAmJiAhdGhpcy5kaXNhYmxlUmFuZ2VTZWxlY3Rpb24pIHtcbiAgICAgIGlmIChjdXJyZW50SW5kZXggPiAtMSkge1xuICAgICAgICB0aGlzLl9uZXdSYW5nZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fbGFzdFN0YXJ0SW5kZXggPSBjdXJyZW50SW5kZXg7XG4gICAgICAgIGNsaWNrZWRJdGVtLnRvZ2dsZVJhbmdlU3RhcnQoKTtcblxuICAgICAgICB0aGlzLl9sYXN0UmFuZ2VTZWxlY3Rpb24uY2xlYXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2xhc3RTdGFydEluZGV4ID0gLTE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRJbmRleCA+IC0xKSB7XG4gICAgICBzdGFydEluZGV4ID0gTWF0aC5taW4odGhpcy5fbGFzdFN0YXJ0SW5kZXgsIGN1cnJlbnRJbmRleCk7XG4gICAgICBlbmRJbmRleCA9IE1hdGgubWF4KHRoaXMuX2xhc3RTdGFydEluZGV4LCBjdXJyZW50SW5kZXgpO1xuICAgICAgdGhpcy5fbGFzdFJhbmdlID0gW3N0YXJ0SW5kZXgsIGVuZEluZGV4XTtcbiAgICB9XG5cbiAgICBpZiAoaXNNb3ZlUmFuZ2VTdGFydCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuJHNlbGVjdGFibGVJdGVtcy5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgaXRlbVJlY3QgPSBpdGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3Qgd2l0aGluQm91bmRpbmdCb3ggPSBpbkJvdW5kaW5nQm94KG1vdXNlUG9pbnQsIGl0ZW1SZWN0KTtcblxuICAgICAgaWYgKHRoaXMuc2hvcnRjdXRzLmV4dGVuZGVkU2VsZWN0aW9uU2hvcnRjdXQoZXZlbnQpICYmIHRoaXMuZGlzYWJsZVJhbmdlU2VsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgd2l0aGluUmFuZ2UgPVxuICAgICAgICB0aGlzLnNob3J0Y3V0cy5leHRlbmRlZFNlbGVjdGlvblNob3J0Y3V0KGV2ZW50KSAmJlxuICAgICAgICBzdGFydEluZGV4ID4gLTEgJiZcbiAgICAgICAgZW5kSW5kZXggPiAtMSAmJlxuICAgICAgICBpbmRleCA+PSBzdGFydEluZGV4ICYmXG4gICAgICAgIGluZGV4IDw9IGVuZEluZGV4ICYmXG4gICAgICAgIHN0YXJ0SW5kZXggIT09IGVuZEluZGV4O1xuXG4gICAgICBjb25zdCBzaG91bGRBZGQgPVxuICAgICAgICAod2l0aGluQm91bmRpbmdCb3ggJiZcbiAgICAgICAgICAhdGhpcy5zaG9ydGN1dHMudG9nZ2xlU2luZ2xlSXRlbShldmVudCkgJiZcbiAgICAgICAgICAhdGhpcy5zZWxlY3RNb2RlICYmXG4gICAgICAgICAgIXRoaXMuc2VsZWN0V2l0aFNob3J0Y3V0KSB8fFxuICAgICAgICAodGhpcy5zaG9ydGN1dHMuZXh0ZW5kZWRTZWxlY3Rpb25TaG9ydGN1dChldmVudCkgJiYgaXRlbS5zZWxlY3RlZCAmJiAhdGhpcy5fbGFzdFJhbmdlU2VsZWN0aW9uLmdldChpdGVtKSkgfHxcbiAgICAgICAgd2l0aGluUmFuZ2UgfHxcbiAgICAgICAgKHdpdGhpbkJvdW5kaW5nQm94ICYmIHRoaXMuc2hvcnRjdXRzLnRvZ2dsZVNpbmdsZUl0ZW0oZXZlbnQpICYmICFpdGVtLnNlbGVjdGVkKSB8fFxuICAgICAgICAoIXdpdGhpbkJvdW5kaW5nQm94ICYmIHRoaXMuc2hvcnRjdXRzLnRvZ2dsZVNpbmdsZUl0ZW0oZXZlbnQpICYmIGl0ZW0uc2VsZWN0ZWQpIHx8XG4gICAgICAgICh3aXRoaW5Cb3VuZGluZ0JveCAmJiAhaXRlbS5zZWxlY3RlZCAmJiB0aGlzLnNlbGVjdE1vZGUpIHx8XG4gICAgICAgICghd2l0aGluQm91bmRpbmdCb3ggJiYgaXRlbS5zZWxlY3RlZCAmJiB0aGlzLnNlbGVjdE1vZGUpO1xuXG4gICAgICBjb25zdCBzaG91bGRSZW1vdmUgPVxuICAgICAgICAoIXdpdGhpbkJvdW5kaW5nQm94ICYmXG4gICAgICAgICAgIXRoaXMuc2hvcnRjdXRzLnRvZ2dsZVNpbmdsZUl0ZW0oZXZlbnQpICYmXG4gICAgICAgICAgIXRoaXMuc2VsZWN0TW9kZSAmJlxuICAgICAgICAgICF0aGlzLnNob3J0Y3V0cy5leHRlbmRlZFNlbGVjdGlvblNob3J0Y3V0KGV2ZW50KSAmJlxuICAgICAgICAgICF0aGlzLnNlbGVjdFdpdGhTaG9ydGN1dCkgfHxcbiAgICAgICAgKHRoaXMuc2hvcnRjdXRzLmV4dGVuZGVkU2VsZWN0aW9uU2hvcnRjdXQoZXZlbnQpICYmIGN1cnJlbnRJbmRleCA+IC0xKSB8fFxuICAgICAgICAoIXdpdGhpbkJvdW5kaW5nQm94ICYmIHRoaXMuc2hvcnRjdXRzLnRvZ2dsZVNpbmdsZUl0ZW0oZXZlbnQpICYmICFpdGVtLnNlbGVjdGVkKSB8fFxuICAgICAgICAod2l0aGluQm91bmRpbmdCb3ggJiYgdGhpcy5zaG9ydGN1dHMudG9nZ2xlU2luZ2xlSXRlbShldmVudCkgJiYgaXRlbS5zZWxlY3RlZCkgfHxcbiAgICAgICAgKCF3aXRoaW5Cb3VuZGluZ0JveCAmJiAhaXRlbS5zZWxlY3RlZCAmJiB0aGlzLnNlbGVjdE1vZGUpIHx8XG4gICAgICAgICh3aXRoaW5Cb3VuZGluZ0JveCAmJiBpdGVtLnNlbGVjdGVkICYmIHRoaXMuc2VsZWN0TW9kZSk7XG5cbiAgICAgIGlmIChzaG91bGRBZGQpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0SXRlbShpdGVtKTtcbiAgICAgIH0gZWxzZSBpZiAoc2hvdWxkUmVtb3ZlKSB7XG4gICAgICAgIHRoaXMuX2Rlc2VsZWN0SXRlbShpdGVtKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHdpdGhpblJhbmdlICYmICF0aGlzLl9sYXN0UmFuZ2VTZWxlY3Rpb24uZ2V0KGl0ZW0pKSB7XG4gICAgICAgIHRoaXMuX2xhc3RSYW5nZVNlbGVjdGlvbi5zZXQoaXRlbSwgdHJ1ZSk7XG4gICAgICB9IGVsc2UgaWYgKCF3aXRoaW5SYW5nZSAmJiAhdGhpcy5fbmV3UmFuZ2VTdGFydCAmJiAhaXRlbS5zZWxlY3RlZCkge1xuICAgICAgICB0aGlzLl9sYXN0UmFuZ2VTZWxlY3Rpb24uZGVsZXRlKGl0ZW0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gaWYgd2UgZG9uJ3QgdG9nZ2xlIGEgc2luZ2xlIGl0ZW0sIHdlIHNldCBgbmV3UmFuZ2VTdGFydGAgdG8gYGZhbHNlYFxuICAgIC8vIG1lYW5pbmcgdGhhdCB3ZSBhcmUgYnVpbGRpbmcgdXAgYSByYW5nZVxuICAgIGlmICghdGhpcy5zaG9ydGN1dHMudG9nZ2xlU2luZ2xlSXRlbShldmVudCkpIHtcbiAgICAgIHRoaXMuX25ld1JhbmdlU3RhcnQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9zZWxlY3RJdGVtcyhldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBzZWxlY3Rpb25Cb3ggPSBjYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QodGhpcy4kc2VsZWN0Qm94Lm5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgdGhpcy4kc2VsZWN0YWJsZUl0ZW1zLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICBpZiAodGhpcy5faXNFeHRlbmRlZFNlbGVjdGlvbihldmVudCkpIHtcbiAgICAgICAgdGhpcy5fZXh0ZW5kZWRTZWxlY3Rpb25Nb2RlKHNlbGVjdGlvbkJveCwgaXRlbSwgZXZlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbm9ybWFsU2VsZWN0aW9uTW9kZShzZWxlY3Rpb25Cb3gsIGl0ZW0sIGV2ZW50KTtcblxuICAgICAgICBpZiAodGhpcy5fbGFzdFN0YXJ0SW5kZXggPCAwICYmIGl0ZW0uc2VsZWN0ZWQpIHtcbiAgICAgICAgICBpdGVtLnRvZ2dsZVJhbmdlU3RhcnQoKTtcbiAgICAgICAgICB0aGlzLl9sYXN0U3RhcnRJbmRleCA9IGluZGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9pc0V4dGVuZGVkU2VsZWN0aW9uKGV2ZW50OiBFdmVudCkge1xuICAgIHJldHVybiB0aGlzLnNob3J0Y3V0cy5leHRlbmRlZFNlbGVjdGlvblNob3J0Y3V0KGV2ZW50KSAmJiB0aGlzLnNlbGVjdE9uRHJhZztcbiAgfVxuXG4gIHByaXZhdGUgX25vcm1hbFNlbGVjdGlvbk1vZGUoc2VsZWN0Qm94OiBCb3VuZGluZ0JveCwgaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSwgZXZlbnQ6IEV2ZW50KSB7XG4gICAgY29uc3QgaW5TZWxlY3Rpb24gPSBib3hJbnRlcnNlY3RzKHNlbGVjdEJveCwgaXRlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSk7XG5cbiAgICBjb25zdCBzaG91bGRBZGQgPSBpblNlbGVjdGlvbiAmJiAhaXRlbS5zZWxlY3RlZCAmJiAhdGhpcy5zaG9ydGN1dHMucmVtb3ZlRnJvbVNlbGVjdGlvbihldmVudCk7XG5cbiAgICBjb25zdCBzaG91bGRSZW1vdmUgPVxuICAgICAgKCFpblNlbGVjdGlvbiAmJiBpdGVtLnNlbGVjdGVkICYmICF0aGlzLnNob3J0Y3V0cy5hZGRUb1NlbGVjdGlvbihldmVudCkpIHx8XG4gICAgICAoaW5TZWxlY3Rpb24gJiYgaXRlbS5zZWxlY3RlZCAmJiB0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KSk7XG5cbiAgICBpZiAoc2hvdWxkQWRkKSB7XG4gICAgICB0aGlzLl9zZWxlY3RJdGVtKGl0ZW0pO1xuICAgIH0gZWxzZSBpZiAoc2hvdWxkUmVtb3ZlKSB7XG4gICAgICB0aGlzLl9kZXNlbGVjdEl0ZW0oaXRlbSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZXh0ZW5kZWRTZWxlY3Rpb25Nb2RlKHNlbGVjdEJveCwgaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSwgZXZlbnQ6IEV2ZW50KSB7XG4gICAgY29uc3QgaW5TZWxlY3Rpb24gPSBib3hJbnRlcnNlY3RzKHNlbGVjdEJveCwgaXRlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSk7XG5cbiAgICBjb25zdCBzaG91ZGxBZGQgPVxuICAgICAgKGluU2VsZWN0aW9uICYmICFpdGVtLnNlbGVjdGVkICYmICF0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KSAmJiAhdGhpcy5fdG1wSXRlbXMuaGFzKGl0ZW0pKSB8fFxuICAgICAgKGluU2VsZWN0aW9uICYmIGl0ZW0uc2VsZWN0ZWQgJiYgdGhpcy5zaG9ydGN1dHMucmVtb3ZlRnJvbVNlbGVjdGlvbihldmVudCkgJiYgIXRoaXMuX3RtcEl0ZW1zLmhhcyhpdGVtKSk7XG5cbiAgICBjb25zdCBzaG91bGRSZW1vdmUgPVxuICAgICAgKCFpblNlbGVjdGlvbiAmJiBpdGVtLnNlbGVjdGVkICYmIHRoaXMuc2hvcnRjdXRzLmFkZFRvU2VsZWN0aW9uKGV2ZW50KSAmJiB0aGlzLl90bXBJdGVtcy5oYXMoaXRlbSkpIHx8XG4gICAgICAoIWluU2VsZWN0aW9uICYmICFpdGVtLnNlbGVjdGVkICYmIHRoaXMuc2hvcnRjdXRzLnJlbW92ZUZyb21TZWxlY3Rpb24oZXZlbnQpICYmIHRoaXMuX3RtcEl0ZW1zLmhhcyhpdGVtKSk7XG5cbiAgICBpZiAoc2hvdWRsQWRkKSB7XG4gICAgICBpZiAoaXRlbS5zZWxlY3RlZCkge1xuICAgICAgICBpdGVtLl9kZXNlbGVjdCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbS5fc2VsZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGFjdGlvbiA9IHRoaXMuc2hvcnRjdXRzLnJlbW92ZUZyb21TZWxlY3Rpb24oZXZlbnQpXG4gICAgICAgID8gQWN0aW9uLkRlbGV0ZVxuICAgICAgICA6IHRoaXMuc2hvcnRjdXRzLmFkZFRvU2VsZWN0aW9uKGV2ZW50KVxuICAgICAgICA/IEFjdGlvbi5BZGRcbiAgICAgICAgOiBBY3Rpb24uTm9uZTtcblxuICAgICAgdGhpcy5fdG1wSXRlbXMuc2V0KGl0ZW0sIGFjdGlvbik7XG4gICAgfSBlbHNlIGlmIChzaG91bGRSZW1vdmUpIHtcbiAgICAgIGlmICh0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KSkge1xuICAgICAgICBpdGVtLl9zZWxlY3QoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW0uX2Rlc2VsZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3RtcEl0ZW1zLmRlbGV0ZShpdGVtKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9mbHVzaEl0ZW1zKCkge1xuICAgIHRoaXMuX3RtcEl0ZW1zLmZvckVhY2goKGFjdGlvbiwgaXRlbSkgPT4ge1xuICAgICAgaWYgKGFjdGlvbiA9PT0gQWN0aW9uLkFkZCkge1xuICAgICAgICB0aGlzLl9zZWxlY3RJdGVtKGl0ZW0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoYWN0aW9uID09PSBBY3Rpb24uRGVsZXRlKSB7XG4gICAgICAgIHRoaXMuX2Rlc2VsZWN0SXRlbShpdGVtKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuX3RtcEl0ZW1zLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIF9hZGRJdGVtKGl0ZW06IFNlbGVjdEl0ZW1EaXJlY3RpdmUsIHNlbGVjdGVkSXRlbXM6IEFycmF5PGFueT4pIHtcbiAgICBsZXQgc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgaWYgKCF0aGlzLl9oYXNJdGVtKGl0ZW0sIHNlbGVjdGVkSXRlbXMpKSB7XG4gICAgICBzdWNjZXNzID0gdHJ1ZTtcbiAgICAgIHNlbGVjdGVkSXRlbXMucHVzaChpdGVtLnZhbHVlKTtcbiAgICAgIHRoaXMuX3NlbGVjdGVkSXRlbXMkLm5leHQoc2VsZWN0ZWRJdGVtcyk7XG4gICAgICB0aGlzLml0ZW1TZWxlY3RlZC5lbWl0KGl0ZW0udmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiBzdWNjZXNzO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVtb3ZlSXRlbShpdGVtOiBTZWxlY3RJdGVtRGlyZWN0aXZlLCBzZWxlY3RlZEl0ZW1zOiBBcnJheTxhbnk+KSB7XG4gICAgbGV0IHN1Y2Nlc3MgPSBmYWxzZTtcbiAgICBjb25zdCB2YWx1ZSA9IGl0ZW0gaW5zdGFuY2VvZiBTZWxlY3RJdGVtRGlyZWN0aXZlID8gaXRlbS52YWx1ZSA6IGl0ZW07XG4gICAgY29uc3QgaW5kZXggPSBzZWxlY3RlZEl0ZW1zLmluZGV4T2YodmFsdWUpO1xuXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHN1Y2Nlc3MgPSB0cnVlO1xuICAgICAgc2VsZWN0ZWRJdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgdGhpcy5fc2VsZWN0ZWRJdGVtcyQubmV4dChzZWxlY3RlZEl0ZW1zKTtcbiAgICAgIHRoaXMuaXRlbURlc2VsZWN0ZWQuZW1pdCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1Y2Nlc3M7XG4gIH1cblxuICBwcml2YXRlIF90b2dnbGVJdGVtKGl0ZW06IFNlbGVjdEl0ZW1EaXJlY3RpdmUpIHtcbiAgICBpZiAoaXRlbS5zZWxlY3RlZCkge1xuICAgICAgdGhpcy5fZGVzZWxlY3RJdGVtKGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zZWxlY3RJdGVtKGl0ZW0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3NlbGVjdEl0ZW0oaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSkge1xuICAgIHRoaXMudXBkYXRlSXRlbXMkLm5leHQoeyB0eXBlOiBVcGRhdGVBY3Rpb25zLkFkZCwgaXRlbSB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX2Rlc2VsZWN0SXRlbShpdGVtOiBTZWxlY3RJdGVtRGlyZWN0aXZlKSB7XG4gICAgdGhpcy51cGRhdGVJdGVtcyQubmV4dCh7IHR5cGU6IFVwZGF0ZUFjdGlvbnMuUmVtb3ZlLCBpdGVtIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfaGFzSXRlbShpdGVtOiBTZWxlY3RJdGVtRGlyZWN0aXZlLCBzZWxlY3RlZEl0ZW1zOiBBcnJheTxhbnk+KSB7XG4gICAgcmV0dXJuIHNlbGVjdGVkSXRlbXMuaW5jbHVkZXMoaXRlbS52YWx1ZSk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRDbG9zZXN0U2VsZWN0SXRlbShldmVudDogRXZlbnQpOiBbbnVtYmVyLCBTZWxlY3RJdGVtRGlyZWN0aXZlXSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gKGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuY2xvc2VzdCgnLmR0cy1zZWxlY3QtaXRlbScpO1xuICAgIGxldCBpbmRleCA9IC0xO1xuICAgIGxldCB0YXJnZXRJdGVtID0gbnVsbDtcblxuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIHRhcmdldEl0ZW0gPSB0YXJnZXRbU0VMRUNUX0lURU1fSU5TVEFOQ0VdO1xuICAgICAgaW5kZXggPSB0aGlzLl9zZWxlY3RhYmxlSXRlbXMuaW5kZXhPZih0YXJnZXRJdGVtKTtcbiAgICB9XG5cbiAgICByZXR1cm4gW2luZGV4LCB0YXJnZXRJdGVtXTtcbiAgfVxuXG4gIHByaXZhdGUgX3Jlc2V0UmFuZ2VTdGFydCgpIHtcbiAgICB0aGlzLl9sYXN0UmFuZ2UgPSBbLTEsIC0xXTtcbiAgICBjb25zdCBsYXN0UmFuZ2VTdGFydCA9IHRoaXMuX2dldExhc3RSYW5nZVNlbGVjdGlvbigpO1xuXG4gICAgaWYgKGxhc3RSYW5nZVN0YXJ0ICYmIGxhc3RSYW5nZVN0YXJ0LnJhbmdlU3RhcnQpIHtcbiAgICAgIGxhc3RSYW5nZVN0YXJ0LnRvZ2dsZVJhbmdlU3RhcnQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRMYXN0UmFuZ2VTZWxlY3Rpb24oKTogU2VsZWN0SXRlbURpcmVjdGl2ZSB8IG51bGwge1xuICAgIGlmICh0aGlzLl9sYXN0U3RhcnRJbmRleCA+PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc2VsZWN0YWJsZUl0ZW1zW3RoaXMuX2xhc3RTdGFydEluZGV4XTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIl19