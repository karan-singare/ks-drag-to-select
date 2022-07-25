import { ModuleWithProviders } from '@angular/core';
import { DragToSelectConfig } from './models';
import * as i0 from "@angular/core";
import * as i1 from "./select-container.component";
import * as i2 from "./select-item.directive";
import * as i3 from "@angular/common";
import * as i4 from "./shortcut.service";
export declare class DragToSelectModule {
    static forRoot(config?: Partial<DragToSelectConfig>): ModuleWithProviders<DragToSelectModule>;
    static ɵfac: i0.ɵɵFactoryDeclaration<DragToSelectModule, never>;
    static ɵmod: i0.ɵɵNgModuleDeclaration<DragToSelectModule, [typeof i1.SelectContainerComponent, typeof i2.SelectItemDirective], [typeof i3.CommonModule], [typeof i1.SelectContainerComponent, typeof i2.SelectItemDirective, typeof i4.ShortcutService]>;
    static ɵinj: i0.ɵɵInjectorDeclaration<DragToSelectModule>;
}
