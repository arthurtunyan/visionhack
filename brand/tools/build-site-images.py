#!/usr/bin/env python3
"""Render the 12 site images for the Ledger Framer site.

These are DESIGNED UI MOCKUPS, not screen captures of a running app — the
repository ships an API only, so there is no live UI to photograph. They are
built from the Ledger brand system (Archivo, black/blue/white) so the site reads
as one product.

Each file is rendered at 2x through headless Chromium and downsampled to its
target size with Pillow, so text stays crisp at the size Framer actually uses.

    python3 brand/tools/build-site-images.py            # all 12
    python3 brand/tools/build-site-images.py 01 05 12   # only these

Output: brand/site/. Never hand-edit the PNGs — change the templates here.
"""
from __future__ import annotations

import subprocess
import sys
import tempfile
from glob import glob
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "brand" / "site"
FONTS = Path(__file__).resolve().parent / "fonts"

INK = "#000000"
BLUE = "#1B4DFF"
PAPER = "#FFFFFF"
MUTE = "#6B6B6B"
LINE = "#E6E6E6"
WASH = "#F6F7F9"

STORE = "Corner Market #17"

# Slack for Chromium's browser-chrome offset in --window-size (~88px).
VIEWPORT_HEADROOM = 200


def font_face() -> str:
    out = []
    for w in (400, 500, 600, 700):
        out.append(
            f"@font-face{{font-family:'Archivo';font-style:normal;font-weight:{w};"
            f"src:url('file://{FONTS}/Archivo-{w}.ttf') format('truetype');}}"
        )
    return "".join(out)


def mark(size: int, bracket: str = BLUE, row: str = INK, small: bool = False) -> str:
    """The Ledger mark: brackets closing on stock rows.

    `small` selects the brand kit's two-row cut, which is the one that survives
    16-32px — three rows mush together at favicon size.
    """
    st = (f'fill="none" stroke="{bracket}" stroke-width="4.5" '
          'stroke-linecap="round" stroke-linejoin="round"')
    if small:
        rows = (f'<rect x="21" y="24" width="22" height="6" rx="3" fill="{row}"/>'
                f'<rect x="21" y="34" width="15" height="6" rx="3" fill="{row}"/>')
    else:
        rows = (f'<rect x="22" y="23" width="20" height="4.6" rx="2.3" fill="{row}"/>'
                f'<rect x="22" y="30.2" width="13" height="4.6" rx="2.3" fill="{row}" opacity=".38"/>'
                f'<rect x="22" y="37.4" width="16" height="4.6" rx="2.3" fill="{row}"/>')
    return (
        f'<svg width="{size}" height="{size}" viewBox="0 0 64 64" '
        f'xmlns="http://www.w3.org/2000/svg" style="display:block">'
        f'<path d="M22 14 H12 V50 H22" {st}/><path d="M42 14 H52 V50 H42" {st}/>'
        f'{rows}</svg>'
    )


def wordmark(px: int, color: str = INK) -> str:
    path = (ROOT / "brand" / "logo" / "wordmark.path").read_text().strip()
    s = px / 723
    return (
        f'<svg width="{2729 * s:.1f}" height="{px * 1.26:.1f}" '
        f'viewBox="0 0 {2729} {905}" xmlns="http://www.w3.org/2000/svg" style="display:block">'
        f'<g transform="translate(-65 723) scale(1 -1)">'
        f'<path d="{path}" fill="{color}"/></g></svg>'
    )


def lockup(px: int, color: str = INK) -> str:
    return (
        f'<div style="display:flex;align-items:center;gap:{px*0.42:.0f}px">'
        f'{mark(int(px * 1.55), BLUE, color)}{wordmark(px, color)}</div>'
    )


BASE = f"""
{font_face()}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:'Archivo',system-ui,sans-serif;color:{INK};background:{PAPER};
  -webkit-font-smoothing:antialiased}}
.pill{{display:inline-flex;align-items:center;gap:7px;border-radius:999px;
  padding:6px 13px;font-size:13px;font-weight:600;letter-spacing:-.01em;white-space:nowrap}}
.ok{{background:#EAF0FF;color:{BLUE}}}
.warn{{background:#FFF3E0;color:#8A5300}}
.bad{{background:#FFECEC;color:#B3261E}}
.dot{{width:7px;height:7px;border-radius:50%;background:currentColor}}
.card{{border:1px solid {LINE};border-radius:16px;background:{PAPER}}}
.mute{{color:{MUTE}}}
.h1{{font-weight:700;letter-spacing:-.03em}}
.h2{{font-weight:600;letter-spacing:-.02em}}
"""


