import type {PetBounds} from './window-size.mjs';
export function speechBounds(pet:PetBounds,area:PetBounds,measuredHeight?:number,pose?:string,measuredWidth?:number):PetBounds & {placement:string;tailX:number};
