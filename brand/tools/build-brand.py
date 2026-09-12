#!/usr/bin/env python3
"""Regenerate the entire Ledger brand kit from the geometry defined here.

SVGs ARE THE SOURCE OF TRUTH. PNGs are derived from them by rendering.
Never hand-edit either — change the geometry in this file (or the wordmark in
extract-wordmark.py) and re-run.

    python3 brand/tools/build-brand.py              # everything
    python3 brand/tools/build-brand.py --svg-only   # skip all raster output

Requires nothing to write the SVGs. PNG output additionally needs headless
Chromium and Pillow; if either is missing the script writes the SVGs, reports
what it skipped, and exits 0 rather than failing the build.
"""
from __future__ import annotations

import argparse
import shutil
import struct
import subprocess
import sys
import tempfile
from glob import glob
from pathlib import Path

BRAND = Path(__file__).resolve().parents[1]
LOGO, ICONS, SOCIAL = BRAND / "logo", BRAND / "icons", BRAND / "social"

# --- palette. Monochrome by design; there is no accent colour. ---------------
INK = "#000000"
PAPER = "#FFFFFF"

# --- the mark ----------------------------------------------------------------
# Brackets closing on three stock rows: brackets bound and verify, rows are
# what was counted.
BRACKET_L = "M22 14 H12 V50 H22"
BRACKET_R = "M42 14 H52 V50 H42"
STROKE_W = "4.5"

# Three rows, for 32px and above.
ROWS = [
    dict(x=22, y=23, w=20, h=4.6, rx=2.3, opacity=None),
    dict(x=22, y=30.2, w=13, h=4.6, rx=2.3, opacity=".38"),
    dict(x=22, y=37.4, w=16, h=4.6, rx=2.3, opacity=None),
]
# Small-size cut: below 32px three rows blur together, so use two thicker ones.
ROWS_SMALL = [
    dict(x=21, y=24, w=22, h=6, rx=3, opacity=None),
    dict(x=21, y=34, w=15, h=6, rx=3, opacity=None),
]

# NOTE ON SCOPING: an inline <style> inside an SVG is NOT scoped to that SVG —
# when the markup is pasted into a page, its rules apply to the whole document.
# The bare selectors .row/.bl/.br collide with common host-page classes (a
# Bootstrap .row, any grid), and the collision is silent and severe: the host's
# elements inherit scaleX(0) and vanish. Every selector is therefore qualified
# with .ledger-anim, which is set on the root <svg>. Class names, keyframes and
# timing are otherwise exactly as specified.
ANIM_ROOT_CLASS = "ledger-anim"
ANIM_CSS = """  .ledger-anim .bl,.ledger-anim .br{animation:lg-bl 3s cubic-bezier(.22,.68,.28,1) infinite}
  .ledger-anim .br{animation-name:lg-br}
  .ledger-anim .row{transform-origin:22px center;animation:lg-row 3s cubic-bezier(.22,.68,.28,1) infinite}
  .ledger-anim .r2{animation-delay:.12s}.ledger-anim .r3{animation-delay:.24s}
  @keyframes lg-bl{0%{transform:translateX(-14px);opacity:0}14%,86%{transform:translateX(0);opacity:1}100%{transform:translateX(-14px);opacity:0}}
  @keyframes lg-br{0%{transform:translateX(14px);opacity:0}14%,86%{transform:translateX(0);opacity:1}100%{transform:translateX(14px);opacity:0}}
  @keyframes lg-row{0%,12%{transform:scaleX(0)}30%,86%{transform:scaleX(1)}100%{transform:scaleX(0)}}
  @media (prefers-reduced-motion:reduce){.ledger-anim .bl,.ledger-anim .br,.ledger-anim .row{animation:none}}"""


def num(v) -> str:
    """Trim trailing zeros so the SVG source stays readable."""
    s = f"{float(v):.4f}".rstrip("0").rstrip(".")
    return s if s else "0"