def page(body: str, w: int, h: int, extra: str = "") -> str:
    return (f"<!doctype html><meta charset=utf-8><style>{BASE}{extra}"
            f"html,body{{width:{w}px;height:{h}px;overflow:hidden}}</style>{body}")


# --- shared data -------------------------------------------------------------
# The scenario lives in site_kit so every mock in the repo agrees on the numbers.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from site_kit import LICENSES  # noqa: E402


def sidebar() -> str:
    items = ["Dashboard", "Licenses", "Requirements", "Inspections", "Settings"]
    rows = "".join(
        f'<div style="padding:11px 14px;border-radius:10px;font-size:15px;font-weight:'
        f'{"600" if i == 0 else "500"};color:{INK if i == 0 else MUTE};'
        f'background:{WASH if i == 0 else "transparent"}">{n}</div>'
        for i, n in enumerate(items)
    )
    return (
        f'<aside style="width:248px;flex:0 0 248px;border-right:1px solid {LINE};'
        f'padding:28px 18px;display:flex;flex-direction:column;gap:28px">'
        f'<div style="padding-left:6px">{lockup(22)}</div>'
        f'<nav style="display:flex;flex-direction:column;gap:4px">{rows}</nav></aside>'
    )


def ring(pct: int, size: int = 132, color: str = BLUE, sub: str = "ready") -> str:
    r = 54
    c = 2 * 3.14159 * r
    off = c * (1 - pct / 100)
    return (
        f'<svg width="{size}" height="{size}" viewBox="0 0 128 128" style="display:block">'
        f'<circle cx="64" cy="64" r="{r}" fill="none" stroke="{LINE}" stroke-width="13"/>'
        f'<circle cx="64" cy="64" r="{r}" fill="none" stroke="{color}" stroke-width="13"'
        f' stroke-linecap="round" stroke-dasharray="{c:.1f}" stroke-dashoffset="{off:.1f}"'
        f' transform="rotate(-90 64 64)"/>'
        f'<text x="64" y="60" text-anchor="middle" font-family="Archivo" font-size="30"'
        f' font-weight="700" fill="{INK}" letter-spacing="-1">{pct}%</text>'
        f'<text x="64" y="80" text-anchor="middle" font-family="Archivo" font-size="12"'
        f' font-weight="500" fill="{MUTE}">{sub}</text></svg>'
    )


def license_row(name, cls, status, note, compact=False) -> str:
    pad = "14px 18px" if compact else "18px 22px"
    return (
        f'<div style="display:flex;align-items:center;justify-content:space-between;'
        f'gap:16px;padding:{pad};border-bottom:1px solid {LINE}">'
        f'<div style="min-width:0"><div class=h2 style="font-size:{15 if compact else 17}px">'
        f'{name}</div><div class=mute style="font-size:{12 if compact else 13}px;'
        f'margin-top:3px;font-weight:500">{note}</div></div>'
        f'<span class="pill {cls}"><span class=dot></span>{status}</span></div>'
    )


