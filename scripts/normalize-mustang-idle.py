#!/usr/bin/env python3
"""Technical alpha cleanup and transparent-canvas alignment only.

Never regenerate/repaint the face, outfit, weapons, or proportions.
This is a NON-APPROVED candidate: art approval and the other B poses are pending.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src/characters/candidates/akila_mustang/idle-gate1b-unapproved.png"
DST = ROOT / "src/characters/candidates/akila_mustang/idle-gate1b-alpha-cleanup-unapproved.png"
REPORT = ROOT / "artifacts/mustang-alpha-cleanup"
SHA256 = "012043303e590db54a6e58efbd1dba37dcac074a6331e0fbda44a288e045ac1d"
LO, HI = 35, 246
PAD_Y = 32


def main():
    content = SRC.read_bytes()
    assert hashlib.sha256(content).hexdigest() == SHA256, "Source changed: review new art before processing"
    original = np.asarray(Image.open(SRC).convert("RGBA"), dtype=np.uint8)
    assert original.shape == (1536, 1024, 4)
    alpha = original[:, :, 3].astype(np.float32)
    cleaned_alpha = np.clip((alpha - LO) * (255.0 / (HI - LO)), 0, 255).astype(np.uint8)
    updated = original.copy()
    updated[:, :, 3] = cleaned_alpha
    updated[cleaned_alpha == 0, :3] = 0
    sprite = Image.fromarray(updated, "RGBA")
    canvas = Image.new("RGBA", (1024, 1600), (0, 0, 0, 0))
    canvas.alpha_composite(sprite, (0, PAD_Y))
    DST.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(DST, optimize=True)

    # Automated artifact-only QC, not artistic acceptance.
    result = np.asarray(canvas)
    assert result.shape == (1600, 1024, 4)
    assert not np.any(result[:PAD_Y, :, 3])
    assert not np.any(result[PAD_Y + 1536:, :, 3])
    visible = updated[:, :, 3] > 0
    assert np.array_equal(original[:, :, :3][visible], updated[:, :, :3][visible])
    assert int((result[:, :, 3] == 255).sum()) > 400000
    assert int(((result[:, :, 3] > 0) & (result[:, :, 3] < 255)).sum()) < 15000

    def checker(image, w, h):
        bg = Image.new("RGBA", (w, h), "#d4dae2")
        draw = ImageDraw.Draw(bg)
        for y in range(0, h, 18):
            for x in range(0, w, 18):
                if (x // 18 + y // 18) % 2:
                    draw.rectangle((x, y, x + 17, y + 17), fill="#9eabb9")
        overlay = image.copy()
        overlay.thumbnail((w - 12, h - 12), Image.Resampling.LANCZOS)
        bg.alpha_composite(overlay, ((w - overlay.width) // 2, (h - overlay.height) // 2))
        return bg.convert("RGB")

    REPORT.mkdir(parents=True, exist_ok=True)
    source_pic = Image.open(SRC).convert("RGBA")
    comparison = Image.new("RGB", (760, 636), "#222833")
    d = ImageDraw.Draw(comparison)
    for i, (pic, title) in enumerate([
        (source_pic, "Original Gate 1B - unapproved"),
        (canvas, "Alpha + canvas cleanup - unapproved"),
    ]):
        comparison.paste(checker(pic, 380, 600), (i * 380, 36))
        d.text((i * 380 + 8, 12), title, fill="white")
    comparison.save(REPORT / "before-after.jpg", quality=94)

    metadata = {
        "status": "TECHNICAL_CLEANUP_NOT_DESIGN_APPROVAL",
        "source_sha256": SHA256,
        "output_sha256": hashlib.sha256(DST.read_bytes()).hexdigest(),
        "original_dimensions": [1024, 1536],
        "aligned_canvas": [1024, 1600],
        "transparent_top_bottom_px": [32, 32],
        "nonuniform_resizing": False,
        "alpha_transfer": {"low_cutoff": LO, "opaque_at_or_above": HI},
        "opaque_pixels": int((result[:, :, 3] == 255).sum()),
        "partially_transparent_pixels": int(((result[:, :, 3] > 0) & (result[:, :, 3] < 255)).sum()),
        "original_colors_preserved_where_visible": True,
        "open_design_issues": [
            "face, hands, shearling and silhouette fidelity to current Mustang Idle candidate",
            "smoking-specific cigarette pose not yet authored",
            "visual approval of hair, shearling and hands",
            "consistent B-style animations for all states",
        ],
    }
    (REPORT / "report.json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=False))


if __name__ == "__main__":
    main()
