import {extractAlpha,hitTestAlpha,type AlphaMask} from './alpha-hit-test.mjs';
// No CSS -webkit-app-region:drag: Electron treats drag regions as non-client
// surfaces which swallow mouse clicks, context menus and cause Windows chrome.
export function installPetMouse(root:HTMLElement) {
 let lastPoint: {x:number;y:number}|null=null;
 let lastInteractive: boolean|undefined;
 let dragging=false;
 let pointerId:number|null=null;
 const masks=new Map<string,AlphaMask>();
 function currentImg(){return root.querySelector<HTMLImageElement>('.pet-stage img');}
 function maskFor(img:HTMLImageElement):AlphaMask|null {
  if(!img.complete||img.naturalWidth<=0||img.naturalHeight<=0) return null;
  const key=img.currentSrc||img.src;
  const known=masks.get(key);if(known)return known;
  try {
   const canvas=document.createElement('canvas');
   canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx) return null;
   ctx.drawImage(img,0,0);
   const data=ctx.getImageData(0,0,canvas.width,canvas.height);
   const mask=extractAlpha(data.data,canvas.width,canvas.height);
   // Cap caches to keep a long-running desktop app bounded in memory.
   if(masks.size>=16)masks.delete(masks.keys().next().value!);
   masks.set(key,mask);
   return mask;
  }catch(error){console.error('Sprite alpha hit test unavailable',error);return null;}
 }
 function opaqueAt(x:number,y:number):boolean {
  const img=currentImg();
  // Fail interactively, not as an irrecoverably click-through pet.
  if(!img)return true;
  const mask=maskFor(img);
  if(!mask)return true;
  return hitTestAlpha(mask,img.getBoundingClientRect(),x,y,24);
 }
 function allowInput(interactive:boolean) {
  if(dragging)interactive=true;
  if(interactive===lastInteractive)return;
  lastInteractive=interactive;
  window.pet?.setPassthrough(!interactive);
 }
 function refresh() {
  if(dragging){allowInput(true);return;}
  if(!lastPoint){allowInput(true);return;} // accessible until first mouse move
  allowInput(opaqueAt(lastPoint.x,lastPoint.y));
 }
 function onMove(ev:MouseEvent) {
  lastPoint={x:ev.clientX,y:ev.clientY};
  refresh();
 }
 // Forwarded mousemove is delivered even when setIgnoreMouseEvents(true,{forward:true}).
 window.addEventListener('mousemove',onMove,{passive:true});
 document.addEventListener('mouseleave',()=>{if(!dragging)allowInput(false);});
 const observer=new MutationObserver(()=>{lastInteractive=undefined;refresh();});
 observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
 root.addEventListener('load',()=>{lastInteractive=undefined;refresh();},true);
 root.addEventListener('error',()=>{lastInteractive=undefined;refresh();},true);
 // Open our menu ONLY when the user's actual pointer is on visible art.
 document.addEventListener('contextmenu',ev=>{
  if(!opaqueAt(ev.clientX,ev.clientY))return;
  ev.preventDefault();ev.stopPropagation();
  allowInput(true);
  window.pet?.showMenu();
 });
 root.addEventListener('pointerdown',ev=>{
  if(ev.button!==0||!opaqueAt(ev.clientX,ev.clientY))return;
  dragging=true;pointerId=ev.pointerId;
  allowInput(true);
  root.setPointerCapture(ev.pointerId);
  window.pet?.dragStart();
  ev.preventDefault();
 });
 root.addEventListener('pointermove',ev=>{
  if(dragging&&pointerId===ev.pointerId){window.pet?.dragMove();ev.preventDefault();}
 });
 function finish(ev?:PointerEvent) {
  if(!dragging)return;
  if(ev&&pointerId!==ev.pointerId)return;
  const last=pointerId;
  dragging=false;pointerId=null;
  if(last!==null&&root.hasPointerCapture(last))root.releasePointerCapture(last);
  window.pet?.dragEnd();
  lastInteractive=undefined;refresh();
 }
 root.addEventListener('pointerup',finish);
 root.addEventListener('pointercancel',finish);
 window.addEventListener('blur',()=>finish());
 window.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&dragging)finish();
 });
 // The first cursor motion classifies transparent vs visible sprite pixels.
 refresh();
}
