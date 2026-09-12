#!/usr/bin/env python3
"""Derive the Ledger wordmark outline from Archivo SemiBold.

The wordmark is lowercase "ledger" in Archivo SemiBold (SIL OFL), tracked
-38/1000 em and converted to outlines so rendering never depends on a font
being installed.

The path data is DERIVED here, never hand-typed, and the result is committed
to brand/logo/wordmark.path so the normal build needs no network access.

    python3 brand/tools/extract-wordmark.py

Re-run this only to change the word, the weight, or the tracking.
"""
from __future__ import annotations

import io
import re
import sys
import urllib.request
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

WORD = "ledger"
TRACKING = -38  # font units per 1000 em
CSS_URL = "https://fonts.googleapis.com/css2?family=Archivo:wght@600&display=swap"

# Google Fonts content-negotiates on User-Agent:
#   modern Chrome  -> woff2 (needs brotli to read)
#   older Firefox  -> woff
#   MSIE 6         -> EOT (not a font fontTools can open)
#   bare Mozilla/5.0 -> plain TTF, which is what we want.
LEGACY_UA = "Mozilla/5.0"

OUT_PATH = Path(__file__).resolve().parents[1] / "logo" / "wordmark.path"

# Sanity bounds — a wrong glyph lookup yields garbage, and garbage that still
# writes a file is worse than a hard failure.
EXPECTED_CHARS = 3017
EXPECTED_ADVANCE = 2729
CHAR_TOLERANCE = 0.02  # 2%


def fetch(url: str, accept_ua: str = LEGACY_UA) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": accept_ua})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def resolve_ttf_url() -> str:
    css = fetch(CSS_URL).decode("utf-8")
    urls = re.findall(r"src:\s*url\(([^)]+)\)", css)
    if not urls:
        raise SystemExit("Could not find any src: url(...) in the Google Fonts CSS.")
    ttf = [u for u in urls if u.endswith(".ttf")]
    if not ttf:
        raise SystemExit(
            f"Google Fonts returned no .ttf (got {urls[:2]}). "
            f"Check that the {LEGACY_UA!r} user-agent still negotiates TTF."
        )
    return ttf[0]


def build_wordmark(font: TTFont) -> tuple[str, int]:
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()

    commands: list[str] = []
    x = 0
    for index, ch in enumerate(WORD):
        # Tracking sits BETWEEN letters, so it is applied before every glyph
        # except the first. Adding it after the last one too would tack phantom
        # space onto the end of the word (and inflate the total advance by 38).
        if index:
            x += TRACKING
        code = ord(ch)
        if code not in cmap:
            raise SystemExit(f"Font has no glyph for {ch!r}.")
        glyph = glyph_set[cmap[code]]

        pen = SVGPathPen(glyph_set)
        # Translate each glyph by the running advance so one path holds the word.
        glyph.draw(TransformPen(pen, (1, 0, 0, 1, x, 0)))
        cmds = pen.getCommands()
        if cmds:
            commands.append(cmds)

        x += glyph.width

    return " ".join(commands), x


def main() -> int:
    print(f"Resolving Archivo SemiBold from {CSS_URL}")
    ttf_url = resolve_ttf_url()
    print(f"  ttf: {ttf_url}")

    raw = fetch(ttf_url)
    if raw[:4] not in (b"\x00\x01\x00\x00", b"true", b"OTTO"):
        raise SystemExit(
            f"Downloaded data is not a TrueType/OpenType font "
            f"(magic {raw[:4].hex()}); got the wrong format from content negotiation."
        )
    font = TTFont(io.BytesIO(raw))
    upem = font["head"].unitsPerEm
    print(f"  unitsPerEm: {upem}")

    path, advance = build_wordmark(font)
    print(f"  glyphs: {len(WORD)}  chars: {len(path)}  total advance: {advance}")

    # Verify before writing — do not commit something wrong.
    problems = []
    if advance != EXPECTED_ADVANCE:
        problems.append(f"total advance {advance} != expected {EXPECTED_ADVANCE}")
    if abs(len(path) - EXPECTED_CHARS) > EXPECTED_CHARS * CHAR_TOLERANCE:
        problems.append(f"path length {len(path)} is far from expected {EXPECTED_CHARS}")
    if not path.startswith("M"):
        problems.append("path does not start with a moveto")
    if problems:
        print("\nREFUSING TO WRITE — sanity check failed:", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(path, encoding="utf-8")
    print(f"\nWrote {OUT_PATH} ({len(path)} chars)")
    print("Commit this file — the normal build reads it and needs no network.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