# --- the twelve --------------------------------------------------------------
def img_01_hero() -> tuple[str, int, int]:
    rows = "".join(license_row(*l) for l in LICENSES)
    return page(f"""
<div style="display:flex;height:992px">{sidebar()}
 <main style="flex:1;padding:30px 34px;display:flex;flex-direction:column;gap:24px;min-width:0">
  <div style="display:flex;align-items:flex-start;justify-content:space-between">
   <div><div class=h1 style="font-size:31px">{STORE}</div>
    <div class=mute style="font-size:15px;margin-top:5px;font-weight:500">
     4520 Sunset Blvd, Los Angeles &middot; last scan 2 hours ago</div></div>
   <span class="pill warn" style="font-size:14px"><span class=dot></span>Not inspection ready</span>
  </div>
  <div style="display:flex;gap:18px">
   <div class=card style="flex:0 0 300px;padding:24px;display:flex;align-items:center;gap:20px">
    {ring(75, 132, "#B3261E", "3 of 4")}
    <div><div class=h2 style="font-size:16px">Readiness</div>
     <div class=mute style="font-size:13px;margin-top:4px;font-weight:500;line-height:1.45">
      Produce is short<br>of 3 varieties</div></div></div>
   <div class=card style="flex:1;padding:24px;display:flex;flex-direction:column;justify-content:center;gap:14px">
    <div class=h2 style="font-size:16px">Next deadlines</div>
    <div style="display:flex;flex-direction:column;gap:11px">
     <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:500">
      <span>Add 2 produce varieties</span><span style="color:#B3261E;font-weight:600">blocks review</span></div>
     <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:500">
      <span>County Health Permit renewal</span><span style="color:#B3261E;font-weight:600">overdue 15 days</span></div>
     <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:500">
      <span>WIC shelf price list</span><span style="color:#8A5300;font-weight:600">9 days</span></div>
    </div></div>
  </div>
  <div class=card style="overflow:hidden">
   <div style="padding:18px 22px;border-bottom:1px solid {LINE};display:flex;
     justify-content:space-between;align-items:center">
    <div class=h2 style="font-size:17px">Licenses &amp; permits</div>
    <div class=mute style="font-size:13px;font-weight:500">6 tracked</div></div>
   {rows}</div>
  <div class=card style="padding:22px;display:flex;align-items:center;gap:18px;background:{WASH};border:none">
   {mark(40)}
   <div><div class=h2 style="font-size:16px">Scan a delivery invoice</div>
   <div class=mute style="font-size:13px;margin-top:3px;font-weight:500">
    Photograph it and Ledger counts stocking units against your requirements.</div></div></div>
 </main></div>""", 1400, 992), 1400, 992


def step_shell(title: str, sub: str, inner: str) -> str:
    return page(f"""
<div style="padding:44px;height:907px;display:flex;flex-direction:column;gap:26px">
 <div style="display:flex;align-items:center;gap:12px">{mark(30)}
  <span class=h2 style="font-size:15px;color:{MUTE}">Ledger</span></div>
 <div><div class=h1 style="font-size:32px;line-height:1.15">{title}</div>
  <div class=mute style="font-size:16px;margin-top:8px;font-weight:500">{sub}</div></div>
 {inner}</div>""", 900, 907)


def img_02_step1() -> tuple[str, int, int]:
    def field(label, value, placeholder=False):
        col = MUTE if placeholder else INK
        return (f'<div><div class=mute style="font-size:13px;font-weight:600;margin-bottom:7px">'
                f'{label}</div><div style="border:1px solid {LINE};border-radius:11px;'
                f'padding:15px 16px;font-size:16px;font-weight:500;color:{col}">{value}</div></div>')
    chips = "".join(
        f'<div style="display:flex;align-items:center;gap:10px;border:1px solid {LINE};'
        f'border-radius:11px;padding:13px 15px"><div style="width:7px;height:7px;'
        f'border-radius:50%;background:{BLUE}"></div><span style="font-size:15px;'
        f'font-weight:600">{n}</span><span class=mute style="font-size:13px;margin-left:auto;'
        f'font-weight:500">added</span></div>' for n in
        ["SNAP Authorization", "WIC Vendor Status", "County Health Permit"])
    return step_shell("Enter your licenses", "Once. Ledger tracks them from then on.", f"""
<div class=card style="padding:28px;display:flex;flex-direction:column;gap:20px">
 {field("Store", STORE)}
 {field("License type", "Food Handler Cards")}
 {field("License or permit number", "FH-2026-44781", True)}
 <div style="background:{BLUE};color:{PAPER};border-radius:11px;padding:15px;
   text-align:center;font-size:16px;font-weight:600">Add license</div>
</div>
<div style="display:flex;flex-direction:column;gap:10px">{chips}</div>"""), 900, 907


