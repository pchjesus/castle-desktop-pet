import { akila, states, originalFrames, type PetState } from './characters/akila';
import { mountPet } from './renderer/pet';
import './style.css';
import './preview.css';
const pet = document.querySelector<HTMLElement>('#pet')!;
const desktop = document.querySelector<HTMLElement>('#desktop')!;
const dialogue = document.querySelector<HTMLElement>('#dialogue')!;
const speed = document.querySelector<HTMLSelectElement>('#speed')!;
const controller = mountPet(pet, akila, () => Number(speed.value));
const select = document.querySelector<HTMLSelectElement>('#state')!;
pet.addEventListener('pet-state', event => { select.value = (event as CustomEvent<PetState>).detail; });
for (const state of states) { const option = document.createElement('option'); option.value = state; option.textContent = state === 'working' ? '작업 (정지 포즈)' : state === 'dual_firing' ? '쌍권총 (고정 조준 효과)' : state; select.append(option); }
select.addEventListener('change', () => controller.set(select.value as PetState));
function clamp() { pet.style.left = `${Math.max(0, Math.min(pet.offsetLeft, desktop.clientWidth - pet.offsetWidth))}px`; pet.style.top = `${Math.max(0, Math.min(pet.offsetTop, desktop.clientHeight - pet.offsetHeight))}px`; }
function reset() { pet.style.left = `${Math.max(0, desktop.clientWidth - pet.offsetWidth - 30)}px`; pet.style.top = `${Math.max(0, desktop.clientHeight - pet.offsetHeight - 30)}px`; dialogue.textContent = ''; }
document.querySelector<HTMLSelectElement>('#size')!.addEventListener('change', e => { const width = Number((e.target as HTMLSelectElement).value); pet.style.width = `${width}px`; pet.style.height = `${width * 1.25}px`; clamp(); });
document.querySelector('#reset')!.addEventListener('click', reset);
document.querySelectorAll<HTMLButtonElement>('[data-dialogue]').forEach(button => button.addEventListener('click', () => { dialogue.textContent = akila.dialogues[button.dataset.dialogue!][0]; }));
pet.addEventListener('pointerdown', event => { event.preventDefault(); pet.setPointerCapture(event.pointerId); const startX = event.clientX, startY = event.clientY, left = pet.offsetLeft, top = pet.offsetTop; const move = (e: PointerEvent) => { pet.style.left = `${left + e.clientX - startX}px`; pet.style.top = `${top + e.clientY - startY}px`; clamp(); }; const end = () => { pet.removeEventListener('pointermove', move); pet.removeEventListener('pointerup', end); pet.removeEventListener('pointercancel', end); }; pet.addEventListener('pointermove', move); pet.addEventListener('pointerup', end); pet.addEventListener('pointercancel', end); });
window.addEventListener('resize', clamp); reset();

document.querySelector('#replay')!.addEventListener('click', () => { const chosen = select.value as PetState; controller.set('idle'); controller.set(chosen); });
const review = document.querySelector<HTMLSelectElement>('#review-state')!;
for (const state of states) { const opt = document.createElement('option'); opt.value = state; opt.textContent = state; review.append(opt); }
let reviewIndex = 0;
const selectedFrame = document.querySelector<HTMLImageElement>('#selected-frame')!;
const referenceFrame = document.querySelector<HTMLImageElement>('#reference-frame')!;
referenceFrame.src = akila.animations.idle.frames[0];
function updateReview() { const frames = document.querySelector<HTMLSelectElement>('#review-source')!.value === 'original' ? originalFrames(review.value as PetState) : akila.animations[review.value as PetState].frames; reviewIndex = frames.length ? (reviewIndex + frames.length) % frames.length : 0; selectedFrame.hidden = !frames.length; if (frames.length) selectedFrame.src = frames[reviewIndex]; document.querySelector('#frame-label')!.textContent = frames.length ? `${reviewIndex + 1} / ${frames.length}` : '프레임 없음'; }
review.addEventListener('change', () => { reviewIndex = 0; updateReview(); });
document.querySelector('#frame-prev')!.addEventListener('click', () => { reviewIndex--; updateReview(); });
document.querySelector('#frame-next')!.addEventListener('click', () => { reviewIndex++; updateReview(); });
updateReview();

document.querySelector('#review-source')!.addEventListener('change', () => { reviewIndex = 0; updateReview(); });
speed.addEventListener('change', () => { const chosen = select.value as PetState; controller.set('idle'); controller.set(chosen); });

// Isolated review only: candidates never enter the active character registry.
const candidates = import.meta.glob('./characters/candidates/akila_mustang/*.png', { eager:true, query:'?url', import:'default' }) as Record<string,string>;
const candidateNames = Object.keys(candidates).sort();
const candidateSelect = document.querySelector<HTMLSelectElement>('#mustang-candidate')!;
for (const path of candidateNames) { const o = document.createElement('option'); o.value = path; o.textContent = path.split('/').pop()!; candidateSelect.append(o); }
const before = document.querySelector<HTMLImageElement>('#mustang-before')!;
const after = document.querySelector<HTMLImageElement>('#mustang-after')!;
const original = candidateNames.find(path => path.endsWith('/idle-unapproved.png'));
if (original) before.src = candidates[original];
const cleanup = candidateNames.find(path => path.endsWith('/idle-gate1b-alpha-cleanup-unapproved.png'));
if (cleanup) candidateSelect.value = cleanup;
function showCandidate() { const path = candidateSelect.value; after.hidden = !path; if (path) after.src = candidates[path]; document.querySelector('#mustang-status')!.textContent = path ? '미승인 후보: ' + path.split('/').pop() : '후보 없음'; }
candidateSelect.addEventListener('change', showCandidate); showCandidate();
document.querySelector<HTMLSelectElement>('#mustang-size')!.addEventListener('change', e => { document.querySelector<HTMLElement>('.mustang-panels')!.style.setProperty('--candidate-width', (e.target as HTMLSelectElement).value + 'px'); });
document.querySelector<HTMLSelectElement>('#mustang-bg')!.addEventListener('change', e => { document.querySelector<HTMLElement>('.mustang-panels')!.dataset.background = (e.target as HTMLSelectElement).value; });
document.querySelector<HTMLInputElement>('#mustang-guides')!.addEventListener('change', e => { document.querySelector<HTMLElement>('.mustang-panels')!.classList.toggle('hide-guides', !(e.target as HTMLInputElement).checked); });
