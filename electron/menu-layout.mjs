// Center-first roomy settings panel; reject overlap with the pet whenever possible.
export const DEFAULT_MENU={width:560,height:610};
export const MIN_MENU={width:320,height:340};
export const MAX_MENU={width:960,height:920};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function menuSize(input={},work={width:1920,height:1080}){
 const minW=Math.min(MIN_MENU.width,work.width),minH=Math.min(MIN_MENU.height,work.height);
 const maxW=Math.min(MAX_MENU.width,work.width),maxH=Math.min(MAX_MENU.height,work.height);
 return {width:Math.round(clamp(Number(input.width)||DEFAULT_MENU.width,minW,maxW)),
  height:Math.round(clamp(Number(input.height)||DEFAULT_MENU.height,minH,maxH))};
}
export function clampMenu(bounds,work){
 const size=menuSize(bounds,work);
 return {...size,x:Math.round(clamp(Number(bounds.x)||0,work.x,work.x+work.width-size.width)),
  y:Math.round(clamp(Number(bounds.y)||0,work.y,work.y+work.height-size.height))};
}
export function overlapArea(a,b){
 const w=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
 const h=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 return w*h;
}
export function placeMenu(pet,work,cursor,inputSize={},saved=null){
 const size=menuSize(inputSize,work),gap=16,
 center={x:Math.round(work.x+(work.width-size.width)/2),y:Math.round(work.y+(work.height-size.height)/2)};
 const candidates=[
  {...center},
  {x:pet.x+pet.width+gap,y:center.y},
  {x:pet.x-size.width-gap,y:center.y},
  {x:center.x,y:pet.y-size.height-gap},
  {x:center.x,y:pet.y+pet.height+gap},
  {x:work.x,y:center.y},
  {x:work.x+work.width-size.width,y:center.y},
  {x:center.x,y:work.y},
  {x:center.x,y:work.y+work.height-size.height}
 ];
 const seen=new Set(),options=[];
 for(const c of candidates){
  const b=clampMenu({...size,...c},work),key=b.x+':'+b.y;
  if(!seen.has(key)){seen.add(key);options.push(b);}
 }
 if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)){
  const b=clampMenu({...size,x:saved.x,y:saved.y},work);
  if(overlapArea(b,pet)===0)return b;
 }
 // Default center if safe, otherwise nearest non-overlapping position.
 options.sort((a,b)=>overlapArea(a,pet)-overlapArea(b,pet)||
  Math.hypot(a.x-center.x,a.y-center.y)-Math.hypot(b.x-center.x,b.y-center.y));
 return options[0];
}
