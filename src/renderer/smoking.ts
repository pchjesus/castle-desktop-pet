// Embers in approved proportions-v07/smoking.png: source pixel (597, 282),
// 1003×1568. The existing painted plume is immutable; this adds motion above it.
export function smokingLayer(stage:HTMLElement,image:HTMLImageElement){
 const layer=document.createElement('div');layer.className='b-smoking-layer';layer.setAttribute('aria-hidden','true');
 const anchor=document.createElement('span');anchor.className='b-smoking-anchor';layer.append(anchor);
 for(let i=0;i<2;i++){const strand=document.createElement('span');strand.className='b-smoke-strand';anchor.append(strand);}
 stage.append(layer);
 const layout=()=>{
  const w=stage.clientWidth,h=stage.clientHeight,scale=Math.min(w/image.naturalWidth,h/image.naturalHeight);
  anchor.style.left=`${(w-image.naturalWidth*scale)/2+597*scale}px`;
  anchor.style.top=`${(h-image.naturalHeight*scale)/2+282*scale}px`;
  anchor.style.setProperty('--smoke-scale',String(scale));
 };
 const observer=new ResizeObserver(layout);observer.observe(stage);image.addEventListener('load',layout);layout();
 return ()=>{observer.disconnect();image.removeEventListener('load',layout);layer.remove();};
}
