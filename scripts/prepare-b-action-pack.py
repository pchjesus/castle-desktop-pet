#!/usr/bin/env python3
"""Reproducible unapproved B technical pack. Original files are read-only.
Requires Pillow, NumPy, SciPy, opencv-python-headless==4.11.0.86.
"""
from pathlib import Path
import hashlib,json,subprocess,argparse
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import binary_propagation, binary_dilation, binary_erosion, distance_transform_edt
import cv2, PIL, scipy
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'design/canonical/b-mustang-20261107/approved_visual_sources'
parser=argparse.ArgumentParser();parser.add_argument('--config');parser.add_argument('--mask-overrides',help='directory of edited <state>-mask.png alpha masks');parser.add_argument('--output',default='src/characters/candidates/b-mustang-20261107/action-pack');args=parser.parse_args()
config=json.loads((ROOT/args.config).read_text()) if args.config else {}
OUT=(ROOT/args.output).resolve()
if not OUT.is_relative_to((ROOT/'src/characters/candidates/b-mustang-20261107').resolve()):
 raise SystemExit('Refusing output outside isolated canonical candidate directory')
if args.mask_overrides and not Path(args.mask_overrides).is_dir():
 raise SystemExit('Mask override directory does not exist')
OUT.mkdir(parents=True,exist_ok=True)
subprocess.run(['node',str(ROOT/'scripts/verify-b-mustang-canonical.mjs')],check=True)
cv2.setRNGSeed(0); cv2.setNumThreads(1)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
records={}
def align(name,im,source,status='needs_visual_review',box=None):
 a=np.array(im); bounds=im.getbbox(); assert bounds
 # Entire visible silhouette, including flash, fits with 40px margins. Uniform only.
 x0,y0,x1,y1=bounds; scale=min(944/(x1-x0),1520/(y1-y0))
 anchor=config.get('anchors',{}).get(name)
 if anchor:
  head=anchor['head_box']; head_scale=(1520/1609)*config['reference_head_width']/(head[2]-head[0]);scale=min(scale,head_scale)
 w,h=round((x1-x0)*scale),round((y1-y0)*scale)
 sprite=im.crop(bounds).resize((w,h),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(1024,1600)); tx=(1024-w)//2; ty=1560-h; canvas.alpha_composite(sprite,(tx,ty))
 p=OUT/(name+'.png');canvas.save(p)
 records[name]={'file':p.name,'sha256':sha(p),'source':source.name,'source_sha256':sha(source),'status':status,'bbox':list(canvas.getbbox()),'source_bbox':list(bounds),'scale':scale,'matrix':[scale,0,tx-x0*scale,0,scale,ty-y0*scale],'baseline':1560,'center_x':512,'canvas':[1024,1600],'source_crop':box,'warning':'silhouette fit is not face-size registration; pose head-size differences need visual review'}
 if anchor:
  records[name]['landmarks']={**anchor,'status':'tentative_manual_review','aligned_eye_y':ty+(anchor['eye_y']-y0)*scale,'aligned_head_width':(anchor['head_box'][2]-anchor['head_box'][0])*scale}
 return canvas
for name in ['idle','sitting','drawing','firing','smoking','working']:
 p=SRC/(name+'.png'); a=np.array(Image.open(p).convert('RGBA')); a[a[:,:,3]==0,:3]=0
 corrected=0;f=config.get('red_fringe')
 if f and name not in f['skip']:
  red=(a[:,:,0]>180)&(a[:,:,1]<80)&(a[:,:,2]<80);target=red&(a[:,:,3]>0)&(a[:,:,3]<=f['alpha_max']);valid=(a[:,:,3]>=200)&~red
  distance,idx=distance_transform_edt(~valid,return_indices=True);target &= distance<=f['distance_max'];corrected=int(target.sum());a[target,:3]=a[idx[0][target],idx[1][target],:3]
 align(name,Image.fromarray(a),p)
 records[name]['rgb_fringe_pixels_corrected']=corrected
