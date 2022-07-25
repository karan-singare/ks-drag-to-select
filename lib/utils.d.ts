import { BoundingBox, MousePosition, SelectBox, SelectContainerHost } from './models';
export declare const isObject: (item: any) => boolean;
export declare function mergeDeep(target: Record<string, any>, source: Record<string, any>): Record<string, any>;
export declare const hasMinimumSize: (selectBox: SelectBox<number>, minWidth?: number, minHeight?: number) => boolean;
export declare const clearSelection: (window: Window) => void;
export declare const inBoundingBox: (point: MousePosition, box: BoundingBox) => boolean;
export declare const boxIntersects: (boxA: BoundingBox, boxB: BoundingBox) => boolean;
export declare const calculateBoundingClientRect: (element: HTMLElement) => BoundingBox;
export declare const getMousePosition: (event: MouseEvent) => {
    x: number;
    y: number;
};
export declare const getScroll: () => {
    x: number;
    y: number;
};
export declare const getRelativeMousePosition: (event: MouseEvent, container: SelectContainerHost) => MousePosition;
export declare const cursorWithinElement: (event: MouseEvent, element: HTMLElement) => boolean;
