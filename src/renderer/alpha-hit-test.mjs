// Click only on visible sprite pixels, not its transparent rectangular canvas.
// Keep independent of Electron so pixel-to-pointer mapping is unit-testable.
export function hitTestAlpha(mask, rect, clientX, clientY, threshold=24) {
 if (!mask || !mask.alpha || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return false;
 const {width,height,alpha}=mask;
 if (!(width>0 && height>0 && rect.width>0 && rect.height>0 && alpha.length===width*height)) return false;
 // An object-fit: contain image may have letterboxing inside its DOM rectangle.
 const scale=Math.min(rect.width/width,rect.height/height);
 const w=width*scale,h=height*scale;
 const x=clientX-rect.left-(rect.width-w)/2;
 const y=clientY-rect.top-(rect.height-h)/2;
 if(x<0||y<0||x>=w||y>=h) return false;
 const px=Math.min(width-1,Math.floor(x/scale)),py=Math.min(height-1,Math.floor(y/scale));
 return alpha[py*width+px]>=threshold;
}
export function extractAlpha(rgba,width,height) {
 if(!(width>0&&height>0&&rgba.length===width*height*4)) throw new RangeError('Invalid RGBA source');
 const alpha=new Uint8Array(width*height);
 for(let i=0;i<alpha.length;i++)alpha[i]=rgba[4*i+3];
 return {width,height,alpha};
}
