#!/usr/bin/env python3
"""Conservative technical candidates; outputs require visual approval, never edits originals.
Requires Pillow, numpy and scipy. No threshold is applied to existing PNG alpha.
"""
from pathlib import Path
import hashlib, json, subprocess
import numpy as np
from PIL import Image
from scipy.ndimage import binary_propagation
ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT/'design/canonical/b-mustang-20261107/approved_visual_sources'
OUT = ROOT/'src/characters/candidates/b-mustang-20261107'
OUT.mkdir(parents=True,exist_ok=True)
subprocess.run(['node',str(ROOT/'scripts/verify-b-mustang-canonical.mjs')],check=True)
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def save(name, arr):
 p=OUT/name; Image.fromarray(arr,'RGBA').save(p); return p
report={'policy':'unapproved technical candidates; no runtime usage','operations':{'png':'zero RGB only where alpha is already exactly 0; alpha unchanged; no scaling','jpeg':'border-connected pixels with each RGB channel <= 8 made transparent; binary draft mask requires manual repair, no scaling','speaking':'seven approximate top-row crops; opaque background retained; needs manual review'},'assets':{}}
for name in ('idle','sitting','drawing','firing','smoking','working'):
 source=SRC/(name+'.png'); a=np.array(Image.open(source).convert('RGBA')); alpha=a[:,:,3].copy(); a[alpha==0,:3]=0
 p=save(name+'.png',a); report['assets'][name]={'source_sha256':digest(source),'candidate':p.name,'sha256':digest(p),'dimensions':[a.shape[1],a.shape[0]],'alpha_unchanged':True,'bbox':Image.fromarray(alpha).getbbox(),'scale':[1,1],'status':'needs_visual_review'}
for name in ('firing_dynamic','dual_firing'):
 source=SRC/(name+'.jpg'); rgb=np.array(Image.open(source).convert('RGB')); dark=np.all(rgb<=8,axis=2); seed=np.zeros(dark.shape,bool); seed[0,:]=dark[0,:];seed[-1,:]=dark[-1,:];seed[:,0]=dark[:,0];seed[:,-1]=dark[:,-1]; bg=binary_propagation(seed,mask=dark); alpha=np.where(bg,0,255).astype('uint8'); rgba=np.dstack((rgb,alpha)); rgba[bg,:3]=0
 p=save(name+'.png',rgba); mask=OUT/(name+'-draft-mask.png');Image.fromarray(alpha,'L').save(mask)
 report['assets'][name]={'source_sha256':digest(source),'candidate':p.name,'sha256':digest(p),'mask':mask.name,'dimensions':[rgb.shape[1],rgb.shape[0]],'bbox':Image.fromarray(alpha).getbbox(),'scale':[1,1],'status':'needs_manual_review','warning':'black threshold may erase dark details or retain gradient; inspect flash and edges'}
source=SRC/'speaking_reference.jpg'; im=Image.open(source).convert('RGBA'); parts=[]
for i in range(7):
 box=(20+i*198,55,min(20+(i+1)*198,1404),315); p=OUT/f'speaking-{i+1:02}.png'; im.crop(box).save(p); parts.append({'candidate':p.name,'sha256':digest(p),'source_box':list(box),'status':'needs_manual_review'})
report['assets']['speaking_reference']={'source_sha256':digest(source),'status':'needs_manual_review','warning':'rough crops retain black background, edge alignment not verified','frames':parts}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
print('Candidate manifest saved:',OUT/'manifest.json')

# Optional integrated stage keeps CANONICAL-02 outputs intact and appends the action pack.
if __name__ == '__main__':
 import sys
 if '--action-pack' in sys.argv:
  subprocess.run([sys.executable, str(ROOT/'scripts/prepare-b-action-pack.py')],check=True)
