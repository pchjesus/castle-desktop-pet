import {loadSettings,saveSettings} from '../src/behavior/settings-store.mjs';
import {normalizeSettings} from '../src/behavior/controller.mjs';
import { app, BrowserWindow, screen, ipcMain, powerMonitor } from 'electron';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { constrain } from './geometry.mjs';
import { DEFAULT_PET_WIDTH, PET_WIDTH_PRESETS, dimensionsFor, nextWidth, resizeAroundFeet, restoreWindowBounds } from './window-size.mjs';

let win: BrowserWindow;
let diagnostics: BrowserWindow | undefined;
let menuWindow: BrowserWindow | undefined;
const isSmoke=process.argv.includes('--qa-smoke');
function log(message: string) { try { appendFileSync(join(app.getPath('userData'),'qa.log'), `${new Date().toISOString()} ${message}\n`); } catch { /* stderr remains available */ } }
function openDiagnostics(show=true) {
 if (diagnostics && !diagnostics.isDestroyed()) { diagnostics.show(); return diagnostics; }
 diagnostics = new BrowserWindow({width:1280,height:900,show,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 diagnostics.webContents.on('render-process-gone', (_event, details) => log(`diagnostic renderer gone: ${details.reason}`));
 diagnostics.webContents.on('did-fail-load', (_event, code, message) => log(`diagnostic load ${code}: ${message}`));
 diagnostics.loadFile(join(__dirname,'../preview.html'));
 return diagnostics;
}
let behaviorSettings=normalizeSettings(null);
function readBehavior(){behaviorSettings=loadSettings(join(app.getPath('userData'),'behavior.json'));return behaviorSettings;}
const defaults = { x: 100, y: 100, ...dimensionsFor(DEFAULT_PET_WIDTH) };
const path = () => join(app.getPath('userData'), 'window.json');
function fit(bounds: Electron.Rectangle) { return constrain(bounds, screen.getAllDisplays().map(d => d.workArea)); }
function restore() {
  try {
    const saved = restoreWindowBounds(JSON.parse(readFileSync(path(), 'utf8')));
    if (saved) return fit(saved);
  } catch { /* use defaults */ }
  const a = screen.getPrimaryDisplay().workArea;
  return fit({ ...defaults, x: a.x + a.width - defaults.width, y: a.y + a.height - defaults.height });
}
function save() { try { writeFileSync(path(), JSON.stringify({settingsVersion:2,...win.getBounds()})); } catch (error) { log('Unable to save window position: '+String(error)); } }
function resizePet(width: number) {
 if (!win || win.isDestroyed()) return;
 try { win.setBounds(fit(resizeAroundFeet(win.getBounds(),width))); save(); }
 catch(error) { log('Resize rejected: '+String(error)); }
}
function changeSizeBy(direction: number) { resizePet(nextWidth(win.getBounds().width,direction)); }

const menuWidth=270,menuHeight=486;
function closePetMenu() {
 const old=menuWindow;
 menuWindow=undefined;
 if(old && !old.isDestroyed()) old.close();
}
function openPetMenu() {
 if(!win || win.isDestroyed())return;
 closePetMenu();
 const pt=screen.getCursorScreenPoint();
 const work=screen.getDisplayNearestPoint(pt).workArea;
 const place=constrain({x:pt.x+12,y:pt.y-24,width:menuWidth,height:menuHeight},[work]);
 const popup=new BrowserWindow({
  ...place,frame:false,transparent:true,titleBarOverlay:false,thickFrame:false,
  backgroundColor:'#00000000',alwaysOnTop:true,skipTaskbar:true,
  hasShadow:false,resizable:false,show:false,
  webPreferences:{preload:join(__dirname,'menu-preload.cjs'),
   contextIsolation:true,nodeIntegration:false,sandbox:true}
 });
 menuWindow=popup;
 popup.setMenu(null);
 popup.on('system-context-menu',event=>event.preventDefault());
 popup.on('closed',()=>{if(menuWindow===popup)menuWindow=undefined;});
 if(!isSmoke) popup.on('blur',()=>{if(menuWindow===popup)closePetMenu();});
 popup.webContents.on('did-fail-load',(_event,code,reason)=>log('custom menu load failed '+code+': '+reason));
 popup.loadFile(join(__dirname,'pet-menu.html'),{query:{size:String(win.getBounds().width),...Object.fromEntries(Object.entries(behaviorSettings).map(([k,v])=>[k,String(v)]))}})
  .then(()=>{if(!isSmoke && !popup.isDestroyed())popup.show();})
  .catch(error=>log('custom menu exception '+String(error)));
 return popup;
}
function inspectMenuChrome(popup:BrowserWindow) {
 const outer=popup.getBounds(),content=popup.getContentBounds();
 return {passed:Math.abs(outer.width-content.width)<=1&&Math.abs(outer.height-content.height)<=1,
  deltaWidth:outer.width-content.width,deltaHeight:outer.height-content.height};
}
function openDiagnosticsAt(pose:'dual_firing'|'firing_dynamic'|'speaking_reference') {
 const diag=openDiagnostics(true);
 const select=()=>{
  if(diag.isDestroyed())return;
  // All values are from the fixed three-entry allowlist, not user content.
  const script=`(()=>{const e=document.querySelector('#canonical-action');if(!e)return false;
   e.value=${JSON.stringify(pose)};
   e.dispatchEvent(new Event('change',{bubbles:true}));
   const review=document.querySelector('.canonical-review');
   review?.scrollIntoView({block:'start'});
   return true;})()`;
  diag.webContents.executeJavaScript(script).catch(error=>log('pose diagnostics selection: '+String(error)));
 };
 if(diag.webContents.isLoading())diag.webContents.once('did-finish-load',select);else select();
}
function dispatchPetMenuCommand(command:string) {
 if(!win || win.isDestroyed())return;
 if(command.startsWith('setting:')){const [,key,value]=command.split(':');if(key==='base'&&(value==='idle'||value==='smoking'))behaviorSettings.base=value;else if((key==='autonomy'||key==='autoFire')&&(value==='true'||value==='false'))behaviorSettings[key]=value==='true';else return;try{saveSettings(join(app.getPath('userData'),'behavior.json'),behaviorSettings);}catch(error){log('Behavior settings save failed: '+String(error));}win.webContents.send('pet:action','settings:'+JSON.stringify(behaviorSettings));return;}
 if(command==='quit'){app.quit();return;}
 if(command==='diagnostics'){openDiagnostics();return;}
 if(command==='diagnostics:dual_firing'){openDiagnosticsAt('dual_firing');return;}
 if(command==='diagnostics:firing_dynamic'){openDiagnosticsAt('firing_dynamic');return;}
 if(command==='diagnostics:speaking_reference'){openDiagnosticsAt('speaking_reference');return;}
 if(command==='size:smaller'){changeSizeBy(-1);return;}
 if(command==='size:larger'){changeSizeBy(1);return;}
 if(command.startsWith('size:')){
  const width=Number(command.slice(5));
  if(PET_WIDTH_PRESETS.includes(width))resizePet(width);
  return;
 }
 switch(command) {
  case 'pose:idle':win.webContents.send('pet:action','idle');break;
  case 'pose:smoking':win.webContents.send('pet:action','smoking');break;
  case 'pose:working':win.webContents.send('pet:action','working');break;
  case 'pose:drawing':win.webContents.send('pet:action','drawing');break;
  case 'pose:firing':win.webContents.send('pet:action','firing');break;
  case 'pose:dual_firing':win.webContents.send('pet:action','dual_firing');break;
  case 'pose:speaking':win.webContents.send('pet:action','speaking');break;
  case 'pose:firing_dynamic':win.webContents.send('pet:action','firing_dynamic');break;
  case 'pose:sitting':win.webContents.send('pet:action','sitting');break;
  default:log('Unknown pet menu command rejected');
 }
}

function nativeFrameless() {
 const outer=win.getBounds(),content=win.getContentBounds();
 const deltaWidth=outer.width-content.width,deltaHeight=outer.height-content.height;
 return {passed:Math.abs(deltaWidth)<=1&&Math.abs(deltaHeight)<=1,deltaWidth,deltaHeight};
}

app.whenReady().then(() => {
  const suspend=()=>{if(win&&!win.isDestroyed())win.webContents.send('pet:action','system:suspend');};
  const resume=()=>{if(win&&!win.isDestroyed())win.webContents.send('pet:action','system:resume');};
  powerMonitor.on('suspend',suspend);powerMonitor.on('resume',resume);
  app.once('will-quit',()=>{powerMonitor.off('suspend',suspend);powerMonitor.off('resume',resume);});
  win = new BrowserWindow({ ...restore(), transparent:true, frame:false, titleBarOverlay:false, autoHideMenuBar:true, thickFrame:false, backgroundColor:'#00000000', alwaysOnTop:true, resizable:false, hasShadow:false, webPreferences:{preload:join(__dirname,'preload.cjs'), contextIsolation:true, nodeIntegration:false, sandbox:true} });
  win.setMenu(null);
  win.setMenuBarVisibility(false);
  // Suppress Windows' native titlebar/system menu on non-client right clicks.
  win.on('system-context-menu',event=>{event.preventDefault();log('Windows system context menu suppressed');});
  win.webContents.on('did-fail-load',(_event,code,message)=>log(`pet load ${code}: ${message}`));
  readBehavior();
  win.loadFile(join(__dirname, '../dist/index.html'),{query:Object.fromEntries(Object.entries(behaviorSettings).map(([k,v])=>[k,String(v)]))});
  win.on('moved', save); win.on('resize', save); win.on('close', save);
  // DOM contextmenu is alpha-gated in the renderer; never open on clear pixels.
  let ignoresPointer=false;
  let menuRequests=0;
  let hitChanges=0;
  type DragStart={bounds:Electron.Rectangle;point:Electron.Point};
  let drag:DragStart|null=null;
  function endDrag(){
    if(!drag)return;
    drag=null;save();
  }
  const isPet=(event:Electron.IpcMainEvent)=>event.sender===win.webContents&&!win.isDestroyed();
  ipcMain.on('show-menu',(event)=>{
    if(!isPet(event))return;
    menuRequests++;
    openPetMenu();
  });
  ipcMain.on('pet-menu:command',(event,command)=>{
    if(!menuWindow || menuWindow.isDestroyed() || event.sender!==menuWindow.webContents || typeof command!=='string')return;
    closePetMenu();
    dispatchPetMenuCommand(command);
  });
  ipcMain.on('pet-menu:dismiss',event=>{
    if(menuWindow && !menuWindow.isDestroyed() && event.sender===menuWindow.webContents)closePetMenu();
  });
  ipcMain.on('pet:passthrough',(event,ignore)=>{
    if(!isPet(event)||typeof ignore!=='boolean'||drag)return;
    if(ignore===ignoresPointer)return;
    ignoresPointer=ignore;hitChanges++;
    win.setIgnoreMouseEvents(ignore,ignore?{forward:true}:{});
  });
  ipcMain.on('pet:drag-start',(event)=>{
    if(!isPet(event))return;
    if(ignoresPointer){win.setIgnoreMouseEvents(false);ignoresPointer=false;}
    drag={bounds:win.getBounds(),point:screen.getCursorScreenPoint()};
  });
  ipcMain.on('pet:drag-move',(event)=>{
    if(!isPet(event)||!drag)return;
    const point=screen.getCursorScreenPoint();
    const desired=fit({...drag.bounds,x:drag.bounds.x+point.x-drag.point.x,y:drag.bounds.y+point.y-drag.point.y});
    win.setPosition(desired.x,desired.y);
  });
  ipcMain.on('pet:drag-end',(event)=>{if(isPet(event))endDrag();});
  win.on('blur',endDrag);
  win.webContents.on('before-input-event',(event,input)=>{
    if(input.type!=='keyDown'||!input.control) return;
    if(input.key==='-'||input.key==='Subtract'){event.preventDefault();changeSizeBy(-1);}
    else if(input.key==='='||input.key==='+'||input.key==='Add'){event.preventDefault();changeSizeBy(1);}
  });
  const chrome=nativeFrameless();log('frameless: '+JSON.stringify(chrome));
  const refit = () => { if (!win.isDestroyed()) { win.setBounds(fit(win.getBounds())); save(); } };
  if (process.argv.includes('--qa-smoke')) {
    const reportIndex=process.argv.indexOf('--qa-report');const reportFile=reportIndex>=0 ? process.argv[reportIndex+1] : join(app.getPath('userData'),'qa-smoke.json');
    const startWidth=win.getBounds().width;
    resizePet(140); const smaller=win.getBounds();
    resizePet(180); const larger=win.getBounds();
    const resizeChecked=smaller.width===140&&smaller.height===175&&larger.width===180&&larger.height===225;
    const qa = openDiagnostics(false);
    qa.webContents.once('did-finish-load', async () => {
      try {
        const result = await qa.webContents.executeJavaScript(`new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{const a=document.querySelector('#pet .pet-stage img'),b=document.querySelector('#b-action-image');if(a?.complete&&a.naturalWidth&&b?.complete&&b.naturalWidth){clearInterval(timer);resolve({petLoaded:true,bReviewLoaded:true,bWidth:b.naturalWidth});}else if(++n>100){clearInterval(timer);reject(Error('image readiness timeout'));}},100);})`);
        const interactions = await qa.webContents.executeJavaScript(`(()=>{const select=document.querySelector('#b-action'),repeat=document.querySelector('#b-repeat');select.value='working';repeat.checked=true;document.querySelector('#b-start').click();document.querySelector('#b-cancel').click();return {repeatChecked:repeat.checked,cancelledToIdle:document.querySelector('#b-action-image').dataset.pose==='idle'};})()`);
        if(win.webContents.isLoading()) await new Promise<void>(resolve=>win.webContents.once('did-finish-load',()=>resolve()));
        await win.webContents.executeJavaScript("window.__lastPetState='';document.querySelector('#app').addEventListener('pet-state',e=>window.__lastPetState=e.detail);true;");
        win.webContents.send('pet:action','drawing');
        const manualPoseChecked=await win.webContents.executeJavaScript(`new Promise(resolve=>{let n=0;const timer=setInterval(()=>{const im=document.querySelector('#app .pet-stage img');if(window.__lastPetState==='drawing'&&im?.complete&&im.naturalWidth>0&&im.currentSrc.includes('drawing-')){clearInterval(timer);resolve(true);}else if(++n>40){clearInterval(timer);resolve(false);}},100);})`);
        const approvedPoseChecked:Record<string,boolean>={};
        for(const [pose,width] of [['idle',956],['smoking',1003],['sitting',1003],['dual_firing',1024],['speaking',956],['firing_dynamic',1004]] as const){
          win.webContents.send('pet:action',pose);
          approvedPoseChecked[pose]=await win.webContents.executeJavaScript(`new Promise(resolve=>{let n=0;const timer=setInterval(()=>{const im=document.querySelector('#app .pet-stage img');if(window.__lastPetState===${JSON.stringify(pose)}&&im?.complete&&im.naturalWidth===${width}&&im.currentSrc.includes(${JSON.stringify(pose+'-')})){clearInterval(timer);resolve(true);}else if(++n>100){clearInterval(timer);resolve(false);}},100);})`);
        }
        if(Object.values(approvedPoseChecked).some(value=>!value))throw Error('Approved pose QA failed: '+JSON.stringify(approvedPoseChecked));
        win.webContents.send('pet:action','idle');
        // A synthetic client event proves the pixel-gated right click reaches
        // the preload IPC bridge without creating a native popup in headless QA.
        const mouseQa=await win.webContents.executeJavaScript(`new Promise(resolve=>{
          const image=document.querySelector('#app .pet-stage img');
          let ticks=0;const timer=setInterval(()=>{
            if(!image?.complete||!image.naturalWidth){if(++ticks>60){clearInterval(timer);resolve({success:false,reason:'no idle image'});}return;}
            clearInterval(timer);
            const rect=image.getBoundingClientRect();
            const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
            const context=c.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
            const alpha=context.getImageData(0,0,c.width,c.height).data;
            let found=null;
            const scale=Math.min(rect.width/c.width,rect.height/c.height);
            const drawnW=c.width*scale,drawnH=c.height*scale;
            // Use a deep interior pixel with an opaque 5x5 neighborhood.
            // Sampling the FIRST edge pixel causes fractional CSS scaling to
            // map back to clear alpha, creating a false negative on Windows.
            const cx=Math.floor(c.width/2),cy=Math.floor(c.height/2);
            outer:for(let radius=0;radius<Math.max(c.width,c.height);radius+=12){
              for(let dy=-radius;dy<=radius;dy+=12){
                for(let dx=-radius;dx<=radius;dx+=12){
                  const x=cx+dx,y=cy+dy;if(x<5||y<5||x>=c.width-5||y>=c.height-5)continue;
                  let solid=true;
                  for(let yy=-2;yy<=2&&solid;yy++)for(let xx=-2;xx<=2;xx++){
                    if(alpha[((y+yy)*c.width+(x+xx))*4+3]<200){solid=false;break;}
                  }
                  if(solid){
                    found={x:rect.left+(rect.width-drawnW)/2+(x+.5)*scale,
                      y:rect.top+(rect.height-drawnH)/2+(y+.5)*scale};
                    break outer;
                  }
                }
              }
            }
            if(!found){resolve({success:false,reason:'no opaque pixel'});return;}
            document.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:rect.left+1,clientY:rect.top+1}));
            document.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:found.x,clientY:found.y}));
            document.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:found.x,clientY:found.y}));
            resolve({success:true,point:found});
          },100);
        })`);
        if (!interactions.repeatChecked || !interactions.cancelledToIdle || !resizeChecked || !chrome.passed || !manualPoseChecked || !mouseQa.success)
          throw Error('B/window/live pose/mouse QA readiness failed: '+JSON.stringify({resizeChecked,chrome,manualPoseChecked,mouseQa,interactions}));
        await new Promise(resolve=>setTimeout(resolve,100));
        if(menuRequests<1||hitChanges<1)throw Error('Alpha menu/hit-test IPC not received: '+JSON.stringify({menuRequests,hitChanges}));
        const popup=menuWindow;
        if(!popup || popup.isDestroyed())throw Error('Custom menu window not constructed by alpha right-click');
        if(popup.webContents.isLoading()) await new Promise<void>(resolve=>popup.webContents.once('did-finish-load',()=>resolve()));
        const menuChrome=inspectMenuChrome(popup);
        const menuQA=await popup.webContents.executeJavaScript(`({hasSizing:!!document.querySelector('[data-action="size:180"]'),
          hasPose:!!document.querySelector('[data-action="pose:smoking"]'),
          hasBlocked:!!document.querySelector('[data-action="diagnostics:dual_firing"]'),
          buttonCount:document.querySelectorAll('button[data-action]').length})`);
        if(!menuChrome.passed||!menuQA.hasSizing||!menuQA.hasPose||!menuQA.hasBlocked||menuQA.buttonCount<20)
          throw Error('Custom frameless menu QA failed: '+JSON.stringify({menuChrome,menuQA}));
        // Validate actual menu command routing, not just static HTML presence.
        await popup.webContents.executeJavaScript(`document.querySelector('[data-action="size:160"]').click()`);
        await new Promise(resolve=>setTimeout(resolve,100));
        const resizedFromMenu=win.getBounds().width===160;
        resizePet(180);
        if(!resizedFromMenu)throw Error('Custom menu size command did not reach main window');
        writeFileSync(reportFile,JSON.stringify({passed:true,startWidth,resizeChecked,manualPoseChecked,approvedPoseChecked,
          menuRequests,hitChanges,mouseQa,menuChrome,menuQA,resizedFromMenu,
          nativeFrameless:chrome,...result,...interactions}));app.quit();
      } catch(error) { writeFileSync(reportFile,JSON.stringify({passed:false,resizeChecked,nativeFrameless:chrome,error:String(error)}));app.exit(1); }
    });
    setTimeout(()=>app.exit(2),45000).unref();
  }
  screen.on('display-removed', refit); screen.on('display-metrics-changed', refit);
});
app.on('window-all-closed', () => app.quit());
