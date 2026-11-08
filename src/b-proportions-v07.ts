import report from './characters/candidates/b-mustang-20261107/proportions-v07/manifest.json';
import './b-proportions-v07.css';

// Review-only imports: never register these images in outfits or the live pet.
const originals = import.meta.glob('../design/canonical/b-mustang-20261107/approved_visual_sources/*.png', {eager:true, query:'?url', import:'default'}) as Record<string,string>;
const candidates = import.meta.glob('./characters/candidates/b-mustang-20261107/proportions-v07/*.png', {eager:true, query:'?url', import:'default'}) as Record<string,string>;
const section = document.createElement('section');
section.className = 'b07-review';
section.innerHTML = `<h2>B-CANONICAL-07 · 비례 편집 후보 · 미승인</h2>
<p>원본·후보·기준 그룹을 같은 표시 영역에 맞춥니다. 머리 축소와 상체·팔다리 변경이 있는 재편집 이미지이며, 기본 펫에 적용되지 않습니다.</p>
<label>대상 <select id="b07-pose"><option value="idle">Idle</option><option value="smoking">Smoking</option><option value="sitting">Sitting</option></select></label>
<label>표시 너비 <select id="b07-size"><option>180</option><option selected>240</option><option>360</option></select> px</label>
<label>배경 <select id="b07-bg"><option value="checker">격자</option><option value="light">흰색</option><option value="dark">어두운 회색</option></select></label>
<label><input type="checkbox" id="b07-guides" checked> 머리·눈·어깨·발 기준점</label>
<p>분홍 상자: 머리 · 파랑: 눈높이 · 주황: 어깨선 · 초록: 발. 기준점은 수동 추정값이며 정밀 인체 계측이 아닙니다. 각 이미지의 실제 좌표에 표시하며, 선을 강제로 일치시키지 않습니다. Sitting은 접힌 다리 때문에 서 있는 전체 키와 직접 비교하지 마세요.</p>
<div class="b07-panels" data-background="checker"></div><p id="b07-status" aria-live="polite"></p>`;
document.querySelector('main')!.append(section);
const select = section.querySelector<HTMLSelectElement>('#b07-pose')!;
const panels = section.querySelector<HTMLElement>('.b07-panels')!;
function imageUrl(map:Record<string,string>, name:string) {
  const entry = Object.entries(map).find(([key])=>key.endsWith('/'+name+'.png'));
  if (!entry) throw new Error('Missing B07 review image: '+name);
  return entry[1];
}
function render() {
  const pose = select.value as 'idle'|'smoking'|'sitting';
  panels.replaceChildren();
  for (const [name, kind, label] of [[pose,'original','공식 원본'],[pose,'candidate','07 편집 후보'],['drawing','original','기준 Drawing'],['firing','original','기준 Firing'],['working','original','기준 Working']] as const) {
    const item = report.images[`${name}-${kind}` as keyof typeof report.images];
    const figure = document.createElement('figure');
    const stage = document.createElement('div'); stage.className='b07-stage';
    const content = document.createElement('div');content.className='b07-content';
    content.style.aspectRatio=`${item.width} / ${item.height}`;
    const image=document.createElement('img');image.alt=`${name} ${label}`;
    image.dataset.kind=kind; image.src=imageUrl(kind==='candidate'?candidates:originals,name);
    content.append(image);
    const [x,y,right,bottom]=item.head_box;
    const box=document.createElement('i');box.className='b07-head';
    Object.assign(box.style,{left:`${x/item.width*100}%`,top:`${y/item.height*100}%`,width:`${(right-x)/item.width*100}%`,height:`${(bottom-y)/item.height*100}%`});
    content.append(box);
    for(const [key,label] of [['eye_y','눈'],['shoulder_y','어깨'],['foot_y','발']] as const){
      const line=document.createElement('span');line.className='b07-line '+key;
      line.style.top=`${item[key]/item.height*100}%`;line.textContent=label;content.append(line);
    }
    stage.append(content);
    const caption=document.createElement('figcaption');
    caption.textContent=`${name} · ${label} · 머리폭/어깨폭 추정 ${((right-x)/item.shoulder_width).toFixed(2)}`;
    figure.append(stage,caption);panels.append(figure);
  }
  section.querySelector('#b07-status')!.textContent=report.poses[pose].limitations;
}
select.addEventListener('change',render);
section.querySelector('#b07-size')!.addEventListener('change',event=>{panels.style.setProperty('--b07-width',(event.target as HTMLSelectElement).value+'px');});
section.querySelector('#b07-bg')!.addEventListener('change',event=>{panels.dataset.background=(event.target as HTMLSelectElement).value;});
section.querySelector('#b07-guides')!.addEventListener('change',event=>{panels.classList.toggle('b07-hide-guides',!(event.target as HTMLInputElement).checked);});
render();
