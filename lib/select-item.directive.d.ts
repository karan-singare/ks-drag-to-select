import { DoCheck, ElementRef, Renderer2, OnInit } from '@angular/core';
import { DragToSelectConfig, BoundingBox } from './models';
import * as i0 from "@angular/core";
export declare const SELECT_ITEM_INSTANCE: unique symbol;
export declare class SelectItemDirective implements OnInit, DoCheck {
    private config;
    private platformId;
    private host;
    private renderer;
    private _boundingClientRect;
    selected: boolean;
    rangeStart: boolean;
    readonly hostClass = true;
    dtsSelectItem: any | undefined;
    dtsDisabled: boolean;
    get value(): SelectItemDirective | any;
    constructor(config: DragToSelectConfig, platformId: Record<string, unknown>, host: ElementRef, renderer: Renderer2);
    ngOnInit(): void;
    ngDoCheck(): void;
    toggleRangeStart(): void;
    get nativeElememnt(): any;
    getBoundingClientRect(): BoundingBox;
    calculateBoundingClientRect(): BoundingBox;
    _select(): void;
    _deselect(): void;
    private applySelectedClass;
    static ɵfac: i0.ɵɵFactoryDeclaration<SelectItemDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<SelectItemDirective, "[dtsSelectItem]", ["dtsSelectItem"], { "dtsSelectItem": "dtsSelectItem"; "dtsDisabled": "dtsDisabled"; }, {}, never>;
}
