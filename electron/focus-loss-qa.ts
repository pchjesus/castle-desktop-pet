import {BrowserWindow,screen} from 'electron';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {desktop} from './plain-launch-qa';
import {nativeWindowAudit} from './native-window-audit';

const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const backdropColor=[25,33,43];
// A focused transparent renderer may have alpha=0 even while Windows itself
// paints a ghost caption underneath it. Desktop compositor pixels are the
// actual evidence; capturePage alone is insufficient.
async function inspectClearTop(win:BrowserWindow,label:string,evidence:string){
 const page=await win.webContents.capturePage(),original=page.toBitmap(),sz=page.getSize();
 const result=await desktop(win),pixels=result.image.toBitmap(),image=result.image.getSize();
 const bounds=win.getBounds(),area=result.display.bounds;
 const samples=[];
 for(const y of [3,8,14,21,29]){
  for(const x of [5,15,Math.floor(sz.width*.25),Math.floor(sz.width*.5),Math.floor(sz.width*.75),sz.width-16,sz.width-6]){
   if(x<0||x>=sz.width||y>=sz.height||original[(y*sz.width+x)*4+3]>15)continue;
   const screenX=bounds.x+x,screenY=bounds.y+y;
   const px=Math.floor((screenX-area.x)/area.width*image.width),py=Math.floor((screenY-area.y)/area.height*image.height);
   if(px<0||py<0||px>=image.width||py>=image.height)continue;
   const off=(py*image.width+px)*4,rgb=[pixels[off+2],pixels[off+1],pixels[off]];
   samples.push({x,y,rgb,deviation:Math.max(...rgb.map((v,i)=>Math.abs(v-backdropColor[i])))});
  }
 }
 const visiblyWrong=samples.filter(s=>s.deviation>55);
 const captures=join(evidence,'focus-loss-captures');mkdirSync(captures,{recursive:true});
 writeFileSync(join(captures,label+'-desktop.png'),result.image.toPNG());
 writeFileSync(join(captures,label+'-alpha.png'),page.toPNG());
 return {label,total:samples.length,wrong:visiblyWrong.length,examples:visiblyWrong.slice(0,8),passed:samples.length>=8&&visiblyWrong.length<=1};
}
async function clickSprite(win:BrowserWindow){
 const point=await win.webContents.executeJavaScript(`(()=>{
  const im=document.querySelector('.pet-stage:not([data-exiting]) img');
  if(!im?.complete||!im.naturalWidth)return null;
  const r=im.getBoundingClientRect(),c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);
  const data=ctx.getImageData(0,0,c.width,c.height).data;
  const scale=Math.min(r.width/c.width,r.height/c.height);
  for(let y=Math.floor(c.height*.3);y<c.height*.7;y+=12)
   for(let x=Math.floor(c.width*.3);x<c.width*.7;x+=12)
    if(data[(y*c.width+x)*4+3]>235)return{x:Math.floor(r.x+(r.width-c.width*scale)/2+x*scale),y:Math.floor(r.y+(r.height-c.height*scale)/2+y*scale)};
  return null;
 })()`);
 if(!point)throw Error('Cannot find interactive opaque sprite pixel');
 win.webContents.sendInputEvent({type:'mouseMove',...point});
 win.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...point});
 win.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...point});
 return point;
}
export async function focusLossQa(win:BrowserWindow,report:string,repairStats:()=>unknown){
 const area=screen.getDisplayMatching(win.getBounds()).workArea;
 const backdrop=new BrowserWindow({...area,show:false,frame:false,backgroundColor:'#19212b',alwaysOnTop:false,skipTaskbar:true,
  webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const result:any={passed:false,checks:[],error:null};
 try{
  await backdrop.loadURL('data:text/html,<body style="margin:0;background:%2319212b;height:100vh"></body>');
  backdrop.show();backdrop.focus();await pause(180);
  // Repeat actual sprite click -> focus another native window, matching the
  // report: titlebar appears only after interaction and then outside click.
  for(let cycle=0;cycle<2;cycle++){
   win.focus();await pause(150);
   const point=await clickSprite(win);await pause(90);
   backdrop.focus();await pause(340);
   const before=win.getBounds();
   const clear=await inspectClearTop(win,'cycle-'+cycle,dirname(report));
   const audit=nativeWindowAudit([{role:'pet',window:win}]);
   const caption=(audit.native as {role:string;caption:boolean}[]).find(x=>x.role==='pet')?.caption;
   const geometryUnchanged=JSON.stringify(before)===JSON.stringify(win.getBounds());
   result.checks.push({cycle,point,clear,caption,geometryUnchanged,resizable:win.isResizable(),
    petFocused:win.isFocused(),backdropFocused:backdrop.isFocused(),repair:repairStats()});
   if(!clear.passed||caption!==false||!geometryUnchanged||win.isResizable()||win.isFocused()||!backdrop.isFocused())
    throw Error('Native focus-loss transparent chrome regression: '+JSON.stringify(result.checks.at(-1)));
  }
  result.passed=true;
 }catch(error){result.error=String(error);}
 finally{
  if(!backdrop.isDestroyed())backdrop.close();
  writeFileSync(report,JSON.stringify(result,null,2));
 }
 return result;
}
