"""Read-only pixel analysis; updates B11 metadata, never edits PNGs.
Requires the existing Pillow dependency used by the asset tooling.
"""
from pathlib import Path
from PIL import Image
import hashlib, json
root = Path('src/characters/candidates/b-mustang-20261107')
out = root / 'cleanup-v11'
master = Image.open(root / 'proportions-v07/idle.png').convert('RGBA')
report = {'status': 'partially-approved-runtime', 'method': 'Reference-conditioned local edits; quality is not inferred from generation or masking success.', 'assets': {}}
for path in sorted(out.glob('*.png')):
    image = Image.open(path).convert('RGBA')
    item = {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'width': image.width, 'height': image.height, 'approved': path.stem != 'dual_firing'}
    old = root / 'cleanup-v10' / path.name
    item['b10_sha256'] = hashlib.sha256(old.read_bytes()).hexdigest()
    if path.stem.startswith('speaking'):
        item['warning'] = '사용자 승인 · B-12 런타임 적용. Speaking 신체 픽셀 차이는 알려진 특성.'
        if image.size == master.size:
            # Exclude hidden RGB behind alpha, and ignore changes <=8/255.
            first = master.crop((0, 400, master.width, master.height))
            second = image.crop((0, 400, image.width, image.height))
            changed = sum(1 for a,b in zip(first.getdata(), second.getdata()) if (a[3]>24 or b[3]>24) and max(abs(x-y) for x,y in zip(a,b))>8)
            item['visible_body_changed_pixels_below_y400'] = changed
            item['neck_sample_alpha_under24'] = sum(a<24 for a in image.getchannel('A').crop((450,310,560,390)).getdata())
            item['body_pixel_match'] = changed == 0
        else:
            item['body_pixel_match'] = False
            item['dimension_mismatch'] = True
    else:
        item['warning'] = '사용자 승인 · B-12 런타임 적용.' if path.stem == 'firing_dynamic' else '미승인 B-11 원본: 별도의 탄피 제거 승인본을 런타임에 사용.'
    report['assets'][path.stem] = item
(out / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
