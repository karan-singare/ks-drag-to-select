import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { fromEvent } from 'rxjs';
import { share } from 'rxjs/operators';
import { distinctKeyEvents } from './operators';
import * as i0 from "@angular/core";
export class KeyboardEventsService {
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
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmQtZXZlbnRzLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtZHJhZy10by1zZWxlY3Qvc3JjL2xpYi9rZXlib2FyZC1ldmVudHMuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUNwRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDaEUsT0FBTyxFQUFFLFNBQVMsRUFBYyxNQUFNLE1BQU0sQ0FBQztBQUM3QyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDdkMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sYUFBYSxDQUFDOztBQUdoRCxNQUFNLE9BQU8scUJBQXFCO0lBUWhDLFlBQXlDLFVBQW1DO1FBQW5DLGVBQVUsR0FBVixVQUFVLENBQXlCO1FBQzFFLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3RDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1NBQ25DO0lBQ0gsQ0FBQztJQUVPLDBCQUEwQjtRQUNoQyxJQUFJLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBZ0IsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFnQixNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFdEUsa0ZBQWtGO1FBQ2xGLHlDQUF5QztRQUV6QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRXpFLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRXJFLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFhLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUN2RSxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBYSxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDN0UsQ0FBQzs7a0hBM0JVLHFCQUFxQixrQkFRWixXQUFXO3NIQVJwQixxQkFBcUI7MkZBQXJCLHFCQUFxQjtrQkFEakMsVUFBVTs7MEJBU0ksTUFBTTsyQkFBQyxXQUFXIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaXNQbGF0Zm9ybUJyb3dzZXIgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlLCBQTEFURk9STV9JRCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgZnJvbUV2ZW50LCBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBzaGFyZSB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IGRpc3RpbmN0S2V5RXZlbnRzIH0gZnJvbSAnLi9vcGVyYXRvcnMnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgS2V5Ym9hcmRFdmVudHNTZXJ2aWNlIHtcbiAga2V5ZG93biQ6IE9ic2VydmFibGU8S2V5Ym9hcmRFdmVudD47XG4gIGtleXVwJDogT2JzZXJ2YWJsZTxLZXlib2FyZEV2ZW50PjtcbiAgZGlzdGluY3RLZXlkb3duJDogT2JzZXJ2YWJsZTxLZXlib2FyZEV2ZW50PjtcbiAgZGlzdGluY3RLZXl1cCQ6IE9ic2VydmFibGU8S2V5Ym9hcmRFdmVudD47XG4gIG1vdXNldXAkOiBPYnNlcnZhYmxlPE1vdXNlRXZlbnQ+O1xuICBtb3VzZW1vdmUkOiBPYnNlcnZhYmxlPE1vdXNlRXZlbnQ+O1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoUExBVEZPUk1fSUQpIHByaXZhdGUgcGxhdGZvcm1JZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBpZiAoaXNQbGF0Zm9ybUJyb3dzZXIodGhpcy5wbGF0Zm9ybUlkKSkge1xuICAgICAgdGhpcy5faW5pdGlhbGl6ZUtleWJvYXJkU3RyZWFtcygpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2luaXRpYWxpemVLZXlib2FyZFN0cmVhbXMoKSB7XG4gICAgdGhpcy5rZXlkb3duJCA9IGZyb21FdmVudDxLZXlib2FyZEV2ZW50Pih3aW5kb3csICdrZXlkb3duJykucGlwZShzaGFyZSgpKTtcbiAgICB0aGlzLmtleXVwJCA9IGZyb21FdmVudDxLZXlib2FyZEV2ZW50Pih3aW5kb3csICdrZXl1cCcpLnBpcGUoc2hhcmUoKSk7XG5cbiAgICAvLyBkaXN0aW5jdEtleUV2ZW50cyBpcyB1c2VkIHRvIHByZXZlbnQgbXVsdGlwbGUga2V5IGV2ZW50cyB0byBiZSBmaXJlZCByZXBlYXRlZGx5XG4gICAgLy8gb24gV2luZG93cyB3aGVuIGEga2V5IGlzIGJlaW5nIHByZXNzZWRcblxuICAgIHRoaXMuZGlzdGluY3RLZXlkb3duJCA9IHRoaXMua2V5ZG93biQucGlwZShkaXN0aW5jdEtleUV2ZW50cygpLCBzaGFyZSgpKTtcblxuICAgIHRoaXMuZGlzdGluY3RLZXl1cCQgPSB0aGlzLmtleXVwJC5waXBlKGRpc3RpbmN0S2V5RXZlbnRzKCksIHNoYXJlKCkpO1xuXG4gICAgdGhpcy5tb3VzZXVwJCA9IGZyb21FdmVudDxNb3VzZUV2ZW50Pih3aW5kb3csICdtb3VzZXVwJykucGlwZShzaGFyZSgpKTtcbiAgICB0aGlzLm1vdXNlbW92ZSQgPSBmcm9tRXZlbnQ8TW91c2VFdmVudD4od2luZG93LCAnbW91c2Vtb3ZlJykucGlwZShzaGFyZSgpKTtcbiAgfVxufVxuIl19