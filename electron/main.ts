import {beforePlainShow,finishPlainLaunch} from './plain-launch-qa';
import {compareClearRegions} from './transparent-gaps.mjs';
import {nativeWindowAudit} from './native-window-audit';
import {behaviorQa} from './behavior-qa';
import {speechBounds} from './speech-bounds.mjs';
import {loadSettings,saveSettings} from '../src/behavior/settings-store.mjs';
import {normalizeSettings} from '../src/behavior/controller.mjs';
import { app, BrowserWindow, screen, ipcMain, powerMonitor, desktopCapturer, dialog } from 'electron';
import {dialogues} from '../src/behavior/dialogues.mjs';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { constrain } from './geometry.mjs';
import { DEFAULT_PET_WIDTH, PET_WIDTH_PRESETS, dimensionsFor, nextWidth, resizeAroundFeet, restoreWindowBounds } from './window-size.mjs';

let win: BrowserWindow;
let diagnostics: BrowserWindow | undefined;
let menuWindow: BrowserWindow | undefined;
const isSmoke=process.argv.includes('--qa-smoke');
function log(message: string) { try { appendFileSync(join(app.getPath('userData'),'qa.log'), `${new Date().toISOString()} ${message}\n`); } catch { /* stderr remains available */ } }
function openDiagnostics(show=true) {
 if (diagnostics && !diagnostics.isDestroyed()) { diagnostics.show(); return diagnostics; }
 diagnostics = new BrowserWindow({title:'캐슬 펫 · 이미지 검수 도구',width:1280,height:900,show,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 diagnostics.webContents.on('render-process-gone', (_event, details) => log(`diagnostic renderer gone: ${details.reason}`));
 diagnostics.webContents.on('did-fail-load', (_event, code, message) => log(`diagnostic load ${code}: ${message}`));
 diagnostics.on('page-title-updated',event=>{event.preventDefault();diagnostics?.setTitle('캐슬 펫 · 이미지 검수 도구');});
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

const menuWidth=316,menuHeight=316;
function closePetMenu() {
 const old=menuWindow;
 menuWindow=undefined;
 if(old && !old.isDestroyed()) old.close();
}
function openPetMenu(showInSmoke=false) {
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
 if(!isSmoke||showInSmoke) popup.on('blur',()=>{if(menuWindow===popup)closePetMenu();});
 popup.webContents.on('did-fail-load',(_event,code,reason)=>log('custom menu load failed '+code+': '+reason));
 popup.loadFile(join(__dirname,'pet-menu.html'),{query:{size:String(win.getBounds().width),...Object.fromEntries(Object.entries(behaviorSettings).map(([k,v])=>[k,String(v)]))}})
  .then(()=>{if((!isSmoke||showInSmoke) && !popup.isDestroyed())popup.show();})
  .catch(error=>log('custom menu exception '+String(error)));
 return popup;
}
// Read-only menu snapshot. Only the active sandboxed menu renderer may access it.
ipcMain.handle('pet-menu:get-info',event=>{
 if(!menuWindow||menuWindow.isDestroyed()||event.sender!==menuWindow.webContents)return null;
 return {status:{pose:currentPose,base:behaviorSettings.base,autonomy:behaviorSettings.autonomy,dialogueEnabled:behaviorSettings.dialogueEnabled,autoFire:behaviorSettings.autoFire,movementFrequency:behaviorSettings.movementFrequency,dialogueFrequency:behaviorSettings.dialogueFrequency,codexConnected:false},
  dialogues:dialogues.map(d=>({id:d.id,text:d.text,origin:d.origin,approval:d.approval,poses:d.poses,triggers:d.triggers,rarity:d.rarity,random:d.random}))};
});
// Non-focusing, always click-through speech surface. Does not change pet bounds.
let speechWindow:BrowserWindow|undefined,speechText='',speechHeight=96,speechWidth=236,currentPose='smoking';
let speechHide:ReturnType<typeof setTimeout>|undefined;
function positionSpeech(){
 if(!speechWindow||speechWindow.isDestroyed()||!win||win.isDestroyed())return false;
 const pet=win.getBounds(),area=screen.getDisplayMatching(pet).workArea;
 const {placement,tailX,...bounds}=speechBounds(pet,area,speechHeight,currentPose,speechWidth);
 speechWindow.setBounds(bounds);
 if(!speechWindow.webContents.isLoading())speechWindow.webContents.send('speech:placement',{placement,tailX});
 if(placement==='unavailable'){speechWindow.hide();log('Speech: display has no unobstructed space');return false;}
 if(speechText&&win.isVisible()&&!speechWindow.webContents.isLoading()&&!speechWindow.isVisible())speechWindow.showInactive();
 return true;
}
function updateSpeech(text:string){
 if(!win||win.isDestroyed())return;
 speechText=text;clearTimeout(speechHide);
 if(!speechWindow||speechWindow.isDestroyed()){
  // Warm the hidden speech renderer on the initial empty message, so the
  // first dialogue does not pay a new-window startup delay before its shot.
  const popup=new BrowserWindow({width:244,height:180,show:false,parent:win,frame:false,
   transparent:true,backgroundColor:'#00000000',hasShadow:false,alwaysOnTop:true,
   skipTaskbar:true,focusable:false,resizable:false,thickFrame:false,
   webPreferences:{preload:join(__dirname,'speech-preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false}});
  speechWindow=popup;popup.setMenu(null);popup.setIgnoreMouseEvents(true);
  popup.on('closed',()=>{if(speechWindow===popup)speechWindow=undefined;});
  popup.loadFile(join(__dirname,'pet-speech.html')).then(()=>updateSpeech(speechText)).catch(error=>log('speech load: '+String(error)));
  return;
 }
 if(speechWindow.webContents.isLoading())return;
 speechWindow.webContents.send('speech:text',text);
 if(!text)speechHide=setTimeout(()=>{if(!speechText&&!speechWindow?.isDestroyed())speechWindow?.hide();},160);
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
const commandTrace:Record<string,unknown>[]=[];let commandSequence=0;
function sendManualPose(pose:string){const id=++commandSequence;commandTrace.push({phase:'sent',commandId:id,pose,at:Date.now()});if(commandTrace.length>256)commandTrace.shift();win.webContents.send('pet:action',{kind:'manual',id,pose});return id;}
function dispatchPetMenuCommand(command:string) {
 if(!win || win.isDestroyed())return;
 if(command.startsWith('setting:')){const [,key,value]=command.split(':');if(key==='base'&&(value==='idle'||value==='smoking'))behaviorSettings.base=value;else if((key==='autonomy'||key==='autoFire'||key==='dialogueEnabled')&&(value==='true'||value==='false'))behaviorSettings[key]=value==='true';else if((key==='movementFrequency'||key==='dialogueFrequency')&&['quiet','default','active'].includes(value))behaviorSettings[key]=value as 'quiet'|'default'|'active';else return;try{saveSettings(join(app.getPath('userData'),'behavior.json'),behaviorSettings);}catch(error){log('Behavior settings save failed: '+String(error));}win.webContents.send('pet:action','settings:'+JSON.stringify(behaviorSettings));return;}
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
  case 'pose:idle':sendManualPose('idle');break;
  case 'pose:smoking':sendManualPose('smoking');break;
  case 'pose:working':sendManualPose('working');break;
  case 'pose:drawing':sendManualPose('drawing');break;
  case 'pose:firing':sendManualPose('firing');break;
  case 'pose:dual_firing':sendManualPose('dual_firing');break;
  case 'pose:speaking':sendManualPose('speaking');break;
  case 'pose:firing_dynamic':sendManualPose('firing_dynamic');break;
  case 'pose:sitting':sendManualPose('sitting');break;
  default:log('Unknown pet menu command rejected');
 }
}

function nativeFrameless() {
 const outer=win.getBounds(),content=win.getContentBounds();
 const deltaWidth=outer.width-content.width,deltaHeight=outer.height-content.height;
 return {passed:Math.abs(deltaWidth)<=1&&Math.abs(deltaHeight)<=1,deltaWidth,deltaHeight};
}

// Portable folders must enter through the validated root launcher. Development
// npm start remains supported; it has no packaged runtime marker.
const hasPortableMarker=(()=>{try{readFileSync(join(__dirname,'../castle-runtime.json'));return true;}catch{return false;}})();
const validPortableLaunch=!hasPortableMarker||process.argv.includes('--castle-pet-launcher');
const singleInstance=app.requestSingleInstanceLock();
if(!singleInstance)app.quit();
app.on('second-instance',()=>{if(win&&!win.isDestroyed()){win.show();dialog.showMessageBox(win,{type:'info',title:'캐슬 펫',message:'이미 실행 중인 펫이 있습니다.',detail:'새 검수 버전은 기존 펫을 우클릭 → 펫 종료로 닫은 뒤 실행해 주세요.'});}});
app.whenReady().then(() => {
  if(!singleInstance)return;
  if(!validPortableLaunch){dialog.showErrorBox('캐슬 펫 실행 방법','ZIP 전체를 먼저 압축 풀기 한 뒤, 최상위 CastlePet.exe를 실행하세요.');app.quit();return;}

  const suspend=()=>{updateSpeech('');if(win&&!win.isDestroyed())win.webContents.send('pet:action','system:suspend');};
  const resume=()=>{if(win&&!win.isDestroyed())win.webContents.send('pet:action','system:resume');};
  powerMonitor.on('suspend',suspend);powerMonitor.on('resume',resume);
  app.once('will-quit',()=>{powerMonitor.off('suspend',suspend);powerMonitor.off('resume',resume);});
  win = new BrowserWindow({ ...restore(), show:false, transparent:true, frame:false, titleBarOverlay:false, autoHideMenuBar:true, thickFrame:false, backgroundColor:'#00000000', alwaysOnTop:true, resizable:false, hasShadow:false, webPreferences:{preload:join(__dirname,'preload.cjs'), contextIsolation:true, nodeIntegration:false, sandbox:true} });
  win.once('ready-to-show',async()=>{
   if(win.isDestroyed())return;
   const index=process.argv.indexOf('--qa-plain-report'),report=process.argv[index+1];
   if(index<0){win.show();return;}
   try{const before=await beforePlainShow(win);win.show();setTimeout(async()=>{try{const result=await finishPlainLaunch(win,before,[{role:'pet',window:win},...(speechWindow?[{role:'speech',window:speechWindow}]:[])],report);app.exit(result.passed?0:1);}catch(error){writeFileSync(report,JSON.stringify({passed:false,error:String(error)}));app.exit(1);}},1200);}catch(error){writeFileSync(report,JSON.stringify({passed:false,error:String(error)}));app.exit(1);}
  });
  win.setTitle('아킬라 펫 · B-13.3');win.on('page-title-updated',event=>event.preventDefault());
  win.setMenu(null);
  win.setMenuBarVisibility(false);
  // Suppress Windows' native titlebar/system menu on non-client right clicks.
  win.on('system-context-menu',event=>{event.preventDefault();log('Windows system context menu suppressed');});
  win.webContents.on('did-fail-load',(_event,code,message)=>log(`pet load ${code}: ${message}`));
  log('launch '+JSON.stringify({portable:hasPortableMarker,validated:validPortableLaunch,executable:process.execPath,entry:__filename,resources:process.resourcesPath}));
  readBehavior();
  win.loadFile(join(__dirname, '../dist/index.html'),{query:Object.fromEntries(Object.entries(behaviorSettings).map(([k,v])=>[k,String(v)]))});
  // Windows setPosition/custom drag emits move; moved is not guaranteed for
  // programmatic movement. Keep speech attached throughout the drag.
  win.on('move',()=>positionSpeech());
  win.on('moved',()=>{save();positionSpeech();}); win.on('resize',()=>{save();positionSpeech();}); win.on('close',save);
  win.on('hide',suspend);win.on('minimize',suspend);win.on('show',resume);win.on('restore',resume);
  win.on('closed',()=>{speechText='';clearTimeout(speechHide);if(speechWindow&&!speechWindow.isDestroyed())speechWindow.close();closePetMenu();});
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
  const isPet=(event:Electron.IpcMainEvent)=>!win.isDestroyed()&&event.sender===win.webContents;
  ipcMain.on('pet:action-result',(event,value)=>{
   if(!isPet(event)||!value||typeof value!=='object'||!['received','accepted','blocked','requested','rendered','reused','failed','superseded'].includes(value.phase)||!Number.isSafeInteger(value.commandId)||value.commandId<0||value.commandId>commandSequence)return;
   const {phase,pose,commandId,version,documentHidden,hidden,source}=value;
   if(!['idle','smoking','sitting','speaking','drawing','firing','dual_firing','firing_dynamic','working'].includes(pose)||source!==undefined&&!['manual','auto','base','event'].includes(source)||version!==undefined&&!Number.isSafeInteger(version))return;
   if(phase==='rendered'||phase==='reused'){currentPose=pose;positionSpeech();}
   commandTrace.push({phase,pose,commandId,version,documentHidden,hidden,source,at:Date.now()});if(commandTrace.length>256)commandTrace.shift();
  });
  ipcMain.on('pet:speech',(event,text)=>{if(isPet(event)&&typeof text==='string'&&text.length<=2000)updateSpeech(text);});
  ipcMain.on('speech:measure',(event,height,width)=>{
   if(!speechWindow||speechWindow.isDestroyed()||event.sender!==speechWindow.webContents||typeof height!=='number'||!Number.isFinite(height)||height<1||height>2000)return;
   if(typeof width!=='number'||!Number.isFinite(width)||width<1||width>2000)return;
   speechHeight=Math.ceil(height);speechWidth=Math.min(236,Math.max(64,Math.ceil(width)));positionSpeech();
  });
  ipcMain.on('show-menu',(event)=>{
    if(!isPet(event))return;
    menuRequests++;
    openPetMenu();
  });
  ipcMain.on('pet-menu:command',(event,command)=>{
    if(!menuWindow || menuWindow.isDestroyed() || event.sender!==menuWindow.webContents || typeof command!=='string')return;
    if(command.startsWith('pose:')&&command.length<40){commandTrace.push({phase:'menu-received',commandId:commandSequence+1,pose:command.slice(5),at:Date.now()});if(commandTrace.length>256)commandTrace.shift();}
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
  const refit = () => { if (!win.isDestroyed()) { win.setBounds(fit(win.getBounds())); save(); positionSpeech(); } };
  if (process.argv.includes('--qa-smoke')) {
    const reportIndex=process.argv.indexOf('--qa-report');const reportFile=reportIndex>=0 ? process.argv[reportIndex+1] : join(app.getPath('userData'),'qa-smoke.json');
    let qaStage='initializing';
    const startWidth=win.getBounds().width;
    resizePet(140); const smaller=win.getBounds();
    resizePet(180); const larger=win.getBounds();
    const resizeChecked=smaller.width===140&&smaller.height===175&&larger.width===180&&larger.height===225;
    const qa = openDiagnostics(false);
    qa.webContents.once('did-finish-load', async () => {
      try {
        qaStage='diagnostic images';
        const result = await qa.webContents.executeJavaScript(`new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{const a=document.querySelector('#pet .pet-stage img'),b=document.querySelector('#b-action-image');if(a?.complete&&a.naturalWidth&&b?.complete&&b.naturalWidth){clearInterval(timer);resolve({petLoaded:true,bReviewLoaded:true,bWidth:b.naturalWidth});}else if(++n>100){clearInterval(timer);reject(Error('image readiness timeout'));}},100);})`);
        const interactions = await qa.webContents.executeJavaScript(`(()=>{const select=document.querySelector('#b-action'),repeat=document.querySelector('#b-repeat');select.value='working';repeat.checked=true;document.querySelector('#b-start').click();document.querySelector('#b-cancel').click();return {repeatChecked:repeat.checked,cancelledToIdle:document.querySelector('#b-action-image').dataset.pose==='idle'};})()`);
        if(win.webContents.isLoading()) await new Promise<void>(resolve=>win.webContents.once('did-finish-load',()=>resolve()));
        await win.webContents.executeJavaScript("window.__lastPetState='';document.querySelector('#app').addEventListener('pet-state',e=>window.__lastPetState=e.detail);true;");
        win.webContents.send('pet:action','drawing');
        const manualPoseChecked=await win.webContents.executeJavaScript(`new Promise(resolve=>{let n=0;const timer=setInterval(()=>{const im=document.querySelector('#app .pet-stage:not([data-exiting]) img');if(window.__lastPetState==='drawing'&&im?.complete&&im.naturalWidth>0&&im.currentSrc.includes('drawing-')){clearInterval(timer);resolve(true);}else if(++n>40){clearInterval(timer);resolve(false);}},100);})`);
        qaStage='approved runtime poses';
        const approvedPoseChecked:Record<string,boolean>={};
        for(const [pose,width] of [['idle',956],['smoking',1003],['sitting',1003],['dual_firing',1024],['speaking',956],['firing_dynamic',1004]] as const){
          win.webContents.send('pet:action',pose);
          approvedPoseChecked[pose]=await win.webContents.executeJavaScript(`new Promise(resolve=>{let n=0;const timer=setInterval(()=>{const im=document.querySelector('#app .pet-stage:not([data-exiting]) img');if(window.__lastPetState===${JSON.stringify(pose)}&&im?.complete&&im.naturalWidth===${width}&&im.currentSrc.includes(${JSON.stringify(pose+'-')})){clearInterval(timer);resolve(true);}else if(++n>100){clearInterval(timer);resolve(false);}},100);})`);
        }
        if(Object.values(approvedPoseChecked).some(value=>!value))throw Error('Approved pose QA failed: '+JSON.stringify(approvedPoseChecked));
        qaStage='dynamic timing';
        // Actual packaged renderer timing (independent of deterministic unit clocks).
        await win.webContents.executeJavaScript(`window.__hotfixTimeline=[];document.querySelector('#app').addEventListener('pet-state',e=>window.__hotfixTimeline.push({pose:e.detail,at:performance.now()}));true;`);
        win.webContents.send('pet:action','settings:'+JSON.stringify({base:'smoking',autonomy:false,autoFire:false}));
        await new Promise(resolve=>setTimeout(resolve,180));
        if(!speechWindow||speechWindow.isDestroyed())throw Error('Speech renderer was not prewarmed at startup');
        if(speechWindow.webContents.isLoading())await new Promise<void>(resolve=>speechWindow!.webContents.once('did-finish-load',()=>resolve()));
        await speechWindow.webContents.executeJavaScript(`window.__lineShownAt=0;new MutationObserver(()=>{const e=document.querySelector('#speech');if(e.classList.contains('visible')&&e.textContent==='그런 건 중요한 게 아니다, 애송아.')window.__lineShownAt=Date.now();}).observe(document.querySelector('#speech'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});true;`);
        const dynamicStarted=await win.webContents.executeJavaScript(`({perf:performance.now(),wall:Date.now()})`);
        win.webContents.send('pet:action','firing_dynamic');
        await new Promise(resolve=>setTimeout(resolve,4300));
        const timeline=await win.webContents.executeJavaScript(`window.__hotfixTimeline`);
        const firingEntry=timeline.find((entry:{pose:string;at:number})=>entry.pose==='firing_dynamic');
        const baseEntry=timeline.find((entry:{pose:string;at:number})=>entry.pose==='smoking'&&entry.at>(firingEntry?.at||Infinity));
        const lineShownAt=await speechWindow.webContents.executeJavaScript(`window.__lineShownAt`);
        const dynamicTiming={startDelayMs:firingEntry?.at-dynamicStarted.perf,returnAfterShotMs:baseEntry?.at-firingEntry?.at-1500,speechLeadMs:dynamicStarted.wall+firingEntry?.at-dynamicStarted.perf-lineShownAt};
        if(!(dynamicTiming.startDelayMs>=800&&dynamicTiming.startDelayMs<=1200&&dynamicTiming.returnAfterShotMs>=700&&dynamicTiming.returnAfterShotMs<=1000&&lineShownAt>0&&dynamicTiming.speechLeadMs>=800&&dynamicTiming.speechLeadMs<=1200))throw Error('Dynamic native timing: '+JSON.stringify(dynamicTiming));
        qaStage='native composition setup';
        const evidence=join(dirname(reportFile),'windows-b13-1-captures');mkdirSync(evidence,{recursive:true});
        const area=screen.getDisplayMatching(win.getBounds()).workArea;
        const backdrop=new BrowserWindow({...area,frame:false,show:true,backgroundColor:'#f5f5f5',webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
        await backdrop.loadURL('data:text/html,<html><body style="margin:0"></body></html>');
        const clearRegions:Record<string,unknown>={};
        const compositing:Record<string,boolean>={},speechEdges:Record<string,boolean>={};
        for(const size of [120,180,240,360]){
          resizePet(size);win.setPosition(Math.round(area.x+area.width/2-size/2),Math.round(area.y+area.height-size*1.25-16));
          win.webContents.send('pet:action','smoking');
          await win.webContents.executeJavaScript(`window.pet.showSpeech('너까지 움직일 필요도 없다. 이 간격 안에선 하나님이 온다 한들 못 피하니까.');true;`);
          for(const [name,background] of [['light','#f5f5f5'],['dark','#151922'],['checker','repeating-conic-gradient(%23ddd 0% 25%,%23999 0% 50%) 0 0 / 24px 24px']]){
            await backdrop.webContents.executeJavaScript(`document.body.style.cssText=${JSON.stringify('margin:0;height:100vh;background:'+background.replaceAll('%23','#'))};true;`);
            await new Promise(resolve=>setTimeout(resolve,240));
            // capturePage verifies renderer alpha; desktopCapturer records the
            // actual Windows compositor against the separate backdrop window.
            const surface=await win.webContents.capturePage();const bitmap=surface.toBitmap();
            const dims=surface.getSize(),corners=[0,(dims.width-1)*4,(dims.height-1)*dims.width*4,(dims.width*dims.height-1)*4];
            const alphaClear=corners.every(offset=>bitmap[offset+3]===0);
            writeFileSync(join(evidence,`${size}-${name}-pet-alpha.png`),surface.toPNG());
            qaStage=`desktop capture ${size}-${name}`;
            const sources=await desktopCapturer.getSources({types:['screen'],thumbnailSize:{width:1920,height:1080}});
            const display=screen.getDisplayMatching(win.getBounds());const source=sources.find(item=>item.display_id===String(display.id))||sources[0];
            if(!source||source.thumbnail.isEmpty())throw Error('Windows desktop capture unavailable');
            writeFileSync(join(evidence,`${size}-${name}-desktop.png`),source.thumbnail.toPNG());
            const desktopSize=source.thumbnail.getSize(),desktopPixels=source.thumbnail.toBitmap(),petBounds=win.getBounds();
            const px=Math.round((petBounds.x+2-display.bounds.x)/display.bounds.width*desktopSize.width);
            const py=Math.round((petBounds.y+2-display.bounds.y)/display.bounds.height*desktopSize.height);
            const offset=(py*desktopSize.width+px)*4;
            const rgb=[desktopPixels[offset+2],desktopPixels[offset+1],desktopPixels[offset]];
            const expected=name==='light'?[245,245,245]:name==='dark'?[21,25,34]:null;
            const desktopClear=expected?rgb.every((value,index)=>Math.abs(value-expected[index])<=8):Math.max(...rgb)-Math.min(...rgb)<8&&rgb[0]>=145&&rgb[0]<=229;

            const {placement,tailX,...bubble}=speechBounds(win.getBounds(),area,speechHeight,currentPose,speechWidth);
            const actualSpeech=speechWindow?.getBounds();
            const beside=placement!=='unavailable'&&actualSpeech&&Math.abs(actualSpeech.x-bubble.x)<2&&Math.abs(actualSpeech.y-bubble.y)<2;
            const sample=(x:number,y:number)=>{const xx=Math.floor((x-display.bounds.x)/display.bounds.width*desktopSize.width),yy=Math.floor((y-display.bounds.y)/display.bounds.height*desktopSize.height),i=(yy*desktopSize.width+xx)*4;return[desktopPixels[i+2],desktopPixels[i+1],desktopPixels[i]];};
            const expectedBackground=(x:number,y:number)=>{if(name==='light')return[245,245,245];if(name==='dark')return[21,25,34];const mx=((x-area.x)%12+12)%12,my=((y-area.y)%12+12)%12;if(mx<1.5||mx>10.5||my<1.5||my>10.5)return null;const value=((Math.floor((x-area.x)/12)+Math.floor((y-area.y)/12))%2)?221:153;return[value,value,value];};
            const clear=compareClearRegions(bitmap,dims.width,dims.height,petBounds,sample,expectedBackground,actualSpeech?[actualSpeech]:[]);clearRegions[`${size}-${name}`]=clear;
            compositing[`${size}-${name}`]=alphaClear&&desktopClear&&clear.passed&&!!beside&&!!speechWindow?.isVisible();
          }
          for(const [edge,x] of [['left',area.x],['right',area.x+area.width-size]] as const){
            win.setPosition(x,win.getBounds().y);await new Promise(resolve=>setTimeout(resolve,100));
            const expected=speechBounds(win.getBounds(),area,speechHeight,currentPose,speechWidth),actual=speechWindow?.getBounds();
            speechEdges[`${size}-${edge}`]=!!actual&&expected.placement!=='unavailable'&&Math.abs(actual.x-expected.x)<2&&Math.abs(actual.y-expected.y)<2;
          }
        }
        backdrop.close();updateSpeech('');resizePet(180);
        if([...Object.values(compositing),...Object.values(speechEdges)].some(value=>!value))throw Error('Windows alpha/speech bounds: '+JSON.stringify({compositing,speechEdges,clearRegions}));
        win.webContents.send('pet:action','idle');
        // A synthetic client event proves the pixel-gated right click reaches
        // the preload IPC bridge without creating a native popup in headless QA.
        qaStage='alpha input';
        const mouseQa=await win.webContents.executeJavaScript(`new Promise(resolve=>{
          let ticks=0;const timer=setInterval(()=>{
            const image=document.querySelector('#app .pet-stage:not([data-exiting]) img');
            if(!image?.currentSrc.includes('idle-')||!image?.complete||!image.naturalWidth){if(++ticks>60){clearInterval(timer);resolve({success:false,reason:'no idle image'});}return;}
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
        qaStage='custom menu';
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
        await popup.webContents.executeJavaScript(`(()=>{const size=document.querySelector('#pet-size');size.value='160';size.dispatchEvent(new Event('change',{bubbles:true}));})()`);
        await new Promise(resolve=>setTimeout(resolve,100));
        const resizedFromMenu=win.getBounds().width===160;
        resizePet(180);
        if(!resizedFromMenu)throw Error('Custom menu size command did not reach main window');
        qaStage='B13.2 manual menu and smoke';
        const savedBehavior={...behaviorSettings};
        let behavior132;
        try{behavior132=await behaviorQa(win,()=>openPetMenu(true),commandTrace,resizePet,join(dirname(reportFile),'windows-b13-2-captures'));}
        finally{behaviorSettings=savedBehavior;saveSettings(join(app.getPath('userData'),'behavior.json'),behaviorSettings);win.webContents.send('pet:action','settings:'+JSON.stringify(behaviorSettings));}
        const windowAudit=nativeWindowAudit([{role:'pet',window:win},...(diagnostics?[{role:'diagnostics',window:diagnostics}]:[]),...(speechWindow?[{role:'speech',window:speechWindow}]:[])]);
        writeFileSync(reportFile,JSON.stringify({passed:true,windowAudit,startWidth,resizeChecked,manualPoseChecked,approvedPoseChecked,
          menuRequests,hitChanges,mouseQa,menuChrome,menuQA,resizedFromMenu,behavior132,dynamicTiming,compositing,speechEdges,clearRegions,
          nativeFrameless:chrome,...result,...interactions}));app.quit();
      } catch(error) { writeFileSync(reportFile,JSON.stringify({passed:false,resizeChecked,nativeFrameless:chrome,qaStage,commandSequence,recentCommandTrace:commandTrace.slice(-16),error:String(error)}));app.exit(1); }
    });
    setTimeout(()=>{writeFileSync(reportFile,JSON.stringify({passed:false,qaStage,error:'Windows QA stage timed out'}));app.exit(2);},150000).unref();
  }
  screen.on('display-removed', refit); screen.on('display-metrics-changed', refit);
});
app.on('window-all-closed', () => app.quit());
