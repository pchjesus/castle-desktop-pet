// Separate screen-space speech bounds; never resize/move the pet to fit text.
export function speechBounds(pet, area, measuredHeight=180) {
 const gap=8, inset=4, minWidth=128, preferredWidth=244;
 const right=area.x+area.width-(pet.x+pet.width)-gap-inset;
 const left=pet.x-area.x-gap-inset;
 const side=right>=preferredWidth?'right':left>=preferredWidth?'left':right>=left?'right':'left';
 const available=side==='right'?right:left;
 const width=Math.round(Math.min(preferredWidth,Math.max(minWidth,available),area.width-inset*2));
 const height=Math.round(Math.min(Math.max(36,measuredHeight),area.height-inset*2));
 let x=side==='right'?pet.x+pet.width+gap:pet.x-gap-width;
 let y=pet.y+pet.height*.24;
 let placement=side;
 if(available<minWidth){
  // Very narrow displays: use space outside the entire pet, never its face.
  x=pet.x+(pet.width-width)/2;
  const above=pet.y-area.y-inset-gap,below=area.y+area.height-pet.y-pet.height-inset-gap;
  placement=above>=height?'above':below>=height?'below':'unavailable';
  y=placement==='above'?pet.y-gap-height:pet.y+pet.height+gap;
 }
 x=Math.round(Math.max(area.x+inset,Math.min(x,area.x+area.width-inset-width)));
 y=Math.round(Math.max(area.y+inset,Math.min(y,area.y+area.height-inset-height)));
 return {x,y,width,height,placement};
}
