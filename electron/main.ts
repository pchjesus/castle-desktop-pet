import { app, BrowserWindow, Menu, screen, ipcMain } from 'electron';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { constrain } from './geometry.mjs';

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
const defaults = { x: 100, y: 100, width: 240, height: 300 };
const path = () => join(app.getPath('userData'), 'window.json');
function fit(bounds: Electron.Rectangle) { return constrain(bounds, screen.getAllDisplays().map(d => d.workArea)); }
function restore() {
  try {
    const saved = JSON.parse(readFileSync(path(), 'utf8'));
    if (['x','y','width','height'].every(k => Number.isFinite(saved[k])) && saved.width >= 120 && saved.height >= 150 && saved.width <= 800 && saved.height <= 1000) return fit(saved);
  } catch { /* use defaults */ }
  const a = screen.getPrimaryDisplay().workArea;
  return fit({ ...defaults, x: a.x + a.width - defaults.width, y: a.y + a.height - defaults.height });
}
function save() { try { writeFileSync(path(), JSON.stringify(win.getBounds())); } catch (error) { console.error('Unable to save window position:', error); } }
function showMenu() {
  Menu.buildFromTemplate([{label:'B형 진단 검수 · 미승인',click:()=>openDiagnostics()}, {label:'진단 개발자 도구',click:()=>openDiagnostics().webContents.openDevTools()}, { label: '크기 설정', submenu: [180, 240, 360].map(width => ({label: `${width}px`, click: () => { const b = win.getBounds(); win.setBounds(fit({...b, width, height: Math.round(width * 1.25)})); save(); }})) }, {type:'separator'}, {label:'종료', click: () => app.quit()}]).popup({window: win});
}
app.whenReady().then(() => {
  win = new BrowserWindow({ ...restore(), transparent:true, frame:false, alwaysOnTop:true, resizable:false, hasShadow:false, webPreferences:{preload:join(__dirname,'preload.cjs'), contextIsolation:true, nodeIntegration:false, sandbox:true} });
  win.webContents.on('did-fail-load',(_event,code,message)=>log(`pet load ${code}: ${message}`));
  win.loadFile(join(__dirname, '../dist/index.html'));
  win.on('moved', save); win.on('close', save);
  win.webContents.on('context-menu', showMenu);
  ipcMain.on('show-menu', showMenu);
  const refit = () => { if (!win.isDestroyed()) { win.setBounds(fit(win.getBounds())); save(); } };
  if (process.argv.includes('--qa-smoke')) {
    const reportIndex=process.argv.indexOf('--qa-report');const reportFile=reportIndex>=0 ? process.argv[reportIndex+1] : join(app.getPath('userData'),'qa-smoke.json');
    const qa = openDiagnostics(false);
    qa.webContents.once('did-finish-load', async () => {
      try {
        const result = await qa.webContents.executeJavaScript(`new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{const a=document.querySelector('#pet .pet-stage img'),b=document.querySelector('#b-action-image');if(a?.complete&&a.naturalWidth&&b?.complete&&b.naturalWidth){clearInterval(timer);resolve({aLoaded:true,bReviewLoaded:true,bWidth:b.naturalWidth});}else if(++n>100){clearInterval(timer);reject(Error('image readiness timeout'));}},100);})`);
        const interactions = await qa.webContents.executeJavaScript(`(()=>{const select=document.querySelector('#b-action'),repeat=document.querySelector('#b-repeat');select.value='working';repeat.checked=true;document.querySelector('#b-start').click();document.querySelector('#b-cancel').click();return {repeatChecked:repeat.checked,cancelledToIdle:document.querySelector('#b-action-image').dataset.pose==='idle'};})()`);
        if (!interactions.repeatChecked || !interactions.cancelledToIdle) throw Error('B review interaction failed');
        writeFileSync(reportFile,JSON.stringify({passed:true,...result,...interactions}));app.quit();
      } catch(error) { writeFileSync(reportFile,JSON.stringify({passed:false,error:String(error)}));app.exit(1); }
    });
    setTimeout(()=>app.exit(2),20000).unref();
  }
  screen.on('display-removed', refit); screen.on('display-metrics-changed', refit);
});
app.on('window-all-closed', () => app.quit());
