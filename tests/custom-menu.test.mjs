import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
test('never call Windows native Menu.popup for pet context actions',async()=>{
 const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
 assert(!main.includes('Menu.buildFromTemplate('));
 assert(!main.includes('.popup({window:win})'));
 assert(main.includes("win.on('system-context-menu',event=>{event.preventDefault()"));
 assert(main.includes('openPetMenu()'));
 assert(main.includes('menuChrome'));
 assert(main.includes('resizedFromMenu'));
});
test('custom frameless menu buttons cover all nine sizes and six live poses, diagnostics and quit',async()=>{
 const h=await readFile(new URL('../electron/pet-menu.html',import.meta.url),'utf8');
 for(const size of [120,140,160,180,200,240,280,320,360])
  assert(h.includes('data-action="size:'+size+'"'),'missing size '+size);
 for(const pose of ['idle','smoking','working','drawing','firing','sitting','dual_firing','speaking','firing_dynamic'])
  assert(h.includes('data-action="pose:'+pose+'"'),'missing pose '+pose);
 for(const pose of ['dual_firing','firing_dynamic','speaking_reference'])
  assert(h.includes('data-action="diagnostics:'+pose+'"'),'missing diagnostic '+pose);
 assert(!h.includes('src="http'));
 assert(h.includes('data-action="quit"'));
});
test('secure dedicated IPC and menu packaged within portable Electron app',async()=>{
 const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
 const bridge=await readFile(new URL('../electron/menu-preload.ts',import.meta.url),'utf8');
 const packageJson=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 const pack=await readFile(new URL('../scripts/package-windows-qa.mjs',import.meta.url),'utf8');
 assert(main.includes("event.sender!==menuWindow.webContents"));
 assert(main.includes("nodeIntegration:false,sandbox:true"));
 assert(bridge.includes("ipcRenderer.send('pet-menu:command'"));
 assert(packageJson.scripts.build.includes('copy-pet-menu.mjs'));
 assert(pack.includes("dist-electron/pet-menu.html"));
});
