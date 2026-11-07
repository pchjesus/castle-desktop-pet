export interface AlphaMask {width:number;height:number;alpha:Uint8Array}
export interface Rect {left:number;top:number;width:number;height:number}
export function hitTestAlpha(mask:AlphaMask|null,rect:Rect,x:number,y:number,threshold?:number):boolean;
export function extractAlpha(rgba:Uint8ClampedArray|Uint8Array,width:number,height:number):AlphaMask;
