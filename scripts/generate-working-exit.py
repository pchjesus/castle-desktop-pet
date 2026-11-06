#!/usr/bin/env python3
"""Create the Working exit as an approved-art-only, reproducible 2D sequence.

Output: working_exit/000..006.png; no original PNGs overwritten.
000: Working 000; 001..004: folding lid; 005: hands settle;
006: unmodified, exactly approved Idle sprite.
Note: the final put-away/hand-to-pocket is a stylized pose cut, NOT detailed
articulated hand movement. Do not claim full hand articulation.
"""
from pathlib import Path
import hashlib
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
DERIVED = ROOT / "src/characters/derived/akila"
WORKING = DERIVED / "working/000.png"
IDLE = DERIVED / "idle/000.png"
OUT = DERIVED / "working_exit"
REPORT = ROOT / "artifacts/working-exit-review"
H, W = 1600, 1024
SRC = np.float32([[651, 722], [950, 716], [901, 947], [596, 953]])
AMOUNTS = (0., .23, .5, .78, .99)


def composite(a, b, weight):
    return np.clip(a.astype(np.float32) * (1 - weight[..., None]) +
                   b.astype(np.float32) * weight[..., None], 0, 255).astype(np.uint8)


def make_frames():
    original_bytes = WORKING.read_bytes()
    idle_bytes = IDLE.read_bytes()
    approved = np.asarray(Image.open(WORKING).convert("RGBA"), dtype=np.uint8)
    idle = np.asarray(Image.open(IDLE).convert("RGBA"), dtype=np.uint8)
    assert approved.shape == idle.shape == (H, W, 4)
    assert hashlib.sha1(b"blob " + str(len(original_bytes)).encode() +
                        b"\0" + original_bytes).hexdigest() == "6db61ee9ddabb6640c62202d05a6ababa579f86d"

    screen_mask = np.zeros((H, W), np.uint8)
    cv2.fillConvexPoly(screen_mask, SRC.astype(np.int32), 255)
    soft = cv2.GaussianBlur(screen_mask, (9, 9), 2).astype(np.float32) / 255
    behind = composite(approved, idle, soft)

    # Preserve the skin and outlines of the TWO existing approved hands as a
    # foreground occlusion layer, instead of painting duplicate hands.
    hsv = cv2.cvtColor(approved[:, :, :3], cv2.COLOR_RGB2HSV)
    skin = ((hsv[:, :, 0] >= 2) & (hsv[:, :, 0] <= 24) &
            (hsv[:, :, 1] >= 55) & (hsv[:, :, 2] >= 95) &
            (approved[:, :, 3] > 120)).astype(np.uint8) * 255
    region = np.zeros((H, W), np.uint8)
    cv2.ellipse(region, (718, 932), (105, 75), 0, 0, 360, 255, -1)
    cv2.ellipse(region, (554, 861), (105, 80), 0, 0, 360, 255, -1)
    hand = cv2.bitwise_and(skin, region)
    hand = cv2.dilate(hand, np.ones((13, 13), np.uint8), iterations=1)
    hand_soft = cv2.GaussianBlur(hand, (9, 9), 1).astype(np.float32) / 255

    result = []
    for t in AMOUNTS:
        if t == 0:
            frame = approved.copy()
        else:
            destination = np.float32([
                [651 + 12*t, 722 + 198*t],
                [950 - 28*t, 716 + 207*t],
                [901, 947], [596, 953],
            ])
            perspective = cv2.getPerspectiveTransform(SRC, destination)
            folded = cv2.warpPerspective(approved, perspective, (W, H),
                                         flags=cv2.INTER_LINEAR,
                                         borderMode=cv2.BORDER_CONSTANT,
                                         borderValue=(0, 0, 0, 0))
            transformed_mask = cv2.warpPerspective(
                screen_mask, perspective, (W, H), flags=cv2.INTER_LINEAR,
                borderMode=cv2.BORDER_CONSTANT).astype(np.float32) / 255
            transformed_mask = cv2.GaussianBlur(transformed_mask, (5, 5), .7)
            frame = composite(behind, folded, transformed_mask)
            frame = composite(frame, approved, hand_soft * soft)
        result.append(frame)

    # A small movement of the held CLOSED laptop and fingertips (not a hand
    # disappearing in a crossfade). Final frame is exact approved Idle.
    x0, y0, x1, y1 = (455, 805, 925, 1010)
    src = result[-1][y0:y1, x0:x1].copy()
    ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    left = np.exp(-.5*((xs-540)/75)**2 - .5*((ys-862)/40)**2)
    right = np.exp(-.5*((xs-740)/142)**2 - .5*((ys-920)/54)**2)
    dx = -4*left - 4*right
    dy = -8*left + 6*right
    shifted = cv2.remap(src, (xs-x0-dx).astype(np.float32),
                        (ys-y0-dy).astype(np.float32), cv2.INTER_LINEAR,
                        borderMode=cv2.BORDER_REPLICATE)
    edge = np.minimum(np.minimum(xs-x0, x1-1-xs),
                      np.minimum(ys-y0, y1-1-ys))
    blend = np.clip(edge / 16, 0, 1)[..., None].astype(np.float32)
    settled = result[-1].copy()
    settled[y0:y1, x0:x1] = np.clip(
        src*(1-blend) + shifted*blend, 0, 255).astype(np.uint8)
    result.extend([settled, idle])

    OUT.mkdir(parents=True, exist_ok=True)
    REPORT.mkdir(parents=True, exist_ok=True)
    for i, frame in enumerate(result):
        if i < 6:
            assert np.array_equal(frame[:650, :, :], approved[:650, :, :]), \
                "Face, glasses, hair and cigarette must remain pixel-identical."
        Image.fromarray(frame, "RGBA").save(OUT / f"{i:03d}.png", optimize=True)

    columns, tw, th = len(result), 270, 460
    sheet = Image.new("RGB", (columns*tw, th+22), "#303b47")
    draw = ImageDraw.Draw(sheet)
    labels = ("working stop", "close 1", "close 2", "close 3",
              "lid closed", "settle hands", "approved idle")
    for i, (frame, label) in enumerate(zip(result, labels)):
        sprite = Image.fromarray(frame, "RGBA")
        sprite.thumbnail((tw-8, th-8))
        backdrop = Image.new("RGBA", (tw, th), "#303b47")
        backdrop.alpha_composite(sprite, ((tw-sprite.width)//2, 0))
        sheet.paste(backdrop.convert("RGB"), (i*tw, 22))
        draw.text((i*tw+8, 3), f"{i:03d} {label}", fill="white")
    sheet.save(REPORT / "working-exit-sheet.jpg", quality=94)

    assert WORKING.read_bytes() == original_bytes
    assert IDLE.read_bytes() == idle_bytes
    assert np.array_equal(result[-1], idle)
    manifest = {
        "status": "VISUAL_STUDY_WITH_STYLIZED_FINAL_POSE_CUT",
        "sources_untouched": True,
        "frames": len(result),
        "resolution": [W, H],
        "sequence": list(labels),
        "limits": ["hand-to-pocket is a short pose cut, not joint-by-joint motion",
                   "Windows 10/11 GUI and animation screenshots require separate QA"],
    }
    (REPORT / "report.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest))


if __name__ == "__main__":
    make_frames()
