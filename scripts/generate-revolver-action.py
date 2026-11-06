#!/usr/bin/env python3
"""Build a restrained single-revolver action from the approved aligned A-type art.

Sequence: Idle -> draw at waist -> aim right -> subtle arm recoil ->
           aim recovery -> return to holster -> approved Idle.

Only the recoil pose is locally warped, with a feathered field on the existing
approved right aiming arm and handgun. No new weapon, victim, or target is drawn.
The sizeable draw/aim/holster changes remain honest pose cuts until intermediate
approved hand-drawn art exists. Never claim these are complete joint animations.
Never modify an original source or any existing aligned sprite.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Final

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT: Final = Path(__file__).resolve().parents[1]
DERIVED: Final = ROOT / "src/characters/derived/akila"
OUT: Final = DERIVED / "revolver_action"
REVIEW: Final = ROOT / "artifacts/revolver-action-review"
SIZE: Final = (1600, 1024)  # height, width

INPUTS: Final = {
    "idle": ("idle/000.png", "2399e228fe1231fe798853070630609446c7e079"),
    "draw": ("drawing/000.png", "f32bfd4d864c3d3c00123a5a948cb90751cd3a81"),
    "aim": ("firing/000.png", "d636e902ea865cceb51239e8fb5d3365eea75a32"),
}
LABELS: Final = [
    "approved Idle",
    "approved holster draw",
    "approved revolver aim",
    "local wrist/arm recoil",
    "approved aim recovery",
    "approved holster return",
    "approved Idle return",
]


def blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def read_approved() -> tuple[dict[str, np.ndarray], dict[str, bytes]]:
    images: dict[str, np.ndarray] = {}
    sources: dict[str, bytes] = {}
    for key, (path, expected_sha) in INPUTS.items():
        full = DERIVED / path
        encoded = full.read_bytes()
        assert blob_sha(encoded) == expected_sha, "Approved aligned pose changed: " + path
        rgba = np.asarray(Image.open(full).convert("RGBA"), dtype=np.uint8)
        assert rgba.shape == (*SIZE, 4), "Approved art alignment differs: " + path
        images[key] = rgba
        sources[key] = encoded
    return images, sources


def recoil_only_forearm(approved: np.ndarray) -> np.ndarray:
    # A small optical displacement of already drawn pixels only. Do not blend
    # separate poses (which previously caused ghost hands and doubled weapons).
    x0, y0, x1, y1 = (565, 515, 1024, 915)
    original_roi = approved[y0:y1, x0:x1]
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    hand = np.exp(-0.5 * ((xx - 777) / 154)**2
                  -0.5 * ((yy - 716) / 120)**2)
    barrel = np.exp(-0.5 * ((xx - 887) / 115)**2
                    -0.5 * ((yy - 614) / 105)**2)
    dx = -10 * hand - 12 * barrel
    dy = -7 * hand - 9 * barrel
    warped = cv2.remap(
        original_roi, (xx-x0-dx).astype(np.float32),
        (yy-y0-dy).astype(np.float32), cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_REPLICATE)
    border = np.minimum(
        np.minimum(xx-x0, x1-1-xx),
        np.minimum(yy-y0, y1-1-yy))
    mask = np.clip(border / 24, 0, 1)[..., None]
    candidate = approved.copy()
    candidate[y0:y1, x0:x1] = np.clip(
        original_roi * (1-mask) + warped * mask,
        0, 255).astype(np.uint8)

    changed = np.any(candidate != approved, axis=2)
    outside = changed.copy()
    outside[y0:y1, x0:x1] = False
    assert not outside.any(), "Recoil unexpectedly changed protected pixels"
    assert np.array_equal(candidate[:515], approved[:515]), "Face/hair must be fixed"
    n = int(changed.sum())
    assert 1000 < n < 175000, "Recoil distorted too much or was not generated"
    return candidate


def comparison_sheet(frames: list[np.ndarray]) -> None:
    tile_width, tile_height = 260, 440
    picture = Image.new("RGB", (tile_width*len(frames), tile_height+28), "#303f4d")
    draw = ImageDraw.Draw(picture)
    for i, frame in enumerate(frames):
        sprite = Image.fromarray(frame, "RGBA")
        sprite.thumbnail((tile_width - 10, tile_height - 15))
        backdrop = Image.new("RGBA", (tile_width, tile_height), "#303f4d")
        backdrop.alpha_composite(sprite,
                                 ((tile_width-sprite.width)//2,
                                  (tile_height-sprite.height)//2))
        picture.paste(backdrop.convert("RGB"), (i*tile_width, 28))
        draw.text((i*tile_width+8, 7), f"{i:03d} {LABELS[i]}", fill="white")
    picture.save(REVIEW / "revolver-action-sheet.jpg", quality=94)


def main() -> None:
    originals, encoded = read_approved()
    recoil = recoil_only_forearm(originals["aim"])
    sequence = [
        originals["idle"], originals["draw"], originals["aim"],
        recoil, originals["aim"], originals["draw"], originals["idle"],
    ]
    OUT.mkdir(parents=True, exist_ok=True)
    REVIEW.mkdir(parents=True, exist_ok=True)
    for i, rgba in enumerate(sequence):
        Image.fromarray(rgba, "RGBA").save(OUT / f"{i:03d}.png", optimize=True)
    comparison_sheet(sequence)
    for key, (path, _) in INPUTS.items():
        assert (DERIVED / path).read_bytes() == encoded[key], "Source modified: " + key

    manifest = {
        "art_status": "STYLIZED_KEY_POSE_CUTS_WITH_LOCAL_RECOIL",
        "runtime_integration_requires_qa": True,
        "source_poses_sha1": {k: blob_sha(v) for k,v in encoded.items()},
        "sources_unchanged": True,
        "resolution": [1024, 1600],
        "frames": LABELS,
        "animated_subject": "Akila with one revolver, no person/target in scene",
        "known_limits": [
            "Drawing and holstering are pose cuts, not fully articulated arm motion",
            "Only recoil is a tiny real localized motion",
            "The muzzle burst is an existing CSS UI effect, not embedded in art",
        ],
    }
    (REVIEW / "report.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"frames": len(sequence), "status": manifest["art_status"]}))


if __name__ == "__main__":
    main()
