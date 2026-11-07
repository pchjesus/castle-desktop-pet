export const PET_WIDTH_PRESETS = Object.freeze([120,140,160,180,200,240,280,320,360]);
export const DEFAULT_PET_WIDTH = 180;
export const PET_HEIGHT_RATIO = 1.25;
export function dimensionsFor(width) {
 if(!Number.isInteger(width)||width<PET_WIDTH_PRESETS[0]||width>PET_WIDTH_PRESETS.at(-1)) throw new RangeError('Unsupported pet width');
 return {width,height:Math.round(width*PET_HEIGHT_RATIO)};
}
export function nextWidth(current,direction) {
 if(direction>0) return PET_WIDTH_PRESETS.find(width=>width>current)??PET_WIDTH_PRESETS.at(-1);
 if(direction<0) return [...PET_WIDTH_PRESETS].reverse().find(width=>width<current)??PET_WIDTH_PRESETS[0];
 return current;
}
export function resizeAroundFeet(bounds,width) {
 const size=dimensionsFor(width);
 return {x:Math.round(bounds.x+(bounds.width-size.width)/2),y:Math.round(bounds.y+bounds.height-size.height),...size};
}
export function restoreWindowBounds(saved) {
 if(!saved||typeof saved!=='object') return null;
 if(!['x','y','width','height'].every(key=>Number.isFinite(saved[key]))) return null;
 const {x,y,width,height}=saved;
 if(width<120||width>800||height<150||height>1000) return null;
 const oldDefault=saved.settingsVersion!==2&&width===240&&height===300;
 const size=oldDefault?DEFAULT_PET_WIDTH:width;
 if(!Number.isInteger(size)||size<120||size>360) return null;
 return resizeAroundFeet({x,y,width,height},size);
}
