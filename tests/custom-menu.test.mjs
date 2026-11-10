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

test('B-14 menu preserves four top-level tabs and nests safe dialogue/status/help views',async()=>{
 const menu=await readFile(new URL('../electron/pet-menu.html',import.meta.url),'utf8');
 const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
 const preload=await readFile(new URL('../electron/menu-preload.ts',import.meta.url),'utf8');
 for(const tab of ['basic','frequency','poses','more'])assert(menu.includes('id="tab-'+tab+'"'));
 for(const view of ['home','archive','status','help','diagnostics'])assert(menu.includes('data-more-view="'+view+'"'));
 for(const control of ['dialogue-search','dialogue-origin','dialogue-pose','archive-results','status-list'])assert(menu.includes('id="'+control+'"'));
 assert(menu.includes('textContent=line.text'));assert(!menu.includes('innerHTML=line.text'));
 assert(main.includes("event.sender!==menuWindow.webContents"));assert(main.includes("ipcMain.handle('pet-menu:get-info'"));
 assert(preload.includes("ipcRenderer.invoke('pet-menu:get-info')"));
 assert(!menu.includes('Codex'));assert(menu.includes('현재 상태'));

});

test('Sitting base choice exists beside Smoking and Idle',async()=>{
 const h=await readFile(new URL('../electron/pet-menu.html',import.meta.url),'utf8');
 for(const v of ['smoking','idle','sitting'])assert(h.includes('data-action="setting:base:'+v+'"'));
});

test('standalone app never installs Codex or browser bridges; uses native Windows power events',async()=>{
 const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
 const menu=await readFile(new URL('../electron/pet-menu.html',import.meta.url),'utf8');
 const preload=await readFile(new URL('../electron/menu-preload.ts',import.meta.url),'utf8');
 assert(!main.includes('watchCodexEvents'));assert(!main.includes("pet-menu:test-event"));
 assert(!preload.includes("pet-menu:test-event"));assert(!menu.includes('data-codex-test'));
 assert(!main.includes('brave-download-server'));
 for(const event of ['on-ac','on-battery','lock-screen','unlock-screen'])
  assert(main.includes("powerMonitor.on('"+event+"'"));
});
test('Dark rectangular menu uses one honest outer shape, four corner handles and no native Acrylic',async()=>{
 const menu=await readFile(new URL('../electron/pet-menu.html',import.meta.url),'utf8');
 const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
 const preload=await readFile(new URL('../electron/menu-preload.ts',import.meta.url),'utf8');
 assert(menu.includes('background:rgba(32,39,50,.97)'));
 assert(menu.includes('border-radius:0'));
 assert(menu.includes('backdrop-filter:none'));
 assert(!menu.includes('background:rgba(255,255,255,.085)'));
 assert(!menu.includes('border-radius:22px'));
 assert(!main.includes("setBackgroundMaterial('acrylic')"));
 assert(main.includes('placeMenu(win.getBounds()'));
 assert(main.includes('resizeMenuFromCorner('));
 assert(main.includes("pet-menu:window-control"));
 assert(preload.includes("ipcRenderer.send('pet-menu:window-control'"));
 for(const corner of ['nw','ne','sw','se']){
  assert(menu.includes('data-resize-corner="'+corner+'"'));
  assert(menu.includes('resize:'+ "'+handle.dataset.resizeCorner"));
 }
});
test('B16 action weights use explicit whitelisted numeric menu commands and a nested panel',async()=>{
 const h=await readFile(new URL('../electron/pet-menu.html',import.meta.url),'utf8');
 const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
 const control=await readFile(new URL('../src/behavior/controller.mjs',import.meta.url),'utf8');
 const cadence=await readFile(new URL('../src/behavior/cadence.mjs',import.meta.url),'utf8');
 for(const item of ['data-frequency-view="weights"','id="action-weights-list"','data-frequency-open="weights"','id="weights-reset"'])
  assert(h.includes(item));
 assert(h.includes("slider.addEventListener('change'"));
 assert(main.includes("command.startsWith('setting:weight:')"));
 assert(main.includes('ACTION_WEIGHT_LIMIT')&&main.includes('Object.hasOwn(DEFAULT_ACTION_WEIGHTS,pose)'));
 assert(main.includes("command==='setting:weights:reset'"));
 assert(cadence.includes('DEFAULT_ACTION_WEIGHTS'));
 assert(control.includes('if(!available.length){armMovement();return;}'));
 assert(control.includes('later(start,1000)'));
 assert(!control.includes("if(value==='firing_dynamic'){show(settings.base)"));
});
test('B16 central popup is large by default, movable and resizable with legacy 316px upgrade',async()=>{
 const menu=await readFile(new URL('../electron/pet-menu.html',import.meta.url),'utf8');
 const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
 const geometry=await readFile(new URL('../electron/menu-layout.mjs',import.meta.url),'utf8');
 assert(geometry.includes('DEFAULT_MENU={width:560,height:610}'));
 assert(geometry.includes('work.x+(work.width-size.width)/2'));
 assert(main.includes('legacyCompact'));
 assert(menu.includes('data-frequency-view="weights"'));
 assert.equal((menu.match(/<div class="menu-resize-corner" data-resize-corner="(?:nw|ne|sw|se)"/g)||[]).length,4);
});

test('standalone UI uses fixed minute sliders and keeps approved rectangular menu',async()=>{
 const menu=await readFile(new URL('../electron/pet-menu.html',import.meta.url),'utf8');
 const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
 for(const key of ['movementIntervalMin','dialogueIntervalMin','shotCooldownMin']){
  assert(menu.includes('data-minute-key="'+key+'"'));
  assert(main.includes(key));
 }
 assert(menu.includes("setting:interval:'+key+':'+slider.value"));
 assert(main.includes("command.startsWith('setting:interval:')"));
 assert(!menu.includes('setting:movementFrequency:quiet'));
 assert(menu.includes('row.dataset.weightRow=name'));
 assert(main.includes('validInterval(value)'));
});
