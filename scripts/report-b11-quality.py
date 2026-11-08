"""Read-only pixel analysis; updates B11 metadata, never edits PNGs.
Requires the existing Pillow dependency used by the asset tooling.
"""
from pathlib import Path
from PIL import Image
import hashlib, json
root = Path('src/characters/candidates/b-mustang-20261107')
out = root / 'cleanup-v11'
master = Image.open(root / 'proportions-v07/idle.png').convert('RGBA')
report = {'status': 'incomplete-review-only', 'method': 'Reference-conditioned local edits; quality is not inferred from generation or masking success.', 'assets': {}}
for path in sorted(out.glob('*.png')):
    image = Image.open(path).convert('RGBA')
    item = {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'width': image.width, 'height': image.height, 'approved': False}
    old = root / 'cleanup-v10' / path.name
    item['b10_sha256'] = hashlib.sha256(old.read_bytes()).hexdigest()
    if path.stem.startswith('speaking'):
        item['warning'] = '미완성: 승인 Idle 대비 얼굴 외 영역의 픽셀 차이가 있어 신체 고정·입 표정만 변경 조건의 완전한 충족을 보장하지 못함. 목·카라 알파와 재생 흔들림 재검수 필요.'
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
        item['warning'] = '미승인 재정제 시안: 팔·몸통·다리 사이 배경 혼입과 검은 의상·머리·총·손가락·섬광·그림자 보존을 실제 알파 합성에서 집중 검수. 정제 완료 판정 전.'
    report['assets'][path.stem] = item
(out / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
