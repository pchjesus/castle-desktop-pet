#!/usr/bin/env python3
"""Create two pixel-preserving Working finger-tap poses from the existing aligned A-type PNG.

DO NOT repaint/re-generate the face or costume, resize the body, or modify
assets/akila/working/*.png. This is a small *localized* geometry adjustment
inside the keyboard fingers area of the already-approved 000 aligned pose.

Output derived/akila/working/{002,003}.png; retain historical 001 (not animated).
Requires numpy, pillow, opencv-python-headless; used only during asset generation.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/characters/derived/akila/working/000.png"
OUTPUT = SOURCE.parent
STUDY = ROOT / "artifacts/working-typing-study"
ROI = (500, 810, 650, 930)  # x0,y0,x1,y1 in the 1024x1600 aligned pose

# (x, y, vertical displacement, horizontal displacement, sigma x, sigma y).
# A few pixels at source resolution == ~1-3px at desktop-pet size.
FINGERS = {
    "002": [(600, 873, 6.0, -0.7, 19, 17), (631, 876, -2.0, 0.0, 18, 17)],
    "003": [(600, 873, -1.7, 0.0, 19, 17), (631, 876, 6.0, -0.7, 18, 17)],
}


def adjust(img: np.ndarray, fingers: list[tuple]) -> np.ndarray:
    x0, y0, x1, y1 = ROI
    src = img[y0:y1, x0:x1].copy()
    height, width = src.shape[:2]
    ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dx = np.zeros((height, width), dtype=np.float32)
    dy = np.zeros_like(dx)
    for cx, cy, motion_y, motion_x, sig_x, sig_y in fingers:
        weight = np.exp(-0.5 * ((xs-cx)/sig_x)**2 - 0.5 * ((ys-cy)/sig_y)**2)
        dx += weight * motion_x
        dy += weight * motion_y
    mapx = (xs - x0 - dx).astype(np.float32)
    mapy = (ys - y0 - dy).astype(np.float32)
    shifted = cv2.remap(src, mapx, mapy, cv2.INTER_CUBIC,
                        borderMode=cv2.BORDER_REPLICATE)
    out = img.copy()
    edge_y = np.minimum(np.minimum(ys-y0, y1-ys-1), 10) / 10
    edge_x = np.minimum(np.minimum(xs-x0, x1-xs-1), 10) / 10
    blend = np.clip(edge_x * edge_y, 0, 1)[..., None].astype(np.float32)
    out[y0:y1, x0:x1] = np.clip(src*(1-blend)+shifted*blend, 0, 255).astype(np.uint8)
    return out


def make_sheet(frames: list[tuple[str, np.ndarray]]) -> None:
    width, height = 390, 608
    sheet = Image.new("RGB", (width*len(frames), height+300), "#e5eaf0")
    draw = ImageDraw.Draw(sheet)
    for index, (label, frame) in enumerate(frames):
        sprite = Image.fromarray(frame, "RGBA")
        sprite.thumbnail((380, 580))
        background = Image.new("RGBA", (width, height), "#334150")
        background.alpha_composite(sprite, ((width-sprite.width)//2,
                                            (height-sprite.height)//2))
        sheet.paste(background.convert("RGB"), (index*width, 0))
        draw.text((index*width+8, 8), label, fill="#ffffff")
        close = Image.fromarray(frame, "RGBA").crop((470, 790, 690, 960))
        close = close.resize((360, 280), Image.Resampling.LANCZOS)
        close_bg = Image.new("RGBA", close.size, "#334150")
        close_bg.alpha_composite(close)
        sheet.paste(close_bg.convert("RGB"), (index*width+15, height+10))
    sheet.save(STUDY / "typing-study.jpg", quality=94)


def main() -> None:
    original_file = SOURCE.read_bytes()
    original = np.asarray(Image.open(SOURCE).convert("RGBA"), dtype=np.uint8)
    assert original.shape == (1600, 1024, 4)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    STUDY.mkdir(parents=True, exist_ok=True)
    frames = [("000 approved", original)]
    results = []
    for name, fingers in FINGERS.items():
        updated = adjust(original, fingers)
        changed = (updated != original).any(axis=2)
        outside = changed.copy()
        x0, y0, x1, y1 = ROI
        outside[y0:y1, x0:x1] = False
        assert not outside.any(), "Approved pixels outside fingertips were modified."
        count = int(changed.sum())
        assert 150 < count < 13000, "Unusually broad or invisible hand motion."
        target = OUTPUT / (name + ".png")
        Image.fromarray(updated, "RGBA").save(target, optimize=True)
        results.append({"file": str(target.relative_to(ROOT)),
                        "changed_pixels": count, "protected_pixels_changed": 0})
        frames.append((name + " finger tap", updated))
    frames.append(("000 approved", original))
    make_sheet(frames)
    assert SOURCE.read_bytes() == original_file, "Working original unexpectedly modified"
    (STUDY / "report.json").write_text(json.dumps({
        "status": "CANDIDATE_REQUIRES_CHROMIUM_QA",
        "method": "localized displacement of 2 fingers only; no full-image morph",
        "source_sha256": hashlib.sha256(original_file).hexdigest(),
        "original_file_unchanged": True,
        "frames": results
    }, indent=2), encoding="utf-8")
    print(json.dumps(results))


if __name__ == "__main__":
    main()
