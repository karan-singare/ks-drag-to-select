import { Observable } from 'rxjs';
import { SelectItemDirective } from './select-item.directive';
export declare type PredicateFn<T> = (item: T) => boolean;
export declare enum UpdateActions {
    Add = 0,
    Remove = 1
}
export interface UpdateAction {
    type: UpdateActions;
    item: SelectItemDirective;
}
export interface ObservableProxy<T> {
    proxy$: Observable<any>;
    proxy: T;
}
export interface SelectContainerHost extends HTMLElement {
    boundingClientRect: BoundingBox;
}
export interface Shortcuts {
    moveRangeStart: string;
    disableSelection: string;
    toggleSingleItem: string;
    addToSelection: string;
    removeFromSelection: string;
}
export interface DragToSelectConfig {
    selectedClass: string;
    shortcuts: Partial<Shortcuts>;
}
export interface MousePosition {
    x: number;
    y: number;
}
export interface BoundingBox {
    top: number;
    left: number;
    width: number;
    height: number;
}
export declare type SelectBoxInput = [MouseEvent, number, MousePosition];
export interface SelectBox<T> {
    top: T;
    left: T;
    width: T;
    height: T;
    opacity: number;
}
export declare enum Action {
    Add = 0,
    Delete = 1,
    None = 2
}
