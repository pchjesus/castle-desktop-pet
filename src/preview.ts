import {akila,states,type PetState} from './characters/akila';
import {mountPet} from './renderer/pet';
import './style.css';
import './preview.css';
import './b-proportions-v07';
const pet=document.querySelector<HTMLElement>('#pet')!;
const desktop=document.querySelector<HTMLElement>('#desktop')!;
const dialogue=document.querySelector<HTMLElement>('#dialogue')!;
const speed=document.querySelector<HTMLSelectElement>('#speed')!;
const controller=mountPet(pet,akila,()=>Number(speed.value),{initialState:'smoking'});
const select=document.querySelector<HTMLSelectElement>('#state')!;
for(const state of states){const option=document.createElement('option');option.value=state;option.textContent=state;select.append(option);}
pet.addEventListener('pet-state',ev=>{select.value=(ev as CustomEvent<PetState>).detail;});
select.addEventListener('change',()=>controller.set(select.value as PetState));
function clamp(){pet.style.left=Math.max(0,Math.min(pet.offsetLeft,desktop.clientWidth-pet.offsetWidth))+'px';pet.style.top=Math.max(0,Math.min(pet.offsetTop,desktop.clientHeight-pet.offsetHeight))+'px';}
function reset(){pet.style.left=Math.max(0,desktop.clientWidth-pet.offsetWidth-30)+'px';pet.style.top=Math.max(0,desktop.clientHeight-pet.offsetHeight-30)+'px';dialogue.textContent='';}
document.querySelector<HTMLSelectElement>('#size')!.addEventListener('change',e=>{const width=Number((e.target as HTMLSelectElement).value);pet.style.width=width+'px';pet.style.height=Math.round(width*1.25)+'px';clamp();});
document.querySelector('#reset')!.addEventListener('click',reset);
document.querySelectorAll<HTMLButtonElement>('[data-dialogue]').forEach(button=>button.addEventListener('click',()=>{dialogue.textContent=akila.dialogues[button.dataset.dialogue!][0];}));
pet.addEventListener('pointerdown',event=>{event.preventDefault();pet.setPointerCapture(event.pointerId);const sx=event.clientX,sy=event.clientY,l=pet.offsetLeft,t=pet.offsetTop;const move=(e:PointerEvent)=>{pet.style.left=l+e.clientX-sx+'px';pet.style.top=t+e.clientY-sy+'px';clamp();};const end=()=>{pet.removeEventListener('pointermove',move);pet.removeEventListener('pointerup',end);pet.removeEventListener('pointercancel',end);};pet.addEventListener('pointermove',move);pet.addEventListener('pointerup',end);pet.addEventListener('pointercancel',end);});
window.addEventListener('resize',clamp);reset();
document.querySelector('#replay')!.addEventListener('click',()=>{const chosen=select.value as PetState;controller.set('idle');controller.set(chosen);});
speed.addEventListener('change',()=>{const chosen=select.value as PetState;controller.set('idle');controller.set(chosen);});

