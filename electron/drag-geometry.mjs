import {constrain} from './geometry.mjs';

// The Windows desktop pet is moved, never resized, by dragging.
// Cursor and display workArea are Electron screen (DIP) coordinates.
export function dragPosition(anchor,firstCursor,currentCursor,workAreas){
 const candidate={
  x:Math.round(anchor.x+currentCursor.x-firstCursor.x),
  y:Math.round(anchor.y+currentCursor.y-firstCursor.y),
  width:anchor.width,height:anchor.height
 };
 const limited=constrain(candidate,workAreas);
 return {x:limited.x,y:limited.y,width:anchor.width,height:anchor.height};
}
export function sameSize(first,second){
 return first.width===second.width&&first.height===second.height;
}