for name in ['firing_dynamic','dual_firing']:
 p=SRC/(name+'.jpg'); rgb=np.array(Image.open(p).convert('RGB')); h,w=rgb.shape[:2]
 labels=np.full((h,w),cv2.GC_PR_BGD,np.uint8)
 labels[int(h*.05):int(h*.98),int(w*.04):int(w*.96)]=cv2.GC_PR_FGD
 # Keep central torso as known foreground, preserving black clothing.
 labels[int(h*.40):int(h*.65),int(w*.43):int(w*.56)]=cv2.GC_FGD
 labels[:3]=0;labels[-3:]=0;labels[:,:3]=0;labels[:,-3:]=0
 regions=config.get('masks',{}).get(name,{})
 if regions.get('allowed_foreground'):
  allowed=Image.new('L',(w,h));ImageDraw.Draw(allowed).polygon([tuple(p) for p in regions['allowed_foreground']],fill=255);keep=binary_dilation(np.array(allowed)>0,iterations=12);labels[~keep]=cv2.GC_BGD
 for kind,value in [('foreground',cv2.GC_FGD),('background',cv2.GC_BGD)]:
  for polygon in regions.get(kind,[]):
   paint=Image.new('L',(w,h));ImageDraw.Draw(paint).polygon([tuple(p) for p in polygon],fill=255);labels[np.array(paint)>0]=value
 Image.fromarray(labels).save(OUT/(name+'-seeds.png'))
 cv2.grabCut(cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR),labels,None,np.zeros((1,65)),np.zeros((1,65)),5,cv2.GC_INIT_WITH_MASK)
 fg=(labels==1)|(labels==3)
 # Soft outer transition is a draft, not an alpha matte of fire/smoke.
 inside=distance_transform_edt(fg); outside=distance_transform_edt(~fg)
 alpha=np.clip((inside-outside+1.5)/3,0,1)*255;alpha=alpha.astype('uint8')
 if args.mask_overrides:
  override=Path(args.mask_overrides)/(name+'-mask.png')
  if override.exists():
   edited=Image.open(override);assert edited.mode=='L' and edited.size==(w,h),'mask override must be source-sized grayscale';alpha=np.array(edited)
 Image.fromarray(alpha).save(OUT/(name+'-mask.png'))
 uncertain=(binary_dilation(fg,iterations=4)^binary_erosion(fg,iterations=4)).astype('uint8')*255
 Image.fromarray(uncertain).save(OUT/(name+'-uncertainty.png'))
 a=np.dstack((rgb,alpha));a[alpha==0,:3]=0
 align(name,Image.fromarray(a),p)
 records[name]['status']='blocked' if name=='dual_firing' else 'needs_visual_review'
 records[name]['warning']='GrabCut draft: dark clothes, fingers, flash, gradient and soft fringe require manual review; masks are editable'
source=SRC/'speaking_reference.jpg';sheet=Image.open(source).convert('RGB')
for i in range(7):
 box=(20+i*198,55,min(20+(i+1)*198,1404),315);rgb=np.array(sheet.crop(box));dark=np.max(rgb,axis=2)<=24
 seeds=np.zeros(dark.shape,bool);seeds[0]=dark[0];seeds[-1]=dark[-1];seeds[:,0]=dark[:,0];seeds[:,-1]=dark[:,-1]
 protect=config.get('speaking_protection_box',[55,175,170,260]);dark[protect[1]:protect[3],protect[0]:protect[2]]=False
 bg=binary_propagation(seeds,mask=dark);alpha=np.where(bg,0,255).astype('uint8');a=np.dstack((rgb,alpha));a[bg,:3]=0
 # Fixed crop coordinates and common scale keep eye level consistent; no face warping.
 im=Image.fromarray(a);canvas=Image.new('RGBA',(256,320));canvas.alpha_composite(im,((256-im.width)//2,20));p=OUT/f'speaking-{i+1:02}.png';canvas.save(p)
 records[f'speaking-{i+1:02}']={'file':p.name,'sha256':sha(p),'source':source.name,'source_sha256':sha(source),'status':'needs_visual_review','source_crop':list(box),'canvas':[256,320],'scale':1,'eye_line_approx':145,'bbox':list(canvas.getbbox()),'warning':'black fringe and crop boundaries need review; face-only loop, no whole-body compositing'}
(OUT/'manifest.json').write_text(json.dumps({'status':'needs_visual_review','algorithm':{'opencv':cv2.__version__,'grabcut_iterations':5,'seed':0,'soft_edge_width':3,'png_alpha':'unchanged except proportional resampling','speaking_border_cutoff':24},'versions':{'pillow':PIL.__version__,'numpy':np.__version__,'scipy':scipy.__version__},'manual_config':config,'assets':records},indent=2)+'\n')
# Contact sheet is for inspection, not visual approval.
thumb=Image.new('RGB',(4*256,4*430),'#d3d3d3');d=ImageDraw.Draw(thumb)
for i,(name,r) in enumerate(records.items()):
 im=Image.open(OUT/r['file']);im.thumbnail((240,390));x=(i%4)*256;y=(i//4)*430;thumb.paste(im,(x+(256-im.width)//2,y+25),im);d.text((x+5,y+5),name,fill='black')
thumb.save(OUT/'contact-sheet.jpg',quality=90)
print('Saved',len(records),'pack images and contact sheet')
