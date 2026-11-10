export type PositionLock={enabled:boolean;anchor:{x:number;y:number;width:number;height:number}|null;displayId:number|null};
export type DisplayWorkArea={id:number;workArea:{x:number;y:number;width:number;height:number}};
export function normalizePositionLock(value:unknown):PositionLock;
export function loadPositionLock(path:string):PositionLock;
export function savePositionLock(path:string,value:unknown):PositionLock;
export function positionFor(lock:unknown,displays:DisplayWorkArea[],fallback:{x:number;y:number;width:number;height:number}):{x:number;y:number;width:number;height:number};
