from pathlib import Path
from PIL import Image,ImageDraw
import json
ROOT=Path(__file__).resolve().parents[1];BASE=ROOT/'src/characters/candidates/b-mustang-20261107';NEW=BASE/'action-pack-v04';OLD=BASE/'action-pack';SRC=ROOT/'design/canonical/b-mustang-20261107/approved_visual_sources';OUT=ROOT/'artifacts/b04-review';OUT.mkdir(parents=True,exist_ok=True)
m=json.loads((NEW/'manifest.json').read_text())
def panel(im,w=300,h=470,bg='checker'):
 b=Image.new('RGBA',(w,h),'white' if bg=='light' else '#292929' if bg=='dark' else '#ddd')
 if bg=='checker':
  d=ImageDraw.Draw(b)
  for y in range(0,h,16):
   for x in range(0,w,16):
    if (x//16+y//16)%2:d.rectangle((x,y,x+15,y+15),fill='#aaa')
 im=im.convert('RGBA');im.thumbnail((w-16,h-20),Image.Resampling.LANCZOS);b.alpha_composite(im,((w-im.width)//2,h-10-im.height));return b.convert('RGB')
def sheet(name,items,cols=3):
 rows=(len(items)+cols-1)//cols;out=Image.new('RGB',(cols*300,rows*500),'#202735');d=ImageDraw.Draw(out)
 for i,(label,im,bg) in enumerate(items):
  x=i%cols*300;y=i//cols*500;d.text((x+5,y+6),label,fill='white');out.paste(panel(im,bg=bg),(x,y+30))
 out.save(OUT/(name+'.jpg'),quality=92)
items=[]
for n in ['idle','sitting','drawing','firing','smoking','working','firing_dynamic','dual_firing']:
 ext='jpg' if n in ('firing_dynamic','dual_firing') else 'png'
 items += [(n+' source',Image.open(SRC/(n+'.'+ext)),'checker'),(n+' v03',Image.open(OLD/(n+'.png')),'checker'),(n+' v04',Image.open(NEW/(n+'.png')),'checker')]
items += [('speaking reference sheet',Image.open(SRC/'speaking_reference.jpg'),'checker'),('speaking v03 frame 1',Image.open(OLD/'speaking-01.png'),'checker'),('speaking v04 frame 1',Image.open(NEW/'speaking-01.png'),'checker')]
sheet('all-before-after',items)
sheet('idle-drawing-firing',[(n,Image.open(NEW/(n+'.png')),'checker') for n in ['idle','drawing','firing']])
sheet('idle-sitting-head-scale',[(n,Image.open(NEW/(n+'.png')),'checker') for n in ['idle','sitting']],2)
for n in ['firing_dynamic','dual_firing']:
 sheet(n+'-mask-result',[(n+' source',Image.open(SRC/(n+'.jpg')),'checker'),('mask',Image.open(NEW/(n+'-mask.png')),'light'),('result',Image.open(NEW/(n+'.png')),'checker')])
sheet('speaking-seven',[(n,Image.open(NEW/(n+'.png')),'checker') for n in [f'speaking-{i:02}' for i in range(1,8)]],4)
for bg in ['light','dark','checker']:
 sheet('png-six-'+bg,[(n,Image.open(NEW/(n+'.png')),bg) for n in ['idle','sitting','drawing','firing','smoking','working']],3)
# Overlay tentative landmarks directly on source copies for manual coordinate validation.
items=[]
for n in ['idle','sitting','drawing','firing','smoking','working']:
 r=m['assets'][n];im=Image.open(SRC/(n+'.png')).convert('RGBA');d=ImageDraw.Draw(im);a=r.get('landmarks');
 if a:
  d.rectangle(a['head_box'],outline='red',width=3)
  for key,color in [('eye_y','cyan'),('shoulder_y','yellow'),('foot_y','red')]:d.line((0,a[key],im.width,a[key]),fill=color,width=2)
 items.append((n+' tentative anchors',im,'checker'))
sheet('source-landmarks',items)
print(OUT)
