import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, Inject, Input, PLATFORM_ID, Renderer2, HostBinding, } from '@angular/core';
import { CONFIG } from './tokens';
import { calculateBoundingClientRect } from './utils';
import * as i0 from "@angular/core";
export const SELECT_ITEM_INSTANCE = Symbol();
export class SelectItemDirective {
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
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [CONFIG]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }, { type: i0.ElementRef }, { type: i0.Renderer2 }]; }, propDecorators: { rangeStart: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LWl0ZW0uZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWRyYWctdG8tc2VsZWN0L3NyYy9saWIvc2VsZWN0LWl0ZW0uZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRXBELE9BQU8sRUFDTCxTQUFTLEVBRVQsVUFBVSxFQUNWLE1BQU0sRUFDTixLQUFLLEVBQ0wsV0FBVyxFQUNYLFNBQVMsRUFFVCxXQUFXLEdBQ1osTUFBTSxlQUFlLENBQUM7QUFHdkIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUNsQyxPQUFPLEVBQUUsMkJBQTJCLEVBQUUsTUFBTSxTQUFTLENBQUM7O0FBRXRELE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFHLE1BQU0sRUFBRSxDQUFDO0FBTTdDLE1BQU0sT0FBTyxtQkFBbUI7SUFxQjlCLFlBQzBCLE1BQTBCLEVBQ3JCLFVBQW1DLEVBQ3hELElBQWdCLEVBQ2hCLFFBQW1CO1FBSEgsV0FBTSxHQUFOLE1BQU0sQ0FBb0I7UUFDckIsZUFBVSxHQUFWLFVBQVUsQ0FBeUI7UUFDeEQsU0FBSSxHQUFKLElBQUksQ0FBWTtRQUNoQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBdEI3QixhQUFRLEdBQUcsS0FBSyxDQUFDO1FBR2pCLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFHVixjQUFTLEdBQUcsSUFBSSxDQUFDO1FBTTFCLGdCQUFXLEdBQUcsS0FBSyxDQUFDO0lBV2pCLENBQUM7SUFUSixJQUFJLEtBQUs7UUFDUCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN4RCxDQUFDO0lBU0QsUUFBUTtRQUNOLElBQUksQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbkQsQ0FBQztJQUVELFNBQVM7UUFDUCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsZ0JBQWdCO1FBQ2QsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7SUFDckMsQ0FBQztJQUVELElBQUksY0FBYztRQUNoQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQ2pDLENBQUM7SUFFRCxxQkFBcUI7UUFDbkIsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDbkUsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7U0FDcEM7UUFDRCxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztJQUNsQyxDQUFDO0lBRUQsMkJBQTJCO1FBQ3pCLE1BQU0sV0FBVyxHQUFHLDJCQUEyQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDekUsSUFBSSxDQUFDLG1CQUFtQixHQUFHLFdBQVcsQ0FBQztRQUN2QyxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0lBRUQsT0FBTztRQUNMLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxTQUFTO1FBQ1AsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFDeEIsQ0FBQztJQUVPLGtCQUFrQjtRQUN4QixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUM1RTthQUFNO1lBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUMvRTtJQUNILENBQUM7O2dIQXZFVSxtQkFBbUIsa0JBc0JwQixNQUFNLGFBQ04sV0FBVztvR0F2QlYsbUJBQW1COzJGQUFuQixtQkFBbUI7a0JBSi9CLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLGlCQUFpQjtvQkFDM0IsUUFBUSxFQUFFLGVBQWU7aUJBQzFCOzswQkF1QkksTUFBTTsyQkFBQyxNQUFNOzswQkFDYixNQUFNOzJCQUFDLFdBQVc7NkZBakJyQixVQUFVO3NCQURULFdBQVc7dUJBQUMsdUJBQXVCO2dCQUkzQixTQUFTO3NCQURqQixXQUFXO3VCQUFDLHVCQUF1QjtnQkFHM0IsYUFBYTtzQkFBckIsS0FBSztnQkFJTixXQUFXO3NCQUZWLEtBQUs7O3NCQUNMLFdBQVc7dUJBQUMsb0JBQW9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaXNQbGF0Zm9ybUJyb3dzZXIgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIERvQ2hlY2ssXG4gIEVsZW1lbnRSZWYsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIFBMQVRGT1JNX0lELFxuICBSZW5kZXJlcjIsXG4gIE9uSW5pdCxcbiAgSG9zdEJpbmRpbmcsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQgeyBEcmFnVG9TZWxlY3RDb25maWcsIEJvdW5kaW5nQm94IH0gZnJvbSAnLi9tb2RlbHMnO1xuaW1wb3J0IHsgQ09ORklHIH0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHsgY2FsY3VsYXRlQm91bmRpbmdDbGllbnRSZWN0IH0gZnJvbSAnLi91dGlscyc7XG5cbmV4cG9ydCBjb25zdCBTRUxFQ1RfSVRFTV9JTlNUQU5DRSA9IFN5bWJvbCgpO1xuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbZHRzU2VsZWN0SXRlbV0nLFxuICBleHBvcnRBczogJ2R0c1NlbGVjdEl0ZW0nLFxufSlcbmV4cG9ydCBjbGFzcyBTZWxlY3RJdGVtRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBEb0NoZWNrIHtcbiAgcHJpdmF0ZSBfYm91bmRpbmdDbGllbnRSZWN0OiBCb3VuZGluZ0JveCB8IHVuZGVmaW5lZDtcblxuICBzZWxlY3RlZCA9IGZhbHNlO1xuXG4gIEBIb3N0QmluZGluZygnY2xhc3MuZHRzLXJhbmdlLXN0YXJ0JylcbiAgcmFuZ2VTdGFydCA9IGZhbHNlO1xuXG4gIEBIb3N0QmluZGluZygnY2xhc3MuZHRzLXNlbGVjdC1pdGVtJylcbiAgcmVhZG9ubHkgaG9zdENsYXNzID0gdHJ1ZTtcblxuICBASW5wdXQoKSBkdHNTZWxlY3RJdGVtOiBhbnkgfCB1bmRlZmluZWQ7XG5cbiAgQElucHV0KClcbiAgQEhvc3RCaW5kaW5nKCdjbGFzcy5kdHMtZGlzYWJsZWQnKVxuICBkdHNEaXNhYmxlZCA9IGZhbHNlO1xuXG4gIGdldCB2YWx1ZSgpOiBTZWxlY3RJdGVtRGlyZWN0aXZlIHwgYW55IHtcbiAgICByZXR1cm4gdGhpcy5kdHNTZWxlY3RJdGVtID8gdGhpcy5kdHNTZWxlY3RJdGVtIDogdGhpcztcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoQ09ORklHKSBwcml2YXRlIGNvbmZpZzogRHJhZ1RvU2VsZWN0Q29uZmlnLFxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHByaXZhdGUgcGxhdGZvcm1JZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgcHJpdmF0ZSBob3N0OiBFbGVtZW50UmVmLFxuICAgIHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMlxuICApIHt9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW1udFtTRUxFQ1RfSVRFTV9JTlNUQU5DRV0gPSB0aGlzO1xuICB9XG5cbiAgbmdEb0NoZWNrKCkge1xuICAgIHRoaXMuYXBwbHlTZWxlY3RlZENsYXNzKCk7XG4gIH1cblxuICB0b2dnbGVSYW5nZVN0YXJ0KCkge1xuICAgIHRoaXMucmFuZ2VTdGFydCA9ICF0aGlzLnJhbmdlU3RhcnQ7XG4gIH1cblxuICBnZXQgbmF0aXZlRWxlbWVtbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaG9zdC5uYXRpdmVFbGVtZW50O1xuICB9XG5cbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkge1xuICAgIGlmIChpc1BsYXRmb3JtQnJvd3Nlcih0aGlzLnBsYXRmb3JtSWQpICYmICF0aGlzLl9ib3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICAgIHRoaXMuY2FsY3VsYXRlQm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9ib3VuZGluZ0NsaWVudFJlY3Q7XG4gIH1cblxuICBjYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QoKSB7XG4gICAgY29uc3QgYm91bmRpbmdCb3ggPSBjYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QodGhpcy5ob3N0Lm5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuX2JvdW5kaW5nQ2xpZW50UmVjdCA9IGJvdW5kaW5nQm94O1xuICAgIHJldHVybiBib3VuZGluZ0JveDtcbiAgfVxuXG4gIF9zZWxlY3QoKSB7XG4gICAgdGhpcy5zZWxlY3RlZCA9IHRydWU7XG4gIH1cblxuICBfZGVzZWxlY3QoKSB7XG4gICAgdGhpcy5zZWxlY3RlZCA9IGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVNlbGVjdGVkQ2xhc3MoKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5ob3N0Lm5hdGl2ZUVsZW1lbnQsIHRoaXMuY29uZmlnLnNlbGVjdGVkQ2xhc3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKHRoaXMuaG9zdC5uYXRpdmVFbGVtZW50LCB0aGlzLmNvbmZpZy5zZWxlY3RlZENsYXNzKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==