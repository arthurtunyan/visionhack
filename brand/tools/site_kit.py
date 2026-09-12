"""Shared building blocks for every Ledger mock.

One palette, one typeface, one component set, one scenario — so the hero, the
feature shots and the page sections all show the same store on the same day
rather than drifting apart.
"""
from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FONTS = Path(__file__).resolve().parent / "fonts"

INK, BLUE, PAPER = "#000000", "#1B4DFF", "#FFFFFF"
MUTE, LINE, WASH = "#6B6B6B", "#E6E6E6", "#F6F7F9"
WARN, BAD, GOOD = "#8A5300", "#B3261E", "#1B4DFF"

STORE = "Corner Market #17"
ADDR = "4520 Sunset Blvd, Los Angeles"

# --- the scenario ------------------------------------------------------------
# Staple categories under SNAP: each needs at least 3 varieties, 3+ stocking
# units each. This store clears three categories and fails produce — because two
# produce lines were priced by weight, so Ledger refused to guess a unit count.
CATEGORIES = [
    ("Dairy", 4, ["whole milk", "greek yogurt", "cheddar", "butter*"]),
    ("Grains", 3, ["brown rice", "wheat bread", "rolled oats"]),
    ("Protein", 3, ["chicken thigh", "ground beef", "black beans"]),
    ("Produce", 1, ["romaine"]),
]
REQUIRED_VARIETIES = 3

# Counted lines from the scanned invoice.
SCANNED = [
    ("WHL MLK HOMOGENIZED", "Dairy", "whole milk", 24, True),
    ("GREEK YOGURT PLAIN", "Dairy", "greek yogurt", 48, True),
    ("CHDR CHEESE SHRED SHARP", "Dairy", "cheddar", 72, True),
    ("BROWN RICE LONG GRAIN", "Grains", "brown rice", 24, False),
    ("WHEAT BREAD SLICED 24OZ", "Grains", "wheat bread", 60, True),
    ("ROLLED OATS OLD FASHIONED", "Grains", "rolled oats", 12, False),
    ("CHKN THIGH BNLS SKNLS", "Protein", "chicken thigh", 16, True),
    ("GRND BEEF 80/20", "Protein", "ground beef", 24, True),
    ("BLACK BEANS CANNED", "Protein", "black beans", 48, False),
    ("ROMAINE HEARTS", "Produce", "romaine", 72, True),
]
# Deliberately not counted. This is the product's whole safety argument.
EXCLUDED = [
    ("ROMA TOMATOES", "25 LB CS", "Priced by weight — no unit count"),
    ("YELLOW ONIONS JUMBO", "50 LB SACK", "Priced by weight — no unit count"),
    ("SWEET CREAM BUTTER", "36 x 4 OZ", "Accessory food — counts for nothing"),
    ("PAPER TOWELS 2PLY", "30 ROLL", "Not a staple category"),
]
LICENSES = [
    ("SNAP Authorization", "warn", "At risk", "Produce short by 2 varieties"),
    ("WIC Vendor Status", "warn", "Action needed", "Price list due in 9 days"),
    ("County Health Permit", "bad", "Expired", "Lapsed 28 Aug 2026"),
    ("Food Handler Cards", "warn", "4 of 7 current", "3 staff need renewal"),
    ("Tobacco & ABC", "ok", "Active", "Renews 1 Jun 2027"),
    ("Scales & Business Tax", "ok", "Active", "Certified 2 Feb 2026"),
]


def font_face() -> str:
    return "".join(
        f"@font-face{{font-family:'Archivo';font-style:normal;font-weight:{w};"
        f"src:url('file://{FONTS}/Archivo-{w}.ttf') format('truetype');}}"
        for w in (400, 500, 600, 700))


def mark(size, bracket=BLUE, row=INK, small=False) -> str:
    st = (f'fill="none" stroke="{bracket}" stroke-width="4.5" '
          'stroke-linecap="round" stroke-linejoin="round"')
    rows = ((f'<rect x="21" y="24" width="22" height="6" rx="3" fill="{row}"/>'
             f'<rect x="21" y="34" width="15" height="6" rx="3" fill="{row}"/>') if small else
            (f'<rect x="22" y="23" width="20" height="4.6" rx="2.3" fill="{row}"/>'
             f'<rect x="22" y="30.2" width="13" height="4.6" rx="2.3" fill="{row}" opacity=".38"/>'
             f'<rect x="22" y="37.4" width="16" height="4.6" rx="2.3" fill="{row}"/>'))
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 64 64" '
            f'xmlns="http://www.w3.org/2000/svg" style="display:block;flex:0 0 auto">'
            f'<path d="M22 14 H12 V50 H22" {st}/><path d="M42 14 H52 V50 H42" {st}/>'
            f'{rows}</svg>')


def wordmark(px, color=INK) -> str:
    path = (ROOT / "brand" / "logo" / "wordmark.path").read_text().strip()
    s = px / 723
    return (f'<svg width="{2729*s:.1f}" height="{px*1.26:.1f}" viewBox="0 0 2729 905" '
            f'xmlns="http://www.w3.org/2000/svg" style="display:block;flex:0 0 auto">'
            f'<g transform="translate(-65 723) scale(1 -1)"><path d="{path}" fill="{color}"/>'
            f'</g></svg>')