def img_03_step2() -> tuple[str, int, int]:
    rows = "".join(license_row(*l, compact=True) for l in LICENSES[:5])
    return step_shell("See where you stand", "Every requirement, one screen.", f"""
<div class=card style="padding:26px;display:flex;align-items:center;gap:22px">
 {ring(75, 120, "#B3261E", "3 of 4")}
 <div><div class=h2 style="font-size:19px">Produce is 2 varieties short</div>
  <div class=mute style="font-size:14px;margin-top:6px;font-weight:500;line-height:1.5">
   One permit has lapsed and one filing<br>is due inside the week.</div></div></div>
<div class=card style="overflow:hidden">{rows}</div>"""), 900, 907


def img_04_step3() -> tuple[str, int, int]:
    def task(n, due, urgent=False):
        col = "#B3261E" if urgent else "#8A5300"
        return (f'<div style="display:flex;align-items:center;gap:14px;padding:17px 20px;'
                f'border-bottom:1px solid {LINE}"><div style="width:20px;height:20px;'
                f'border:2px solid {LINE};border-radius:6px;flex:0 0 20px"></div>'
                f'<div style="flex:1;min-width:0"><div class=h2 style="font-size:15px">{n}</div></div>'
                f'<span style="font-size:13px;font-weight:600;color:{col}">{due}</span></div>')
    return step_shell("Fix it before inspection", "Ranked by what closes you down first.", f"""
<div class=card style="overflow:hidden">
 {task("Renew County Health Permit", "overdue 15 days", True)}
 {task("Submit WIC shelf price list", "9 days")}
 {task("Renew 3 food handler cards", "22 days")}
 {task("Re-certify checkout scales", "41 days")}
 {task("File quarterly business tax", "58 days")}
</div>
<div class=card style="padding:22px;background:{WASH};border:none;display:flex;
  align-items:center;gap:16px">{mark(34)}
 <div class=mute style="font-size:14px;font-weight:500;line-height:1.5">
  Ledger re-checks after every scan, so the list<br>is current the day an inspector walks in.</div>
</div>"""), 900, 907


def card_image(title, cls, status, note, detail, w, h, meter=None) -> tuple[str, int, int]:
    """One licence, one card. No readiness ring here — that number belongs to the
    store as a whole, and repeating it on every card says nothing about the licence."""
    bar = ""
    if meter:
        have, total = meter
        segs = "".join(
            f'<div style="flex:1;height:{int(h*0.022)}px;border-radius:99px;'
            f'background:{BLUE if i < have else LINE}"></div>' for i in range(total))
        bar = (f'<div style="display:flex;gap:{int(h*0.012)}px;margin-top:{int(h*0.045)}px">'
               f'{segs}</div>')
    return page(f"""
<div style="width:{w}px;height:{h}px;padding:{int(h*0.07)}px;display:flex;background:{WASH}">
 <div class=card style="flex:1;padding:{int(h*0.085)}px;display:flex;flex-direction:column;
   justify-content:space-between">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:20px">
   <div style="display:flex;align-items:center;gap:{int(h*0.028)}px">{mark(int(h*0.115))}
    <div class=h2 style="font-size:{int(h*0.066)}px">{title}</div></div>
   <span class="pill {cls}" style="font-size:{int(h*0.040)}px"><span class=dot></span>{status}</span>
  </div>
  <div>
   <div style="border-top:1px solid {LINE};margin-bottom:{int(h*0.055)}px"></div>
   <div class=mute style="font-size:{int(h*0.038)}px;font-weight:600;
     text-transform:uppercase;letter-spacing:.08em">{note}</div>
   <div class=h1 style="font-size:{int(h*0.105)}px;margin-top:{int(h*0.018)}px">{detail}</div>
   {bar}
  </div>
 </div></div>""", w, h), w, h


