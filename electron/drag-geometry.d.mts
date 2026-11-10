export interface Rect {x:number;y:number;width:number;height:number}
export interface Cursor {x:number;y:number}
export function dragPosition(anchor:Rect,firstCursor:Cursor,currentCursor:Cursor,workAreas:Rect[]):Rect;
export function sameSize(first:Rect,second:Rect):boolean;