def mark_body(fg: str, small: bool = False, animated: bool = False, indent: str = "  ") -> str:
    bl = ' class="bl"' if animated else ""
    br = ' class="br"' if animated else ""
    stroke = (
        f'fill="none" stroke="{fg}" stroke-width="{STROKE_W}" '
        'stroke-linecap="round" stroke-linejoin="round"'
    )
    out = [
        f'{indent}<path{bl} d="{BRACKET_L}" {stroke}/>',
        f'{indent}<path{br} d="{BRACKET_R}" {stroke}/>',
    ]
    for i, r in enumerate(small and ROWS_SMALL or ROWS, start=1):
        cls = f' class="row r{i}"' if animated else ""
        op = f' opacity="{r["opacity"]}"' if r["opacity"] else ""
        out.append(
            f'{indent}<rect{cls} x="{num(r["x"])}" y="{num(r["y"])}" '
            f'width="{num(r["w"])}" height="{num(r["h"])}" rx="{num(r["rx"])}" '
            f'fill="{fg}"{op}/>'
        )
    return "\n".join(out)


def svg_open(w, h, vb: str, title: str, *, animated: bool = False) -> str:
    cls = f' class="{ANIM_ROOT_CLASS}"' if animated else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg"{cls} width="{num(w)}" height="{num(h)}" '
        f'viewBox="{vb}" role="img" aria-label="{title}">\n'
        f"  <title>{title}</title>"
    )


def style_block() -> str:
    return f"  <style>\n{ANIM_CSS}\n  </style>"


def svg_mark(fg: str, *, small=False, animated=False, bg: str | None = None) -> str:
    parts = [svg_open(64, 64, "0 0 64 64", "Ledger", animated=animated)]
    if animated:
        parts.append(style_block())
    if bg:
        parts.append(f'  <rect width="64" height="64" fill="{bg}"/>')
    parts.append(mark_body(fg, small=small, animated=animated))
    parts.append("</svg>\n")
    return "\n".join(parts)


def svg_favicon(fg: str, bg: str, *, bordered: bool) -> str:
    """Small-size cut on a solid tile."""
    parts = [svg_open(64, 64, "0 0 64 64", "Ledger")]
    if bordered:
        # A pure-white tile disappears against a white browser UI.
        parts.append(
            f'  <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.5" '
            f'fill="{bg}" stroke="{INK}" stroke-width="1.5"/>'
        )
    else:
        parts.append(f'  <rect width="64" height="64" rx="14" fill="{bg}"/>')
    parts.append(mark_body(fg, small=True))
    parts.append("</svg>\n")
    return "\n".join(parts)


def svg_icon_tile(fg: str, bg: str, *, small: bool) -> str:
    """The square app-icon treatment: hairline-bordered tile, mark at 0.84."""
    parts = [
        svg_open(64, 64, "0 0 64 64", "Ledger"),
        f'  <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.5" '
        f'fill="{bg}" stroke="{INK}" stroke-width="1.5"/>',
        '  <g transform="translate(32 32) scale(0.84) translate(-32 -32)">',
        mark_body(fg, small=small, indent="    "),
        "  </g>",
        "</svg>\n",
    ]
    return "\n".join(parts)


def lockup_geometry() -> tuple[float, float, float]:
    """Scale and baseline for the wordmark inside the 300x80 lockup."""
    s = 34 / 723                      # cap height 34px against the 723 ascender
    base = (80 - (34 + 182 * s)) / 2 + 34   # 182 = descender
    tx = 76 - 65 * s                  # 65 = glyph left bearing
    return s, base, tx