IMAGES = {
    "01-hero-dashboard.png": img_01_hero,
    "02-step1-setup.png": img_02_step1,
    "03-step2-dashboard.png": img_03_step2,
    "04-step3-requirements.png": img_04_step3,
    "05-card-snap.png": lambda: card_image(
        "SNAP Authorization", "ok", "Active", "Next renewal", "14 Mar 2027", 1164, 600),
    "06-card-wic.png": lambda: card_image(
        "WIC Vendor Status", "warn", "Action needed", "Price list due", "in 9 days", 768, 600),
    "07-card-health.png": lambda: card_image(
        "County Health Permit", "bad", "Expired", "Lapsed", "28 Aug 2026", 768, 600),
    "08-card-foodhandler.png": lambda: card_image(
        "Food Handler Cards", "warn", "4 of 7 current", "Staff needing renewal", "3 people",
        1062, 600, meter=(4, 7)),
    "10-card-tobacco.png": lambda: card_image(
        "Tobacco & ABC", "ok", "Active", "Next renewal", "1 Jun 2027", 1098, 600),
    "11-card-scales.png": lambda: card_image(
        "Scales & Business Tax", "ok", "Active", "Last certified", "2 Feb 2026", 768, 600),
    "09-og-image.png": lambda: (page(f"""
<div style="width:1200px;height:630px;padding:76px;display:flex;flex-direction:column;
  justify-content:center;gap:30px">
 {lockup(46)}
 <div class=h1 style="font-size:52px;line-height:1.1;max-width:960px;letter-spacing:-.035em">
  Know in seconds if a store is<br>actually inspection ready.</div>
 <div class=mute style="font-size:22px;font-weight:500;max-width:860px;line-height:1.4">
  Photograph an invoice. Ledger counts the stock and checks it<br>against every licence you hold.</div>
</div>""", 1200, 630), 1200, 630),
    # As specified: black rounded square, white "l".
    "12-favicon-512.png": lambda: (page(f"""
<div style="width:512px;height:512px;border-radius:112px;background:{INK};
  display:flex;align-items:center;justify-content:center">
 <span style="font-family:'Archivo';font-weight:600;font-size:330px;color:{PAPER};
   line-height:1;transform:translateY(-12px)">l</span></div>""", 512, 512), 512, 512),
    # Alternative using the Ledger mark, which stays readable at 16px where a bare
    # lowercase "l" collapses into a tally mark. Pick one — see the handoff doc.
    "12-favicon-512-mark.png": lambda: (page(f"""
<div style="width:512px;height:512px;border-radius:112px;background:{INK};
  display:flex;align-items:center;justify-content:center">
 <div style="transform:scale(6.4)">{mark(64, BLUE, PAPER, small=True)}</div></div>""", 512, 512), 512, 512),
}


def find_chromium() -> str | None:
    hits = sorted(glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome"))
    if hits:
        return hits[-1]
    import shutil
    for n in ("chromium", "chromium-browser", "google-chrome", "chrome"):
        if shutil.which(n):
            return shutil.which(n)
    return None


def main() -> int:
    only = {a.lstrip("0") or "0" for a in sys.argv[1:]}
    chrome = find_chromium()
    if not chrome:
        print("headless Chromium not found", file=sys.stderr)
        return 1
    try:
        from PIL import Image
    except ImportError:
        print("Pillow not installed", file=sys.stderr)
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    done = 0
    with tempfile.TemporaryDirectory() as td:
        for name, fn in IMAGES.items():
            if only and name.split("-")[0].lstrip("0") not in only:
                continue
            html, w, h = fn()
            src = Path(td) / "p.html"
            src.write_text(html, encoding="utf-8")
            big = Path(td) / f"{name}"
            # Chromium's --window-size height includes browser chrome, so the real
            # viewport is ~88px shorter and the page gets clipped. Render with
            # generous headroom and crop the exact frame off the top instead of
            # trusting a magic offset.
            subprocess.run(
                [chrome, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                 "--force-device-scale-factor=2", f"--screenshot={big}",
                 f"--window-size={w},{h + VIEWPORT_HEADROOM}", f"file://{src}"],
                capture_output=True, text=True,
            )
            if not big.exists():
                print(f"  ! failed {name}")
                continue
            # Rendered at 2x; crop to the frame, then downsample for crisp type.
            im = Image.open(big).convert("RGB").crop((0, 0, w * 2, h * 2))
            im.resize((w, h), Image.LANCZOS).save(OUT / name)
            print(f"  {name}  {w}x{h}  aspect {w/h:.2f}")
            done += 1
    print(f"\n{done} images -> {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
