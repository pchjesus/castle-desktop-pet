import type {PetBounds} from './window-size.mjs';
export function compareClearRegions(surface:Uint8Array,width:number,height:number,bounds:PetBounds,actualAt:(x:number,y:number)=>number[]|null,expectedAt:(x:number,y:number)=>number[]|null,excluded?:PetBounds[]):{checked:number;mismatches:number;ratio:number;passed:boolean};
