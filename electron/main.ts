import { app, BrowserWindow, Menu, screen, ipcMain } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { constrain } from './geometry.mjs';

let win: BrowserWindow;
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
  Menu.buildFromTemplate([{ label: '크기 설정', submenu: [180, 240, 360].map(width => ({label: `${width}px`, click: () => { const b = win.getBounds(); win.setBounds(fit({...b, width, height: Math.round(width * 1.25)})); save(); }})) }, {type:'separator'}, {label:'종료', click: () => app.quit()}]).popup({window: win});
}
app.whenReady().then(() => {
  win = new BrowserWindow({ ...restore(), transparent:true, frame:false, alwaysOnTop:true, resizable:false, hasShadow:false, webPreferences:{preload:join(__dirname,'preload.cjs'), contextIsolation:true, nodeIntegration:false, sandbox:true} });
  win.loadFile(join(__dirname, '../dist/index.html'));
  win.on('moved', save); win.on('close', save);
  win.webContents.on('context-menu', showMenu);
  ipcMain.on('show-menu', showMenu);
  const refit = () => { if (!win.isDestroyed()) { win.setBounds(fit(win.getBounds())); save(); } };
  screen.on('display-removed', refit); screen.on('display-metrics-changed', refit);
});
app.on('window-all-closed', () => app.quit());
