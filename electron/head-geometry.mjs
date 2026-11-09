// Measured protected head bounds in the unchanged, approved source canvases.
// This is display geometry only, never an asset/proportion replacement.
const sources={
 idle:[956,1645,.31,.01,.35,.22],speaking:[956,1645,.31,.01,.35,.22],
 smoking:[1003,1568,.31,.01,.31,.24],sitting:[1003,1568,.30,.06,.36,.26],
 working:[1024,1600,.31,.025,.32,.23],drawing:[1024,1600,.28,.02,.37,.24],
 firing:[1024,1600,.28,.03,.30,.22],dual_firing:[1024,1536,.36,.05,.26,.22],
 firing_dynamic:[1004,1567,.19,.005,.34,.26]
};
export function headBounds(pet,pose='smoking'){
 const [w,h,x,y,hw,hh]=sources[pose]||sources.smoking;
 const stageW=Math.min(pet.width,pet.height*1024/1600),scale=Math.min(stageW/w,pet.height/h);
 return {x:pet.x+(pet.width-w*scale)/2+x*w*scale,y:pet.y+(pet.height-h*scale)/2+y*h*scale,width:hw*w*scale,height:hh*h*scale};
}