def svg_lockup(fg: str, *, animated=False, bg: str | None = None) -> str:
    wordmark = (LOGO / "wordmark.path").read_text(encoding="utf-8").strip()
    s, base, tx = lockup_geometry()
    parts = [svg_open(300, 80, "0 0 300 80", "Ledger", animated=animated)]
    if animated:
        parts.append(style_block())
    if bg:
        parts.append(f'  <rect width="300" height="80" fill="{bg}"/>')
    parts += [
        '  <g transform="translate(6 12) scale(0.875)">',
        mark_body(fg, animated=animated, indent="    "),
        "  </g>",
        # scale(s, -s) flips the font's y-up coordinates into SVG's y-down.
        f'  <g transform="translate({num(tx)} {num(base)}) scale({num(s)} {num(-s)})">',
        f'    <path d="{wordmark}" fill="{fg}"/>',
        "  </g>",
        "</svg>\n",
    ]
    return "\n".join(parts)


# --- raster ------------------------------------------------------------------
def find_chromium() -> str | None:
    for pattern in ("/opt/pw-browsers/chromium-*/chrome-linux/chrome",):
        hits = sorted(glob(pattern))
        if hits:
            return hits[-1]
    for name in ("chromium", "chromium-browser", "google-chrome", "chrome"):
        found = shutil.which(name)
        if found:
            return found
    return None


def render_html(chrome: str, html: str, out: Path, w: int, h: int) -> bool:
    with tempfile.TemporaryDirectory() as td:
        page = Path(td) / "page.html"
        page.write_text(html, encoding="utf-8")
        proc = subprocess.run(
            [
                chrome, "--headless", "--no-sandbox", "--disable-gpu",
                "--hide-scrollbars", "--force-device-scale-factor=1",
                f"--screenshot={out}", f"--window-size={w},{h}",
                f"file://{page}",
            ],
            capture_output=True, text=True,
        )
        if not out.exists():
            print(f"  ! chromium failed for {out.name}: {proc.stderr.strip()[:200]}")
            return False
        return True


def page_for_svg(svg: str, w: int, h: int, bg: str = PAPER) -> str:
    return (
        "<!doctype html><meta charset=utf-8>"
        f"<style>html,body{{margin:0;padding:0;background:{bg}}}"
        f"svg{{display:block;width:{w}px;height:{h}px}}</style>{svg}"
    )


def write_ico(pngs: list[Path], out: Path) -> None:
    """Multi-resolution .ico with PNG-compressed entries (16/32/48)."""
    blobs = [p.read_bytes() for p in pngs]
    sizes = [16, 32, 48][: len(blobs)]
    header = struct.pack("<HHH", 0, 1, len(blobs))
    offset = 6 + 16 * len(blobs)
    entries, data = b"", b""
    for size, blob in zip(sizes, blobs):
        entries += struct.pack(
            "<BBBBHHII", size if size < 256 else 0, size if size < 256 else 0,
            0, 0, 1, 32, len(blob), offset,
        )
        data += blob
        offset += len(blob)
    out.write_bytes(header + entries + data)


def social_page(svg_lockup_markup: str, tagline: str, w: int, h: int, pad: int, logo_w: int) -> str:
    return f"""<!doctype html><meta charset=utf-8>
<style>
  html,body{{margin:0;padding:0;width:{w}px;height:{h}px;background:{PAPER}}}
  .wrap{{box-sizing:border-box;width:{w}px;height:{h}px;padding:{pad}px;
        display:flex;flex-direction:column;justify-content:center;align-items:flex-start}}
  .logo{{width:{logo_w}px;height:{round(logo_w * 80 / 300)}px}}
  .logo svg{{display:block;width:100%;height:100%}}
  p{{margin:{round(pad * 0.45)}px 0 0;opacity:.55;color:{INK};
     font-family:"Archivo",system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;
     font-size:{round(logo_w * 0.082)}px;line-height:1.35;font-weight:500;
     letter-spacing:-0.01em;max-width:{w - pad * 2}px}}
</style>
<div class="wrap"><div class="logo">{svg_lockup_markup}</div><p>{tagline}</p></div>"""


OG_TAGLINE = "Photograph an invoice. Know in seconds if a store is actually stocked."
BANNER_TAGLINE = "Invoice photo &rarr; classified stock &rarr; pass / fail, in one scan."