// Canonical source and technical candidates are review-only; they never enter the pet renderer.
import canonicalReport from './characters/candidates/b-mustang-20261107/manifest.json';
import alignedReport from './characters/candidates/b-mustang-20261107/action-pack/manifest.json';
import revisedReport from './characters/candidates/b-mustang-20261107/action-pack-v04/manifest.json';
const revisedImages=import.meta.glob('./characters/candidates/b-mustang-20261107/action-pack-v04/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const alignedImages=import.meta.glob('./characters/candidates/b-mustang-20261107/action-pack/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const canonicalSources = import.meta.glob('../design/canonical/b-mustang-20261107/approved_visual_sources/*.{png,jpg}', { eager:true, query:'?url', import:'default' }) as Record<string,string>;
const canonicalCandidates = import.meta.glob('./characters/candidates/b-mustang-20261107/*.png', { eager:true, query:'?url', import:'default' }) as Record<string,string>;
type CandidateEntry = {source_sha256:string; candidate?:string; sha256?:string; status:string; warning?:string; frames?:{candidate:string;sha256:string}[]};
const entries = canonicalReport.assets as Record<string,CandidateEntry>;
const canonicalAction = document.querySelector<HTMLSelectElement>('#canonical-action')!;
const canonicalSpeaking = document.querySelector<HTMLSelectElement>('#canonical-speaking')!;
for (const name of Object.keys(entries)) { const o=document.createElement('option'); o.value=name; o.textContent=name; canonicalAction.append(o); }
for (let i=0;i<7;i++) { const o=document.createElement('option'); o.value=String(i); o.textContent=String(i+1); canonicalSpeaking.append(o); }
const sourceImage = document.querySelector<HTMLImageElement>('#canonical-original')!;
const candidateImage = document.querySelector<HTMLImageElement>('#canonical-candidate')!;
function renderCanonical() { const name=canonicalAction.value; const item=entries[name]; const source=Object.keys(canonicalSources).find(p=>p.endsWith('/'+name+(name==='firing_dynamic'||name==='dual_firing'||name==='speaking_reference'?'.jpg':'.png'))); const frame=item.frames?.[Number(canonicalSpeaking.value)||0]; const version = document.querySelector<HTMLSelectElement>('#canonical-version')!.value; const file=version === 'mask' ? name+'-mask.png' : frame?.candidate || item.candidate; const aligned = version !== 'clean'; const report = version === 'revised' || version === 'mask' ? revisedReport : alignedReport; const imageMap = version === 'revised' || version === 'mask' ? revisedImages : aligned ? alignedImages : canonicalCandidates; const path=Object.keys(imageMap).find(p=>p.endsWith('/'+file)); sourceImage.hidden=!source;candidateImage.hidden=!path; if(source)sourceImage.src=canonicalSources[source]; if(path)candidateImage.src=imageMap[path]; canonicalSpeaking.disabled=!item.frames; document.querySelector('#canonical-original-info')!.textContent='원본 SHA-256: '+item.source_sha256; document.querySelector('#canonical-candidate-info')!.textContent='후보 SHA-256: '+(version === 'mask' ? '마스크 해시 미기록' : aligned ? (report.assets as Record<string,{sha256:string}>)[name==='speaking_reference' ? 'speaking-'+String(Number(canonicalSpeaking.value)+1).padStart(2,'0') : name]?.sha256 : (frame?.sha256 || item.sha256 || '없음')); const selectedStatus=aligned ? (report.assets as Record<string,{status:string;warning:string}>)[name==='speaking_reference' ? 'speaking-'+String(Number(canonicalSpeaking.value)+1).padStart(2,'0') : name] : item; document.querySelector('#canonical-status')!.textContent=selectedStatus.status+' · '+(selectedStatus.warning || '시각 검수 필요'); }
sourceImage.addEventListener('load',()=>{document.querySelector('#canonical-original-info')!.append(` · ${sourceImage.naturalWidth}×${sourceImage.naturalHeight}`)});
candidateImage.addEventListener('load',()=>{document.querySelector('#canonical-candidate-info')!.append(` · ${candidateImage.naturalWidth}×${candidateImage.naturalHeight}`)});
function renderSideBySide(){ const name=canonicalAction.value; const entry=entries[name]; const file=entry.frames?.[Number(canonicalSpeaking.value)||0]?.candidate || entry.candidate; for(const [id,map] of [['canonical-side-03',alignedImages],['canonical-side-04',revisedImages]] as const){const im=document.querySelector<HTMLImageElement>('#'+id)!;const key=Object.keys(map).find(p=>p.endsWith('/'+file));im.hidden=!key;if(key && im.src!==map[key])im.src=map[key];} }
canonicalAction.addEventListener('change',renderSideBySide);canonicalSpeaking.addEventListener('change',renderSideBySide);renderSideBySide();
canonicalAction.addEventListener('change',renderCanonical);canonicalSpeaking.addEventListener('change',renderCanonical);renderCanonical();
const canonicalPanels=document.querySelector<HTMLElement>('.canonical-panels')!;
function canonicalWidth() { const size=Number(document.querySelector<HTMLSelectElement>('#canonical-size')!.value); const zoom=Number(document.querySelector<HTMLSelectElement>('#canonical-zoom')!.value); canonicalPanels.style.setProperty('--canonical-width',size*zoom+'px'); }
document.querySelector('#canonical-size')!.addEventListener('change',canonicalWidth);document.querySelector('#canonical-zoom')!.addEventListener('change',canonicalWidth);
document.querySelector<HTMLSelectElement>('#canonical-bg')!.addEventListener('change',e=>{canonicalPanels.dataset.background=(e.target as HTMLSelectElement).value});
document.querySelector<HTMLInputElement>('#canonical-guides')!.addEventListener('change',e=>{canonicalPanels.classList.toggle('hide-guides',!(e.target as HTMLInputElement).checked)});

import './b-action-review';

document.querySelector('#canonical-version')!.addEventListener('change',renderCanonical);

// Explicitly user-entered review notes remain local; exported values are never inferred from tests.
const reviewNotes=document.createElement('section');reviewNotes.className='user-review';
reviewNotes.innerHTML='<h2>사용자 시각 검수 기록</h2><p>판단과 의견은 이 기기에만 저장되며, JSON 내보내기는 사용자가 직접 시작합니다.</p><label>항목 <select id="user-review-action"></select></label><label>판단 <select id="user-review-decision"><option value="">선택 안 함</option><option value="needs_revision">수정 필요</option><option value="acceptable">사용자 확인 완료</option></select></label><label>의견 <textarea id="user-review-note" rows="3"></textarea></label><button id="user-review-export">JSON 내보내기</button><p id="user-review-message" aria-live="polite"></p>';
document.querySelector('main')!.append(reviewNotes);
const noteAction=reviewNotes.querySelector<HTMLSelectElement>('#user-review-action')!,noteDecision=reviewNotes.querySelector<HTMLSelectElement>('#user-review-decision')!,noteText=reviewNotes.querySelector<HTMLTextAreaElement>('#user-review-note')!;
for(const name of [...Object.keys(entries),'b07/idle','b07/smoking','b07/sitting']){const option=document.createElement('option');option.value=name;option.textContent=name.startsWith('b07/')?'07 후보 '+name.slice(4):name;noteAction.append(option);}
type ReviewNote={decision:string;note:string};let notes:Record<string,ReviewNote>={};
try{const stored=localStorage.getItem('castle-b-canonical-review-v1');if(stored)notes=JSON.parse(stored);}catch{reviewNotes.querySelector('#user-review-message')!.textContent='이 환경에서 로컬 저장을 사용할 수 없습니다. 내보내기로 기록을 보관하세요.';}
function loadNote(){noteDecision.value=notes[noteAction.value]?.decision||'';noteText.value=notes[noteAction.value]?.note||'';}
function saveNote(){notes[noteAction.value]={decision:noteDecision.value,note:noteText.value};try{localStorage.setItem('castle-b-canonical-review-v1',JSON.stringify(notes));}catch{reviewNotes.querySelector('#user-review-message')!.textContent='로컬 저장을 사용할 수 없습니다. JSON을 내보내세요.';}}
noteAction.addEventListener('change',loadNote);noteDecision.addEventListener('change',saveNote);noteText.addEventListener('input',saveNote);loadNote();
reviewNotes.querySelector('#user-review-export')!.addEventListener('click',()=>{const blob=new Blob([JSON.stringify({schemaVersion:1,source:'user-entered',items:notes},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='castle-b-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});

const proportion=document.createElement('section');proportion.className='b-proportion';proportion.innerHTML='<h2>Idle / Sitting 비율 비교</h2><p>동일 캔버스 기준이며 얼굴 크기·발 위치는 시각 검수가 필요합니다.</p><div class="b-proportion-panels"><figure><img id="proportion-idle" alt="Idle"><figcaption>Idle</figcaption></figure><figure><img id="proportion-sitting" alt="Sitting"><figcaption>Sitting</figcaption></figure></div>';document.querySelector('main')!.append(proportion);
for(const name of ['idle','sitting']){const image=proportion.querySelector<HTMLImageElement>('#proportion-'+name)!;const key=Object.keys(revisedImages).find(path=>path.endsWith('/'+name+'.png'));if(key)image.src=revisedImages[key];}

import './b10-review';

import './b11-review';
