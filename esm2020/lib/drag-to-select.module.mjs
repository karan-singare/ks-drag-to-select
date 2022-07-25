import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DEFAULT_CONFIG } from './config';
import { KeyboardEventsService } from './keyboard-events.service';
import { SelectContainerComponent } from './select-container.component';
import { SelectItemDirective } from './select-item.directive';
import { ShortcutService } from './shortcut.service';
import { CONFIG, USER_CONFIG } from './tokens';
import { mergeDeep } from './utils';
import * as i0 from "@angular/core";
const COMPONENTS = [SelectContainerComponent, SelectItemDirective];
function configFactory(config) {
    return mergeDeep(DEFAULT_CONFIG, config);
}
export class DragToSelectModule {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy10by1zZWxlY3QubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWRyYWctdG8tc2VsZWN0L3NyYy9saWIvZHJhZy10by1zZWxlY3QubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQXVCLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM5RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQzFDLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRWxFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ3hFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQzlELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUMvQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sU0FBUyxDQUFDOztBQUVwQyxNQUFNLFVBQVUsR0FBRyxDQUFDLHdCQUF3QixFQUFFLG1CQUFtQixDQUFDLENBQUM7QUFFbkUsU0FBUyxhQUFhLENBQUMsTUFBbUM7SUFDeEQsT0FBTyxTQUFTLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFPRCxNQUFNLE9BQU8sa0JBQWtCO0lBQzdCLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBc0MsRUFBRTtRQUNyRCxPQUFPO1lBQ0wsUUFBUSxFQUFFLGtCQUFrQjtZQUM1QixTQUFTLEVBQUU7Z0JBQ1QsZUFBZTtnQkFDZixxQkFBcUI7Z0JBQ3JCLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO2dCQUMxQztvQkFDRSxPQUFPLEVBQUUsTUFBTTtvQkFDZixVQUFVLEVBQUUsYUFBYTtvQkFDekIsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDO2lCQUNwQjthQUNGO1NBQ0YsQ0FBQztJQUNKLENBQUM7OytHQWZVLGtCQUFrQjtnSEFBbEIsa0JBQWtCLGlCQVhYLHdCQUF3QixFQUFFLG1CQUFtQixhQU9yRCxZQUFZLGFBUEosd0JBQXdCLEVBQUUsbUJBQW1CO2dIQVdwRCxrQkFBa0IsWUFKcEIsQ0FBQyxZQUFZLENBQUM7MkZBSVosa0JBQWtCO2tCQUw5QixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQztvQkFDdkIsWUFBWSxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUM7b0JBQzdCLE9BQU8sRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDO2lCQUN6QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBNb2R1bGVXaXRoUHJvdmlkZXJzLCBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgREVGQVVMVF9DT05GSUcgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgeyBLZXlib2FyZEV2ZW50c1NlcnZpY2UgfSBmcm9tICcuL2tleWJvYXJkLWV2ZW50cy5zZXJ2aWNlJztcbmltcG9ydCB7IERyYWdUb1NlbGVjdENvbmZpZyB9IGZyb20gJy4vbW9kZWxzJztcbmltcG9ydCB7IFNlbGVjdENvbnRhaW5lckNvbXBvbmVudCB9IGZyb20gJy4vc2VsZWN0LWNvbnRhaW5lci5jb21wb25lbnQnO1xuaW1wb3J0IHsgU2VsZWN0SXRlbURpcmVjdGl2ZSB9IGZyb20gJy4vc2VsZWN0LWl0ZW0uZGlyZWN0aXZlJztcbmltcG9ydCB7IFNob3J0Y3V0U2VydmljZSB9IGZyb20gJy4vc2hvcnRjdXQuc2VydmljZSc7XG5pbXBvcnQgeyBDT05GSUcsIFVTRVJfQ09ORklHIH0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHsgbWVyZ2VEZWVwIH0gZnJvbSAnLi91dGlscyc7XG5cbmNvbnN0IENPTVBPTkVOVFMgPSBbU2VsZWN0Q29udGFpbmVyQ29tcG9uZW50LCBTZWxlY3RJdGVtRGlyZWN0aXZlXTtcblxuZnVuY3Rpb24gY29uZmlnRmFjdG9yeShjb25maWc6IFBhcnRpYWw8RHJhZ1RvU2VsZWN0Q29uZmlnPikge1xuICByZXR1cm4gbWVyZ2VEZWVwKERFRkFVTFRfQ09ORklHLCBjb25maWcpO1xufVxuXG5ATmdNb2R1bGUoe1xuICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlXSxcbiAgZGVjbGFyYXRpb25zOiBbLi4uQ09NUE9ORU5UU10sXG4gIGV4cG9ydHM6IFsuLi5DT01QT05FTlRTXSxcbn0pXG5leHBvcnQgY2xhc3MgRHJhZ1RvU2VsZWN0TW9kdWxlIHtcbiAgc3RhdGljIGZvclJvb3QoY29uZmlnOiBQYXJ0aWFsPERyYWdUb1NlbGVjdENvbmZpZz4gPSB7fSk6IE1vZHVsZVdpdGhQcm92aWRlcnM8RHJhZ1RvU2VsZWN0TW9kdWxlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5nTW9kdWxlOiBEcmFnVG9TZWxlY3RNb2R1bGUsXG4gICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgU2hvcnRjdXRTZXJ2aWNlLFxuICAgICAgICBLZXlib2FyZEV2ZW50c1NlcnZpY2UsXG4gICAgICAgIHsgcHJvdmlkZTogVVNFUl9DT05GSUcsIHVzZVZhbHVlOiBjb25maWcgfSxcbiAgICAgICAge1xuICAgICAgICAgIHByb3ZpZGU6IENPTkZJRyxcbiAgICAgICAgICB1c2VGYWN0b3J5OiBjb25maWdGYWN0b3J5LFxuICAgICAgICAgIGRlcHM6IFtVU0VSX0NPTkZJR10sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG4gIH1cbn1cbiJdfQ==