def main() -> int:
    ap = argparse.ArgumentParser(description="Regenerate the Ledger brand kit.")
    ap.add_argument("--svg-only", action="store_true", help="write SVGs and stop")
    args = ap.parse_args()

    for d in (LOGO, ICONS, SOCIAL):
        d.mkdir(parents=True, exist_ok=True)

    if not (LOGO / "wordmark.path").exists():
        print("Missing brand/logo/wordmark.path — run extract-wordmark.py first.", file=sys.stderr)
        return 1

    # --- SVGs (source of truth) ---
    svgs = {
        "ledger-mark.svg": svg_mark(INK),
        "ledger-mark-inverse.svg": svg_mark(PAPER),
        "ledger-mark-animated.svg": svg_mark(INK, animated=True),
        "ledger-lockup.svg": svg_lockup(INK),
        "ledger-lockup-inverse.svg": svg_lockup(PAPER),
        "ledger-lockup-animated.svg": svg_lockup(INK, animated=True),
        "favicon.svg": svg_favicon(INK, PAPER, bordered=True),
        "favicon-inverse.svg": svg_favicon(PAPER, INK, bordered=False),
    }
    for name, content in svgs.items():
        (LOGO / name).write_text(content, encoding="utf-8")
    print(f"SVG  wrote {len(svgs)} files to {LOGO.relative_to(BRAND.parent)}")

    if args.svg_only:
        print("--svg-only: skipping all raster output.")
        return 0

    skipped = []
    chrome = find_chromium()
    if not chrome:
        skipped.append("headless Chromium not found — no PNG/ICO output")
    try:
        from PIL import Image
    except ImportError:
        Image = None
        skipped.append("Pillow not installed — no PNG resizing, no .ico")

    if not chrome or Image is None:
        for s in skipped:
            print(f"SKIP {s}")
        print("SVGs are written and current. Exiting 0.")
        return 0

    print(f"PNG  chromium: {chrome}")
    tile_big = svg_icon_tile(INK, PAPER, small=False)
    tile_small = svg_icon_tile(INK, PAPER, small=True)

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        master = ICONS / "icon-master-1024.png"
        if not render_html(chrome, page_for_svg(tile_big, 1024, 1024), master, 1024, 1024):
            return 1
        small_master = tmp / "small-1024.png"
        render_html(chrome, page_for_svg(tile_small, 1024, 1024), small_master, 1024, 1024)

        big = Image.open(master).convert("RGBA")
        small = Image.open(small_master).convert("RGBA")

        # 16 and 32 use the small-size cut; everything larger uses three rows.
        for size in (16, 32, 48, 64, 180, 192, 512):
            src = small if size <= 32 else big
            src.resize((size, size), Image.LANCZOS).save(ICONS / f"icon-{size}.png")
        shutil.copyfile(ICONS / "icon-180.png", ICONS / "apple-touch-icon-180.png")
        write_ico([ICONS / "icon-16.png", ICONS / "icon-32.png", ICONS / "icon-48.png"],
                  ICONS / "favicon.ico")
        print(f"PNG  wrote 8 icons + apple-touch-icon + favicon.ico")

        # --- social ---
        big.resize((512, 512), Image.LANCZOS).save(SOCIAL / "avatar-512.png")
        lock = svgs["ledger-lockup.svg"]
        cards = [
            ("social-preview-1280x640.png", 1280, 640, 96, 420, OG_TAGLINE),
            ("og-image-1200x630.png", 1200, 630, 90, 400, OG_TAGLINE),
            ("readme-banner-1600x400.png", 1600, 400, 72, 360, BANNER_TAGLINE),
        ]
        for name, w, h, pad, logo_w, tag in cards:
            render_html(chrome, social_page(lock, tag, w, h, pad, logo_w), SOCIAL / name, w, h)
        print(f"PNG  wrote avatar + {len(cards)} social cards")

    print("\nDone. SVGs are the source of truth; PNGs are derived. Never hand-edit either.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