def lockup(px, color=INK) -> str:
    return (f'<div style="display:flex;align-items:center;gap:{px*0.42:.0f}px">'
            f'{mark(int(px*1.55), BLUE, color)}{wordmark(px, color)}</div>')


BASE = f"""
{font_face()}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:'Archivo',system-ui,sans-serif;color:{INK};background:{PAPER};
 -webkit-font-smoothing:antialiased;font-feature-settings:'tnum' 1}}
.pill{{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:6px 13px;
 font-size:13px;font-weight:600;letter-spacing:-.01em;white-space:nowrap}}
.ok{{background:#EAF0FF;color:{BLUE}}} .warn{{background:#FFF3E0;color:{WARN}}}
.bad{{background:#FFECEC;color:{BAD}}} .neut{{background:{WASH};color:{MUTE}}}
.dot{{width:7px;height:7px;border-radius:50%;background:currentColor;flex:0 0 auto}}
.card{{border:1px solid {LINE};border-radius:16px;background:{PAPER}}}
.mute{{color:{MUTE}}}
.h1{{font-weight:700;letter-spacing:-.035em;line-height:1.12}}
.h2{{font-weight:600;letter-spacing:-.02em}}
.lbl{{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.09em}}
.btn{{background:{BLUE};color:{PAPER};border-radius:11px;padding:14px 22px;font-size:15px;
 font-weight:600;display:inline-block}}
.btn2{{border:1px solid {LINE};border-radius:11px;padding:14px 22px;font-size:15px;
 font-weight:600;display:inline-block}}
"""

VIEWPORT_HEADROOM = 220


def page(body, w, h, extra="") -> str:
    return (f"<!doctype html><meta charset=utf-8><style>{BASE}{extra}"
            f"html,body{{width:{w}px;height:{h}px;overflow:hidden}}</style>{body}")


def pill(cls, text, size=13) -> str:
    return f'<span class="pill {cls}" style="font-size:{size}px"><span class=dot></span>{text}</span>'


def ring(pct, size=132, color=BLUE, sub="ready") -> str:
    r, c = 54, 2 * 3.14159 * 54
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 128 128" style="display:block;flex:0 0 auto">'
            f'<circle cx="64" cy="64" r="{r}" fill="none" stroke="{LINE}" stroke-width="13"/>'
            f'<circle cx="64" cy="64" r="{r}" fill="none" stroke="{color}" stroke-width="13"'
            f' stroke-linecap="round" stroke-dasharray="{c:.1f}" stroke-dashoffset="{c*(1-pct/100):.1f}"'
            f' transform="rotate(-90 64 64)"/>'
            f'<text x="64" y="60" text-anchor="middle" font-family="Archivo" font-size="30"'
            f' font-weight="700" fill="{INK}" letter-spacing="-1">{pct}%</text>'
            f'<text x="64" y="80" text-anchor="middle" font-family="Archivo" font-size="12"'
            f' font-weight="500" fill="{MUTE}">{sub}</text></svg>')


def app_sidebar(active="Dashboard", w=248) -> str:
    items = ["Dashboard", "Scans", "Staples", "Licenses", "Staff", "Settings"]
    rows = "".join(
        f'<div style="padding:11px 14px;border-radius:10px;font-size:15px;'
        f'font-weight:{"600" if n == active else "500"};'
        f'color:{INK if n == active else MUTE};'
        f'background:{WASH if n == active else "transparent"}">{n}</div>' for n in items)
    return (f'<aside style="width:{w}px;flex:0 0 {w}px;border-right:1px solid {LINE};'
            f'padding:26px 16px;display:flex;flex-direction:column;gap:26px;height:100%">'
            f'<div style="padding-left:6px">{lockup(21)}</div>'
            f'<nav style="display:flex;flex-direction:column;gap:3px">{rows}</nav></aside>')


def app_header(title, sub, right="") -> str:
    return (f'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px">'
            f'<div><div class=h1 style="font-size:29px">{title}</div>'
            f'<div class=mute style="font-size:14px;margin-top:5px;font-weight:500">{sub}</div></div>'
            f'{right}</div>')


def cat_bar(name, have, need=REQUIRED_VARIETIES, width=None) -> str:
    passed = have >= need
    segs = "".join(
        f'<div style="flex:1;height:9px;border-radius:99px;'
        f'background:{(BLUE if passed else BAD) if i < have else LINE}"></div>'
        for i in range(max(need, have)))
    state = pill("ok", f"{have} of {need}") if passed else pill("bad", f"{have} of {need}")
    return (f'<div style="{"width:%dpx;" % width if width else "flex:1;"}">'
            f'<div style="display:flex;align-items:center;justify-content:space-between;'
            f'margin-bottom:10px"><span class=h2 style="font-size:15px">{name}</span>{state}</div>'
            f'<div style="display:flex;gap:5px">{segs}</div></div>')
