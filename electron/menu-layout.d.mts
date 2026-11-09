export interface MenuRect{x:number;y:number;width:number;height:number}
export interface MenuSize{width:number;height:number}
export const MIN_MENU:Readonly<MenuSize>;
export const MAX_MENU:Readonly<MenuSize>;
export function menuSize(input:Partial<MenuSize>,work:MenuSize):MenuSize;
export function clampMenu(bounds:MenuRect,work:MenuRect):MenuRect;
export function overlapArea(a:MenuRect,b:MenuRect):number;
export function placeMenu(pet:MenuRect,work:MenuRect,cursor:{x:number;y:number},inputSize?:Partial<MenuSize>,saved?:{x:number;y:number}|null):MenuRect;
