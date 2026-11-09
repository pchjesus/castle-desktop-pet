// Local, pure menu geometry. Prefer showing the pet over preserving cursor adjacency.
export const MIN_MENU={width:300,height:300};
export const MAX_MENU={width:620,height:720};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function menuSize(input={},work={width:1920,height:1080}){
 return {width:clamp(Number(input.width)||316,Math.min(MIN_MENU.width,work.width),Math.min(MAX_MENU.width,work.width)),
 height:clamp(Number(input.height)||316,Math.min(MIN_MENU.height,work.height),Math.min(MAX_MENU.height,work.height))};
}
export function clampMenu(bounds,work){
 const size=menuSize(bounds,work);
 return {...size,x:clamp(Number(bounds.x)||0,work.x,work.x+work.width-size.width),
  y:clamp(Number(bounds.y)||0,work.y,work.y+work.height-size.height)};
}
export function overlapArea(a,b){
 const w=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
 const h=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 return w*h;
}
export function placeMenu(pet,work,cursor,inputSize={},saved=null){
 const size=menuSize(inputSize,work),gap=14, midX=pet.x+pet.width/2,midY=pet.y+pet.height/2;
 const spots=[
  {x:pet.x+pet.width+gap,y:cursor.y-size.height*.35},
  {x:pet.x-size.width-gap,y:cursor.y-size.height*.35},
  {x:cursor.x-size.width*.5,y:pet.y-size.height-gap},
  {x:cursor.x-size.width*.5,y:pet.y+pet.height+gap},
  {x:work.x,y:cursor.y-size.height/2},
  {x:work.x+work.width-size.width,y:cursor.y-size.height/2},
  {x:midX-size.width/2,y:work.y},
  {x:midX-size.width/2,y:work.y+work.height-size.height}
 ];
 if(saved && Number.isFinite(saved.x) && Number.isFinite(saved.y))spots.unshift({x:saved.x,y:saved.y,saved:true});
 const unique=[],seen=new Set();
 for(const p of spots){const b=clampMenu({...size,...p},work),key=b.x+','+b.y;if(!seen.has(key)){seen.add(key);unique.push({...b,saved:!!p.saved});}}
 // Keep saved manual placement if it does not hide any part of the pet.
 const manual=unique.find(x=>x.saved&&overlapArea(x,pet)===0);
 if(manual){const {saved,...bounds}=manual;return bounds;}
 unique.sort((a,b)=>overlapArea(a,pet)-overlapArea(b,pet)||
  Math.hypot(a.x+a.width/2-cursor.x,a.y+a.height/2-cursor.y)-Math.hypot(b.x+b.width/2-cursor.x,b.y+b.height/2-cursor.y));
 const {saved:unused,...bounds}=unique[0];return bounds;
}
