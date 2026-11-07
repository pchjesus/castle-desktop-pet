import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
test('local B poses are exposed in live Electron menu with explicit IPC bridge',async()=>{
 const main=await readFile(new URL('../electron/main.ts',import.meta.url),'utf8');
 const preload=await readFile(new URL('../electron/preload.ts',import.meta.url),'utf8');
 const renderer=await readFile(new URL('../src/main.ts',import.meta.url),'utf8');
 for(const id of ['idle','smoking','working','drawing','firing','sitting']){
  assert(main.includes("'pet:action','"+'"+id+"'"),'missing live pose '+id);
  assert(renderer.includes("'"+id+"'"),'renderer must allow '+id);
 }
 assert(!main.includes("'pet:action','dual_firing'"));
 assert(!main.includes("'pet:action','speaking'"));
 assert(preload.includes("ipcRenderer.on('pet:action'"));
 assert(renderer.includes('livePet.set('));
 assert(main.includes('manualPoseChecked'));
});
