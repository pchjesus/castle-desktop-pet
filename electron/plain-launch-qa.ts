import {BrowserWindow,screen,desktopCapturer} from 'electron';
import {writeFileSync,mkdirSync} from 'node:fs';import {join,dirname} from 'node:path';
import {nativeWindowAudit} from './native-window-audit';import {compareClearRegions} from './transparent-gaps.mjs';
export async function desktop(win:BrowserWindow){const display=screen.getDisplayMatching(win.getBounds());const sources=await desktopCapturer.getSources({types:['screen'],thumbnailSize:{width:1920,height:1080}});const source=sources.find(s=>s.display_id===String(display.id))||sources[0];if(!source||source.thumbnail.isEmpty())throw Error('Desktop capture unavailable');return {image:source.thumbnail,display};}
export async function beforePlainShow(win:BrowserWindow){
 // Let the previous QA process' native window-close animation settle. Capture
 // both baselines so any changing desktop is evidence, not an app failure.
 const initial=await desktop(win);await new Promise(resolve=>setTimeout(resolve,650));
 return {...await desktop(win),initial};
}
export async function finishPlainLaunch(win:BrowserWindow,before:Awaited<ReturnType<typeof beforePlainShow>>,windows:{role:string;window:BrowserWindow}[],report:string){
 const capture=await desktop(win),surface=await win.webContents.capturePage(),size=surface.getSize();
 const sample=(data:typeof capture)=>{const bitmap=data.image.toBitmap(),s=data.image.getSize(),area=data.display.bounds;return(x:number,y:number)=>{const xx=Math.floor((x-area.x)/area.width*s.width),yy=Math.floor((y-area.y)/area.height*s.height);if(xx<0||yy<0||xx>=s.width||yy>=s.height)return null;const i=(yy*s.width+xx)*4;return [bitmap[i+2],bitmap[i+1],bitmap[i]];};};
 const clear=compareClearRegions(surface.toBitmap(),size.width,size.height,win.getBounds(),sample(capture),sample(before));
 const baselineStability=compareClearRegions(surface.toBitmap(),size.width,size.height,win.getBounds(),sample(before),sample(before.initial));
 const audit=nativeWindowAudit(windows);const native=audit.native as {role:string;caption:boolean}[];
 const unexpected=windows.some(row=>row.role!=='pet'&&row.window.isVisible());
 const petLoaded=await win.webContents.executeJavaScript(`(()=>{const i=document.querySelector('.pet-stage:not([data-exiting]) img');return !!i?.complete&&i.naturalWidth>0})()`);
 const strip=(data:typeof capture)=>{const area=data.display.bounds,size=data.image.getSize();return data.image.crop({x:Math.round((area.width-64)/area.width*size.width),y:Math.round((win.getBounds().y-area.y)/area.height*size.height),width:Math.round(64/area.width*size.width),height:Math.round(win.getBounds().height/area.height*size.height)}).resize({width:64,height:450}).toDataURL();};
 const desktopChange=compareClearRegions(new Uint8Array(capture.display.bounds.width*capture.display.bounds.height*4),capture.display.bounds.width,capture.display.bounds.height,capture.display.bounds,sample(capture),sample(before));
 const result={...(clear.passed?{}:{edgeEvidence:{before:strip(before),after:strip(capture)},desktopChange}),baselineStability,captureSize:capture.image.getSize(),display:capture.display.bounds,cursor:screen.getCursorScreenPoint(),petLoaded,passed:petLoaded&&clear.passed&&!unexpected&&native.find(row=>row.role==='pet')?.caption===false,route:'CastlePet.exe -> validated runtime/resources/app -> normal pet startup; no diagnostic window',clear,audit};
 const out=join(dirname(report),'windows-b13-3-captures');mkdirSync(out,{recursive:true});writeFileSync(join(out,'plain-launch-before.png'),before.image.toPNG());writeFileSync(join(out,'plain-launch-initial.png'),before.initial.image.toPNG());writeFileSync(join(out,'plain-launch-desktop.png'),capture.image.toPNG());writeFileSync(join(out,'plain-launch-alpha.png'),surface.toPNG());writeFileSync(report,JSON.stringify(result));return result;
}
