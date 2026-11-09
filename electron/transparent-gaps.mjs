// Verify CLEAR regions across the whole client, not merely four corners.
// Surface buffers are BGRA. A 4px clear neighborhood avoids moving antialiasing.
export function compareClearRegions(surface,width,height,bounds,actualAt,expectedAt,excluded=[]){
 let checked=0,mismatches=0;const examples=[];
 for(let y=4;y<height-4;y+=4)for(let x=4;x<width-4;x+=4){
  let clear=true;
  for(let dy=-4;dy<=4&&clear;dy+=2)for(let dx=-4;dx<=4;dx+=2)if(surface[((y+dy)*width+x+dx)*4+3]>0){clear=false;break;}
  if(!clear)continue;
  const gx=bounds.x+(x+.5)/width*bounds.width,gy=bounds.y+(y+.5)/height*bounds.height;
  if(excluded.some(b=>gx>=b.x&&gx<b.x+b.width&&gy>=b.y&&gy<b.y+b.height))continue;
  const a=actualAt(gx,gy),b=expectedAt(gx,gy);if(!a||!b)continue;
  checked++;if(a.some((value,index)=>Math.abs(value-b[index])>20)){mismatches++;if(examples.length<16)examples.push({x:gx,y:gy,actual:a,expected:b});}
 }
 return {checked,mismatches,examples,ratio:checked?mismatches/checked:1,passed:checked>30&&mismatches/checked<.01};
}
