import { app, BrowserWindow, Menu, screen, ipcMain } from 'electron';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { constrain } from './geometry.mjs';
import { DEFAULT_PET_WIDTH, PET_WIDTH_PRESETS, dimensionsFor, nextWidth, resizeAroundFeet, restoreWindowBounds } from './window-size.mjs';

let win: BrowserWindow;
let diagnostics: BrowserWindow | undefined;
function log(message: string) { try { appendFileSync(join(app.getPath('userData'),'qa.log'), `${new Date().toISOString()} ${message}\n`); } catch { /* stderr remains available */ } }
function openDiagnostics(show=true) {
 if (diagnostics && !diagnostics.isDestroyed()) { diagnostics.show(); return diagnostics; }
 diagnostics = new BrowserWindow({width:1280,height:900,show,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 diagnostics.webContents.on('render-process-gone', (_event, details) => log(`diagnostic renderer gone: ${details.reason}`));
 diagnostics.webContents.on('did-fail-load', (_event, code, message) => log(`diagnostic load ${code}: ${message}`));
 diagnostics.loadFile(join(__dirname,'../preview.html'));
 return diagnostics;
}
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
function showMenu() {
 if (!win || win.isDestroyed()) return;
 const current=win.getBounds().width;
 const sizes=PET_WIDTH_PRESETS.map(width=>({
  label:`${width}px${width===DEFAULT_PET_WIDTH?' · 기본':''}`,
  type:'radio' as const, checked:width===current, click:()=>resizePet(width)
 }));
 Menu.buildFromTemplate([
  {label:'크기 한 단계 작게',click:()=>changeSizeBy(-1)},
  {label:'크기 한 단계 크게',click:()=>changeSizeBy(1)},
  {label:'펫 크기 선택',submenu:sizes},
  {type:'separator'},
  {label:'포즈 미리보기',submenu:[
    {label:'대기 · Idle',click:()=>win.webContents.send('pet:action','idle')},
    {label:'흡연 · Smoking',click:()=>win.webContents.send('pet:action','smoking')},
    {label:'노트북 · Working',click:()=>win.webContents.send('pet:action','working')},
    {label:'리볼버 꺼내기 · Drawing',click:()=>win.webContents.send('pet:action','drawing')},
    {label:'사격 · Firing',click:()=>win.webContents.send('pet:action','firing')},
    {label:'앉기 · Sitting',click:()=>win.webContents.send('pet:action','sitting')}
  ]},
  {type:'separator'},
  {label:'B형 동작·포즈 검수',click:()=>openDiagnostics()},
  {label:'진단 개발자 도구',click:()=>openDiagnostics().webContents.openDevTools()},
  {type:'separator'},
  {label:'종료',click:()=>app.quit()}
 ]).popup({window:win});
}
function nativeFrameless() {
 const outer=win.getBounds(),content=win.getContentBounds();
 const deltaWidth=outer.width-content.width,deltaHeight=outer.height-content.height;
 return {passed:Math.abs(deltaWidth)<=1&&Math.abs(deltaHeight)<=1,deltaWidth,deltaHeight};
}

app.whenReady().then(() => {
  win = new BrowserWindow({ ...restore(), transparent:true, frame:false, titleBarOverlay:false, autoHideMenuBar:true, thickFrame:false, backgroundColor:'#00000000', alwaysOnTop:true, resizable:false, hasShadow:false, webPreferences:{preload:join(__dirname,'preload.cjs'), contextIsolation:true, nodeIntegration:false, sandbox:true} });
  win.setMenuBarVisibility(false);
  win.webContents.on('did-fail-load',(_event,code,message)=>log(`pet load ${code}: ${message}`));
  win.loadFile(join(__dirname, '../dist/index.html'));
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
    if(!process.argv.includes('--qa-smoke'))showMenu();
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
        writeFileSync(reportFile,JSON.stringify({passed:true,startWidth,resizeChecked,manualPoseChecked,menuRequests,hitChanges,mouseQa,nativeFrameless:chrome,...result,...interactions}));app.quit();
      } catch(error) { writeFileSync(reportFile,JSON.stringify({passed:false,resizeChecked,nativeFrameless:chrome,error:String(error)}));app.exit(1); }
    });
    setTimeout(()=>app.exit(2),20000).unref();
  }
  screen.on('display-removed', refit); screen.on('display-metrics-changed', refit);
});
app.on('window-all-closed', () => app.quit());
