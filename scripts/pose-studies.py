#!/usr/bin/env python3
"""Generate *unapproved* in-between pose studies from existing aligned sprites.

This experiment does not alter runtime assets and does not assert that automatic
morphing is acceptable character art. A human must inspect anatomy, hands,
costume, weapons, silhouette, and background transparency before integration.
"""
from __future__ import annotations
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/characters/derived/akila"
OUT = ROOT / "artifacts/pose-studies"
TIMES = (0.25, 0.5, 0.75)
CASES = {
    "working": ("000.png", "001.png"),
    "drawing": ("000.png", "001.png"),
}


def read_rgba(path: Path) -> np.ndarray:
    rgba = np.asarray(Image.open(path).convert("RGBA"), dtype=np.uint8)
    assert rgba.shape == (1600, 1024, 4), (str(path), rgba.shape)
    return rgba


def flow_image(rgba: np.ndarray) -> np.ndarray:
    # Composite transparency over gray, not black; include silhouette in flow.
    alpha = rgba[:, :, 3:4].astype(np.float32) / 255
    composite = rgba[:, :, :3].astype(np.float32) * alpha + 80.0 * (1 - alpha)
    gray = cv2.cvtColor(composite.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    return cv2.resize(gray, (512, 800), interpolation=cv2.INTER_AREA)


def padded_remap(src: np.ndarray, dx: np.ndarray, dy: np.ndarray) -> np.ndarray:
    h, w = src.shape[:2]
    xx, yy = np.meshgrid(np.arange(w, dtype=np.float32),
                         np.arange(h, dtype=np.float32))
    return cv2.remap(src, xx + dx, yy + dy, cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))


def interpolate(a: np.ndarray, b: np.ndarray, t: float) -> np.ndarray:
    ga, gb = flow_image(a), flow_image(b)
    fwd = cv2.calcOpticalFlowFarneback(
        ga, gb, None, 0.5, 5, 31, 5, 7, 1.5, 0)
    bwd = cv2.calcOpticalFlowFarneback(
        gb, ga, None, 0.5, 5, 31, 5, 7, 1.5, 0)
    h, w = a.shape[:2]
    fw = cv2.resize(fwd, (w, h), interpolation=cv2.INTER_LINEAR) * 2
    bw = cv2.resize(bwd, (w, h), interpolation=cv2.INTER_LINEAR) * 2

    wa = padded_remap(a, -t * fw[:, :, 0], -t * fw[:, :, 1]).astype(np.float32)
    wb = padded_remap(b, -(1.0 - t) * bw[:, :, 0],
                      -(1.0 - t) * bw[:, :, 1]).astype(np.float32)

    # Blend premultiplied RGBA to avoid dark halos around outlines.
    aa = wa[:, :, 3:4] / 255.0
    ab = wb[:, :, 3:4] / 255.0
    coverage = (1 - t) * aa + t * ab
    premultiplied = (1 - t) * aa * wa[:, :, :3] + t * ab * wb[:, :, :3]
    rgb = np.divide(premultiplied, coverage, out=np.zeros_like(premultiplied),
                    where=coverage > 0.0001)
    output = np.concatenate([rgb, coverage * 255.0], axis=2)

    # The approved facial features and boots should not morph or drift.
    # Blend towards the exact starting pose near those regions.
    yy = np.arange(h, dtype=np.float32)[:, None, None] / h
    head = np.clip((yy - 0.28) / 0.075, 0.0, 1.0)
    feet = np.clip((0.82 - yy) / 0.09, 0.0, 1.0)
    motion_mask = head * feet
    output = a.astype(np.float32) * (1 - motion_mask) + output * motion_mask
    return np.clip(output, 0, 255).astype(np.uint8)


def sheet(name: str, frames: list[tuple[str, np.ndarray]]) -> None:
    tile_w, tile_h = 292, 480
    pic = Image.new("RGB", (tile_w * len(frames), tile_h), "#f4f6f8")
    draw = ImageDraw.Draw(pic)
    for i, (label, frame) in enumerate(frames):
        rgba = Image.fromarray(frame, "RGBA")
        rgba.thumbnail((tile_w - 20, tile_h - 42))
        bg = Image.new("RGBA", (tile_w - 20, tile_h - 42), "#334150")
        bg.alpha_composite(rgba, ((bg.width - rgba.width) // 2,
                                  (bg.height - rgba.height) // 2))
        pic.paste(bg.convert("RGB"), (i * tile_w + 10, 32))
        draw.text((i * tile_w + 12, 10), f"{name} — {label}", fill="#152235")
    pic.save(OUT / (name + "-study-sheet.jpg"), quality=93)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, object] = {
        "status": "CANDIDATE_ONLY_NOT_APPROVED",
        "method": "optical-flow morphing, original approved source PNGs unchanged",
        "states": {},
        "human_checks": [
            "identical approved A-type facial features, SD silhouette, sunglasses and clothing",
            "no duplicate hand, broken wrist, floating forearm or ghosted keyboard",
            "single firearm must remain a revolver, dual must be revolver plus semi-auto",
            "no unwanted halos, texture smear, weapon bending or silhouette warping",
            "frame registration and timing at 180, 240, 360 CSS pixels",
        ],
    }
    for state, (a_name, b_name) in CASES.items():
        a, b = read_rgba(SOURCE / state / a_name), read_rgba(SOURCE / state / b_name)
        frame_list = [("original 0", a)]
        candidates = []
        for t in TIMES:
            trial = interpolate(a, b, t)
            name = f"{state}-study-{int(t * 100):02d}.png"
            Image.fromarray(trial, "RGBA").save(OUT / name)
            frame_list.append((f"candidate {int(t * 100)}%", trial))
            candidates.append(name)
        frame_list.append(("original 1", b))
        sheet(state, frame_list)
        manifest["states"][state] = candidates
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2),
                                       encoding="utf-8")
    print("Created candidate-only pose studies in", OUT)


if __name__ == "__main__":
    main()
