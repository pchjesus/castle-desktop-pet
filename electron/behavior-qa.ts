import {BrowserWindow,screen} from 'electron';
import {writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {constrain} from './geometry.mjs';

// Only invoked by --qa-smoke. Uses the packaged menu, secure IPC and renderer.
export async function behaviorQa(win:BrowserWindow,openMenu:()=>BrowserWindow|undefined,trace:Record<string,any>[],resize:(width:number)=>void,evidence:string){
 mkdirSync(evidence,{recursive:true});
 const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
 const wait=async(predicate:()=>boolean,label:string)=>{for(let i=0;i<120;i++){if(predicate())return;await pause(20);}throw Error('B13.2 timeout: '+label+' '+JSON.stringify(trace.slice(-18)));};
 const menuClick=async(command:string)=>{
  const popup=openMenu();if(!popup)throw Error('QA menu unavailable');
  if(popup.webContents.isLoading())await new Promise<void>(resolve=>popup.webContents.once('did-finish-load',()=>resolve()));
  const pet=win.getBounds(),area=screen.getDisplayMatching(pet).workArea;
  popup.setBounds(constrain({...popup.getBounds(),x:pet.x-20,y:pet.y+pet.height-popup.getBounds().height},[area]));
  popup.show();popup.focus();await pause(70);
  const hidden=await win.webContents.executeJavaScript('document.hidden');
  const point=await popup.webContents.executeJavaScript(`(()=>{const b=Array.from(document.querySelectorAll('[data-action]')).find(b=>b.dataset.action===${JSON.stringify(command)});if(!b)return {missing:true};const panel=b.closest('[data-panel]');if(panel)document.querySelector('[data-tab="'+panel.dataset.panel+'"]').click();b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);
  if(point.missing)throw Error('B13.2 QA menu button unavailable: '+command);
  const before=trace.filter(row=>row.phase==='sent').at(-1)?.commandId||0;
  popup.webContents.sendInputEvent({type:'mouseDown',...point,button:'left',clickCount:1});
  popup.webContents.sendInputEvent({type:'mouseUp',...point,button:'left',clickCount:1});
  if(command.startsWith('pose:')){
   const pose=command.slice(5);await wait(()=>trace.some(row=>row.phase==='sent'&&row.pose===pose&&row.commandId>before),'menu IPC '+command);
   const id=trace.find(row=>row.phase==='sent'&&row.pose===pose&&row.commandId>before)!.commandId;
   // Replay the duplicate native show/resume ordering that used to reset actions.
   win.webContents.send('pet:action','system:resume');
   await wait(()=>trace.some(row=>row.commandId===id&&row.phase==='accepted'),'controller accepted '+command);
   await wait(()=>trace.some(row=>row.commandId===id&&row.pose===pose&&['rendered','reused'].includes(row.phase)),'actual pose '+command);
   const entries=trace.filter(row=>row.commandId===id);
   const visible=await win.webContents.executeJavaScript(`(()=>{const s=document.querySelector('.pet-stage:not([data-exiting])'),i=s?.querySelector('img');return s?.dataset.pose===${JSON.stringify(pose)}&&i?.complete&&i.naturalWidth>0})()`);
   if(!visible||entries.some(row=>row.phase==='blocked'))throw Error('Manual command did not render '+command);
   return {commandId:id,pose,documentHiddenWhileMenu:hidden,entries};
  }
  await pause(70);return {command};
 };
 const commands=[];
 for(const pose of ['idle','smoking','sitting','working','drawing','speaking','firing','dual_firing','firing_dynamic'])for(let repeat=0;repeat<2;repeat++)commands.push({...await menuClick('pose:'+pose),repeat});
 for(const pose of ['drawing','speaking','firing','dual_firing','firing_dynamic']){
  const rows=commands.filter(row=>'pose' in row&&row.pose===pose);
  if(rows.some(row=>!('entries' in row)||!row.entries!.some((entry:any)=>entry.phase==='rendered'&&entry.pose===pose)))throw Error('Repeat did not create a fresh action '+pose);
 }
 for(const command of ['setting:movementFrequency:quiet','setting:dialogueFrequency:active','setting:autonomy:false','setting:dialogueEnabled:false','setting:dialogueEnabled:true','setting:autoFire:false'])await menuClick(command);
 const menu=openMenu()!;if(menu.webContents.isLoading())await new Promise<void>(resolve=>menu.webContents.once('did-finish-load',()=>resolve()));
 const settings=await menu.webContents.executeJavaScript(`({movement:document.querySelector('[data-action="setting:movementFrequency:quiet"]').getAttribute('aria-pressed'),dialogue:document.querySelector('[data-action="setting:dialogueFrequency:active"]').getAttribute('aria-pressed'),movementOff:document.querySelector('#autonomy-setting').textContent,dialogueOn:document.querySelector('#dialogue-setting').textContent})`);
 if(settings.movement!=='true'||settings.dialogue!=='true'||!settings.movementOff.endsWith('꺼짐')||!settings.dialogueOn.endsWith('켜짐'))throw Error('Independent native menu settings not restored '+JSON.stringify(settings));
 menu.show();writeFileSync(join(evidence,'menu.png'),(await menu.webContents.capturePage()).toPNG());menu.close();
 await menuClick('pose:smoking');await pause(180);
 const smoke=[];
 const originalReducedMotion=await win.webContents.executeJavaScript(`matchMedia('(prefers-reduced-motion: reduce)').matches`);
 win.webContents.debugger.attach('1.3');
 try{
 await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await pause(100);
 for(const width of [120,180,240,360]){
  resize(width);await pause(70);
  const metrics=await win.webContents.executeJavaScript(`(()=>{const s=document.querySelector('.pet-stage:not([data-exiting])'),i=s.querySelector('img'),p=s.querySelector('.b-smoking-anchor');if(!p)return {missing:true,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,documentHidden:document.hidden,pose:s.dataset.pose,paused:document.querySelector('#app').classList.contains('presentation-paused')};const a=i.getBoundingClientRect(),b=p.getBoundingClientRect(),scale=Math.min(a.width/i.naturalWidth,a.height/i.naturalHeight);return {error:Math.hypot(b.x-a.left-(a.width-i.naturalWidth*scale)/2-597*scale,b.y-a.top-(a.height-i.naturalHeight*scale)/2-282*scale),strands:p.children.length,duration:getComputedStyle(p.firstElementChild).animationDuration}})()`);
  if(metrics.missing||metrics.error>=1.2||metrics.strands!==2||metrics.duration!=='2s')throw Error('Native smoke alignment '+JSON.stringify(metrics));
  smoke.push({width,...metrics});writeFileSync(join(evidence,`${width}-smoking.png`),(await win.webContents.capturePage()).toPNG());
 }
  await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(70);
  if(!await win.webContents.executeJavaScript(`(()=>{const e=document.querySelector('.b-smoke-strand');return !!e&&getComputedStyle(e).transform==='none'&&getComputedStyle(e).animationName==='b-smoke-quiet'})()`))throw Error('Reduced Motion smoke must be stationary and visible');
  await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await pause(70);
  if(!await win.webContents.executeJavaScript(`!!document.querySelector('.b-smoking-layer')`))throw Error('Smoke did not resume');
 }finally{await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[]});win.webContents.debugger.detach();}
 return {passed:true,commands,settings,smoke,reducedMotion:true,originalReducedMotion};
}
