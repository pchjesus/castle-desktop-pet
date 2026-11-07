export const PET_WIDTH_PRESETS: ReadonlyArray<number>;
export const DEFAULT_PET_WIDTH: number;
export const PET_HEIGHT_RATIO: number;
export interface PetBounds {x:number;y:number;width:number;height:number}
export function dimensionsFor(width:number):{width:number;height:number};
export function nextWidth(currentWidth:number,direction:number):number;
export function resizeAroundFeet(bounds:PetBounds,width:number):PetBounds;
export function restoreWindowBounds(saved:unknown):PetBounds|null;
