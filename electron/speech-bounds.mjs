import {headBounds} from './head-geometry.mjs';
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
export function speechBounds(pet,area,measuredHeight=96,pose='smoking',measuredWidth=236){
 const inset=4,gap=8,width=Math.min(Math.max(64,measuredWidth),236,area.width-inset*2),height=Math.min(Math.max(44,measuredHeight),area.height-inset*2);
 const head=headBounds(pet,pose),top=head.y+8-height;
 const protectedFace={x:head.x-3,y:head.y-2,width:head.width+6,height:head.height+6};
 const candidates=[
  {x:head.x+head.width*.15-width,y:top,placement:'upper-left'},
  {x:head.x+head.width*.85,y:top,placement:'upper-right'},
  {x:pet.x+pet.width*.14-gap-width,y:head.y-height*.25,placement:'left'},
  {x:pet.x+pet.width*.86+gap,y:head.y-height*.25,placement:'right'},
  {x:pet.x+(pet.width-width)/2,y:pet.y+pet.height+gap,placement:'below'}
 ];
 for(const candidate of candidates){
  const x=Math.round(Math.max(area.x+inset,Math.min(candidate.x,area.x+area.width-inset-width)));
  const y=Math.round(Math.max(area.y+inset,Math.min(candidate.y,area.y+area.height-inset-height)));
  // The bottom 14px are a transparent tail strip, not the balloon body.
  const body={x,y,width,height:height-14};
  if(!overlaps(body,protectedFace))return {x,y,width,height,placement:candidate.placement,tailX:Math.round(Math.max(10,Math.min(width-25,head.x+head.width*.2-x)))};
 }
 return {x:area.x+inset,y:area.y+inset,width,height,placement:'unavailable',tailX:12};
}
