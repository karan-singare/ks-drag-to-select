import { Observable } from 'rxjs';
import { SelectBox, SelectBoxInput, SelectContainerHost } from './models';
export declare const createSelectBox: (container: SelectContainerHost) => (source: Observable<SelectBoxInput>) => Observable<SelectBox<number>>;
export declare const whenSelectBoxVisible: (selectBox$: Observable<SelectBox<number>>) => (source: Observable<Event>) => Observable<Event>;
export declare const distinctKeyEvents: () => (source: Observable<KeyboardEvent>) => Observable<KeyboardEvent>;
