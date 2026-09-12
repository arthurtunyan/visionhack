#!/usr/bin/env python3
"""Render a mock for every Ledger feature and every section of the website.

Designed mockups, not screen captures — the repo ships an API with no UI. Every
mock shows the same store on the same day (see site_kit.py), so the hero, the
feature shots and the page sections tell one story rather than six.

    python3 brand/tools/build-mocks.py              # everything
    python3 brand/tools/build-mocks.py features     # or: sections
    python3 brand/tools/build-mocks.py f02 s05      # individual ids

Output: brand/site/features/ and brand/site/sections/. PNGs are derived —
edit the templates here, never the images.
"""
from __future__ import annotations
import subprocess, sys, tempfile
from glob import glob
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from site_kit import *  # noqa: F403

OUT = ROOT / "brand" / "site"


def app_frame(inner, active="Dashboard", w=1200, h=800, pad=28):
    return page(f'<div style="display:flex;height:{h}px">{app_sidebar(active)}'
                f'<main style="flex:1;min-width:0;padding:{pad}px 30px;display:flex;'
                f'flex-direction:column;gap:20px">{inner}</main></div>', w, h)


def rows_table(head, rows, foot=""):
    return (f'<div class=card style="overflow:hidden;flex:1;display:flex;flex-direction:column">'
            f'{head}{"".join(rows)}{foot}</div>')


def tfoot(left, right=""):
    return (f'<div style="margin-top:auto;padding:14px 20px;border-top:1px solid {LINE};'
            f'display:flex;justify-content:space-between;align-items:center;background:{WASH}">'
            f'<div class=mute style="font-size:13px;font-weight:500">{left}</div>'
            f'<div class=h2 style="font-size:13px;color:{BLUE}">{right}</div></div>')


def thead(left, right=""):
    return (f'<div style="padding:15px 20px;border-bottom:1px solid {LINE};display:flex;'
            f'justify-content:space-between;align-items:center">'
            f'<div class=h2 style="font-size:16px">{left}</div>'
            f'<div class=mute style="font-size:13px;font-weight:500">{right}</div></div>')


# ---------------------------------------------------------------- features ---
def f01_capture():
    return app_frame(f"""
{app_header("Scan a delivery invoice", "Photograph it. Ledger reads the printed lines.")}
<div class=card style="flex:1;display:flex;align-items:center;justify-content:center;
  background:{WASH};border-style:dashed;border-width:2px">
 <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:18px">
  {mark(64)}
  <div><div class=h2 style="font-size:21px">Drop an invoice photo</div>
   <div class=mute style="font-size:15px;margin-top:7px;font-weight:500">
    JPEG or PNG, up to 8 MB &middot; a phone photo is fine</div></div>
  <div class=btn>Choose a photo</div>
  <div class=mute style="font-size:13px;font-weight:500">Typical scan finishes in about 20 seconds</div>
 </div></div>""", "Scans")


def f02_result():
    rows = []
    for name, cat, variety, units, per in SCANNED[:8]:
        rows.append(
            f'<div style="display:flex;align-items:center;gap:14px;padding:13px 20px;'
            f'border-bottom:1px solid {LINE}">'
            f'<div style="flex:1;min-width:0"><div class=h2 style="font-size:14px">{name}</div>'
            f'<div class=mute style="font-size:12px;margin-top:2px;font-weight:500">{variety}'
            f'{" &middot; perishable" if per else ""}</div></div>'
            f'{pill("neut", cat, 12)}'
            f'<div style="width:96px;text-align:right"><span class=h2 style="font-size:16px">'
            f'{units}</span><span class=mute style="font-size:12px;font-weight:500"> units</span></div>'
            f'</div>')
    return app_frame(f"""
{app_header("Scan result", "Valley Fresh Distributors &middot; invoice VF-88213 &middot; 11 Sep 2026",
            pill("ok", "10 lines counted"))}
{rows_table(thead("Counted line items", "10 of 14 printed lines"), rows, tfoot("Dairy 4 &middot; Grains 3 &middot; Protein 3 &middot; Produce 1", "Open scorecard"))}""", "Scans")


def f03_excluded():
    rows = []
    for name, pack, why in EXCLUDED:
        rows.append(
            f'<div style="display:flex;align-items:center;gap:14px;padding:15px 20px;'
            f'border-bottom:1px solid {LINE}">'
            f'<div style="flex:1;min-width:0"><div class=h2 style="font-size:15px">{name}</div>'
            f'<div class=mute style="font-size:12px;margin-top:3px;font-weight:500">{pack}</div></div>'
            f'<div class=mute style="font-size:13px;font-weight:500;text-align:right;'
            f'max-width:300px">{why}</div></div>')
    return app_frame(f"""
{app_header("Not counted", "Ledger never guesses. Anything ambiguous is shown, not scored.",
            pill("warn", "4 lines held back"))}
<div class=card style="padding:20px 22px;background:{WASH};border:none;display:flex;
  align-items:center;gap:16px">{mark(36)}
 <div class=mute style="font-size:14px;font-weight:500;line-height:1.5">
  Telling a store it passes when it doesn't is the expensive mistake.<br>
  These lines are excluded from the count until a human confirms them.</div></div>
{rows_table(thead("Held back from the count", "review and confirm"), rows, tfoot("Nothing here counts until you confirm it", "Review all 4"))}""", "Scans")


def f04_staples():
    def cell(n, c, vs):
        okc = c >= REQUIRED_VARIETIES
        return (f'<div class=card style="flex:1;padding:22px;display:flex;flex-direction:column;'
                f'gap:16px;{"border-color:%s" % BAD if not okc else ""}">'
                f'{cat_bar(n, c)}'
                f'<div class=mute style="font-size:13px;font-weight:500;line-height:1.5">'
                f'{", ".join(vs) if okc else vs[0] + " &mdash; needs 2 more varieties"}</div></div>')
    bars = (f'<div style="display:flex;gap:14px;flex:1">{cell(*CATEGORIES[0])}{cell(*CATEGORIES[1])}</div>'
            f'<div style="display:flex;gap:14px;flex:1">{cell(*CATEGORIES[2])}{cell(*CATEGORIES[3])}</div>')
    return app_frame(f"""
{app_header("Staple categories", "SNAP requires 3 varieties in each of four categories.",
            pill("bad", "Produce short"))}
{bars}
<div class=card style="padding:20px 22px;display:flex;align-items:center;gap:16px">
 {mark(36, BLUE, BAD)}
 <div style="font-size:14px;font-weight:500;line-height:1.5">
  <span class=h2 style="font-size:15px">Produce is 2 varieties short.</span><br>
  <span class=mute>Two produce lines were priced by weight, so no unit count could be
  read. Confirm them or add a variety before your next review.</span></div></div>""", "Staples")


def f05_scorecard():
    cells = "".join(
        f'<div class=card style="flex:1;padding:20px;display:flex;flex-direction:column;gap:12px">'
        f'<div style="display:flex;justify-content:space-between;align-items:center">'
        f'<span class=h2 style="font-size:15px">{n}</span>'
        f'{pill("ok" if c >= 3 else "bad", "Pass" if c >= 3 else "Fail", 12)}</div>'
        f'<div class=h1 style="font-size:34px">{c}<span class=mute style="font-size:16px;'
        f'font-weight:600"> / 3</span></div>'
        f'<div class=mute style="font-size:12px;font-weight:500">{", ".join(v[:2])}</div></div>'
        for n, c, v in CATEGORIES)
    return app_frame(f"""
{app_header("Stocking scorecard", f"{STORE} &middot; from the scan of 11 Sep 2026")}
<div class=card style="padding:24px;display:flex;align-items:center;gap:24px;
  border-color:{BAD}">
 {ring(75, 124, BAD, "3 of 4")}
 <div><div class=h1 style="font-size:26px">Not passing today</div>
  <div class=mute style="font-size:15px;margin-top:7px;font-weight:500;line-height:1.5">
   Three categories clear the requirement. Produce does not,<br>
   so the store would fail a SNAP stocking review.</div></div></div>
<div style="display:flex;gap:14px">{cells}</div>""", "Staples")


def f06_fix():
    def task(n, why, due, urgent=False):
        return (f'<div style="display:flex;align-items:center;gap:14px;padding:16px 20px;'
                f'border-bottom:1px solid {LINE}">'
                f'<div style="width:19px;height:19px;border:2px solid {LINE};border-radius:6px;'
                f'flex:0 0 19px"></div><div style="flex:1;min-width:0">'
                f'<div class=h2 style="font-size:15px">{n}</div>'
                f'<div class=mute style="font-size:12px;margin-top:2px;font-weight:500">{why}</div></div>'
                f'<span style="font-size:13px;font-weight:600;color:{BAD if urgent else WARN}">'
                f'{due}</span></div>')
    return app_frame(f"""
{app_header("Fix it before inspection", "Ranked by what closes you down first.")}
{rows_table(thead("Open items", "5 open"), [
  task("Add 2 produce varieties", "SNAP staple requirement not met", "blocks review", True),
  task("Renew County Health Permit", "lapsed 28 Aug 2026", "overdue 15 days", True),
  task("Submit WIC shelf price list", "quarterly filing", "9 days"),
  task("Renew 3 food handler cards", "Rivera, Chen, Okafor", "22 days"),
  task("Re-certify checkout scales", "county weights & measures", "41 days"),
], tfoot("Re-checked after every scan", "Mark all reviewed"))}""", "Dashboard")


def f07_alerts():
    def a(t, s, when, cls):
        return (f'<div style="display:flex;align-items:flex-start;gap:14px;padding:16px 20px;'
                f'border-bottom:1px solid {LINE}">{pill(cls, when, 12)}'
                f'<div style="flex:1;min-width:0"><div class=h2 style="font-size:15px">{t}</div>'
                f'<div class=mute style="font-size:13px;margin-top:3px;font-weight:500">{s}</div>'
                f'</div></div>')
    return app_frame(f"""
{app_header("Alerts", "Ledger re-checks after every scan and every renewal date.")}
{rows_table(thead("Recent", "last 30 days"), [
  a("Produce fell below 3 varieties", "After the 11 Sep scan — two lines held back", "today", "bad"),
  a("County Health Permit expired", "Renewal was due 28 Aug 2026", "15 days ago", "bad"),
  a("WIC price list due", "Quarterly filing window opens Monday", "9 days", "warn"),
  a("3 food handler cards expiring", "Rivera, Chen, Okafor", "22 days", "warn"),
  a("SNAP authorization renewed", "Valid through 14 Mar 2027", "2 months ago", "ok"),
], tfoot("Email and SMS, one digest a day", "Notification settings"))}""", "Dashboard")


def f08_history():
    def h(date, inv, lines, held, ok):
        return (f'<div style="display:flex;align-items:center;gap:16px;padding:14px 20px;'
                f'border-bottom:1px solid {LINE}">'
                f'<div style="width:104px" class=h2>{date}</div>'
                f'<div style="flex:1;min-width:0" class=mute style="font-size:13px">{inv}</div>'
                f'<div class=mute style="font-size:13px;width:90px;font-weight:500">{lines} lines</div>'
                f'<div class=mute style="font-size:13px;width:90px;font-weight:500">{held} held</div>'
                f'{pill("ok" if ok else "bad", "Pass" if ok else "Fail", 12)}</div>')
    return app_frame(f"""
{app_header("Scan history", "Every scan is kept, so you can show your working.")}
{rows_table(thead("Scans", "12 this quarter"), [
  h("11 Sep 2026", "Valley Fresh VF-88213", 14, 4, False),
  h("28 Aug 2026", "Valley Fresh VF-87960", 16, 2, True),
  h("14 Aug 2026", "Sunland Produce SP-3321", 9, 1, True),
  h("31 Jul 2026", "Valley Fresh VF-87412", 15, 3, True),
  h("17 Jul 2026", "Sunland Produce SP-3180", 11, 0, True),
], tfoot("Kept for 7 years", "Export CSV"))}""", "Scans")


def f09_staff():
    def s(n, role, exp, cls, txt):
        init = "".join(p[0] for p in n.split()[:2])
        return (f'<div style="display:flex;align-items:center;gap:14px;padding:14px 20px;'
                f'border-bottom:1px solid {LINE}">'
                f'<div style="width:38px;height:38px;border-radius:50%;background:{WASH};'
                f'display:flex;align-items:center;justify-content:center;font-weight:600;'
                f'font-size:14px;flex:0 0 38px">{init}</div>'
                f'<div style="flex:1;min-width:0"><div class=h2 style="font-size:15px">{n}</div>'
                f'<div class=mute style="font-size:12px;margin-top:2px;font-weight:500">{role}</div></div>'
                f'<div class=mute style="font-size:13px;font-weight:500;width:130px">{exp}</div>'
                f'{pill(cls, txt, 12)}</div>')
    return app_frame(f"""
{app_header("Food handler cards", "4 of 7 staff current", pill("warn", "3 expiring"))}
{rows_table(thead("Staff", "7 people"), [
  s("Maria Rivera", "Shift lead", "Expires 4 Oct 2026", "warn", "22 days"),
  s("David Chen", "Cashier", "Expires 9 Oct 2026", "warn", "27 days"),
  s("Ada Okafor", "Deli", "Expires 21 Oct 2026", "warn", "39 days"),
  s("Sam Delgado", "Stock", "Expires 2 Mar 2027", "ok", "Current"),
  s("Lena Park", "Cashier", "Expires 18 Apr 2027", "ok", "Current"),
], tfoot("Reminders go out 30 days before expiry", "Add staff"))}""", "Staff")


def f10_stores():
    def st(n, addr, pct, cls, txt):
        return (f'<div class=card style="flex:1;padding:20px;display:flex;flex-direction:column;gap:14px">'
                f'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">'
                f'<div><div class=h2 style="font-size:16px">{n}</div>'
                f'<div class=mute style="font-size:12px;margin-top:3px;font-weight:500">{addr}</div></div>'
                f'{pill(cls, txt, 12)}</div>'
                f'<div style="display:flex;align-items:center;gap:14px">'
                f'{ring(pct, 76, BLUE if cls == "ok" else BAD, "ready")}'
                f'<div class=mute style="font-size:12px;font-weight:500;line-height:1.5">'
                f'{"All four staple<br>categories clear" if cls == "ok" else "Produce below<br>3 varieties"}'
                f'</div></div></div>')
    return app_frame(f"""
{app_header("All stores", "One view across the group.", pill("warn", "2 need attention"))}
<div style="display:flex;gap:14px">
 {st("Corner Market #17", "4520 Sunset Blvd", 75, "bad", "Not ready")}
 {st("Corner Market #4", "1180 Vermont Ave", 100, "ok", "Ready")}</div>
<div style="display:flex;gap:14px">
 {st("Corner Market #22", "870 N Figueroa St", 100, "ok", "Ready")}
 {st("Corner Market #9", "2301 W Pico Blvd", 75, "bad", "Permit expired")}</div>""", "Dashboard")


def f11_mobile():
    rows = "".join(
        f'<div style="display:flex;align-items:center;gap:10px;padding:11px 0;'
        f'border-bottom:1px solid {LINE}"><div style="flex:1;min-width:0">'
        f'<div class=h2 style="font-size:13px">{n}</div>'
        f'<div class=mute style="font-size:11px;margin-top:1px;font-weight:500">{v}</div></div>'
        f'<span class=h2 style="font-size:14px">{u}</span></div>'
        for n, c, v, u, p in SCANNED[:5])
    return page(f"""
<div style="width:640px;height:1000px;background:{WASH};display:flex;align-items:center;
  justify-content:center">
 <div style="width:430px;height:930px;background:{PAPER};border-radius:48px;
   border:10px solid {INK};overflow:hidden;display:flex;flex-direction:column">
  <div style="padding:18px 20px 12px;display:flex;align-items:center;justify-content:space-between">
   {lockup(16)}{pill("ok", "Counted", 11)}</div>
  <div style="padding:0 20px 14px"><div class=h1 style="font-size:20px">Scan result</div>
   <div class=mute style="font-size:12px;margin-top:4px;font-weight:500">
    Valley Fresh &middot; 11 Sep 2026</div></div>
  <div style="padding:0 20px;display:flex;gap:8px;margin-bottom:12px">
   {"".join(f'<div style="flex:1;text-align:center;border:1px solid {LINE};border-radius:10px;padding:9px 4px"><div class=h2 style="font-size:16px;color:{BLUE if c>=3 else BAD}">{c}</div><div class=mute style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-top:2px">{n}</div></div>' for n, c, _ in CATEGORIES)}
  </div>
  <div style="padding:0 20px;flex:1;overflow:hidden">{rows}</div>
  <div style="padding:14px 20px 20px">
   <div class=btn style="display:block;text-align:center;padding:13px">Add to today's count</div></div>
 </div></div>""", 640, 1000)


def f12_licenses():
    rows = [(f'<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;'
             f'padding:15px 20px;border-bottom:1px solid {LINE}">'
             f'<div style="min-width:0"><div class=h2 style="font-size:15px">{n}</div>'
             f'<div class=mute style="font-size:12px;margin-top:3px;font-weight:500">{note}</div></div>'
             f'{pill(cls, status, 12)}</div>') for n, cls, status, note in LICENSES]
    return app_frame(f"""
{app_header("Licenses & permits", f"{STORE} &middot; {ADDR}", pill("warn", "3 need action"))}
{rows_table(thead("Tracked", "6 licenses"), rows, tfoot("Renewal dates sync automatically", "Add a license"))}""", "Licenses")


FEATURES = {
    "f01-scan-capture.png": (f01_capture, 1200, 800),
    "f02-scan-result.png": (f02_result, 1200, 800),
    "f03-not-counted.png": (f03_excluded, 1200, 800),
    "f04-staple-categories.png": (f04_staples, 1200, 800),
    "f05-scorecard.png": (f05_scorecard, 1200, 800),
    "f06-fix-list.png": (f06_fix, 1200, 800),
    "f07-alerts.png": (f07_alerts, 1200, 800),
    "f08-scan-history.png": (f08_history, 1200, 800),
    "f09-staff-cards.png": (f09_staff, 1200, 800),
    "f10-multi-store.png": (f10_stores, 1200, 800),
    "f11-mobile-scan.png": (f11_mobile, 640, 1000),
    "f12-licenses.png": (f12_licenses, 1200, 800),
}


def render(chrome, Image, html, w, h, dest):
    with tempfile.TemporaryDirectory() as td:
        src = Path(td) / "p.html"
        src.write_text(html, encoding="utf-8")
        raw = Path(td) / "r.png"
        subprocess.run([chrome, "--headless", "--no-sandbox", "--disable-gpu",
                        "--hide-scrollbars", "--force-device-scale-factor=2",
                        f"--screenshot={raw}", f"--window-size={w},{h + VIEWPORT_HEADROOM}",
                        f"file://{src}"], capture_output=True, text=True)
        if not raw.exists():
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        (Image.open(raw).convert("RGB").crop((0, 0, w * 2, h * 2))
         .resize((w, h), Image.LANCZOS).save(dest))
        return True


def find_chromium():
    hits = sorted(glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome"))
    if hits:
        return hits[-1]
    import shutil
    for n in ("chromium", "chromium-browser", "google-chrome"):
        if shutil.which(n):
            return shutil.which(n)
    return None


def main():
    from PIL import Image
    chrome = find_chromium()
    if not chrome:
        print("no chromium", file=sys.stderr)
        return 1
    args = [a.lower() for a in sys.argv[1:]]
    ids = {a for a in args if a and a[0] in "fs" and a[1:].isdigit()}
    do_f = not args or "features" in args or any(i.startswith("f") for i in ids)
    do_s = not args or "sections" in args or any(i.startswith("s") for i in ids)
    n = 0
    for group, table, sub in (("f", FEATURES, "features"), ("s", SECTIONS, "sections")):
        if group == "f" and not do_f:
            continue
        if group == "s" and not do_s:
            continue
        for name, (fn, w, h) in table.items():
            if ids and name.split("-")[0] not in ids:
                continue
            if render(chrome, Image, fn(), w, h, OUT / sub / name):
                print(f"  {sub}/{name}  {w}x{h}")
                n += 1
    print(f"\n{n} mocks -> brand/site/")
    return 0


# ---------------------------------------------------------------- sections ---
SW = 1600  # section mocks are rendered at desktop width


def s01_nav():
    links = "".join(f'<span class=h2 style="font-size:15px;color:{MUTE}">{n}</span>'
                    for n in ["How it works", "Why Ledger", "Pricing", "FAQ"])
    return page(f"""
<div style="width:{SW}px;height:110px;border-bottom:1px solid {LINE};display:flex;
  align-items:center;justify-content:space-between;padding:0 60px">
 {lockup(26)}
 <div style="display:flex;align-items:center;gap:40px">{links}</div>
 <div style="display:flex;align-items:center;gap:14px">
  <span class=btn2 style="padding:11px 20px;font-size:14px">Sign in</span>
  <span class=btn style="padding:11px 20px;font-size:14px">Scan an invoice</span></div>
</div>""", SW, 110)


def s02_hero():
    body = mini_app(f"""
{app_header("Corner Market #17", "Valley Fresh invoice VF-88213 &middot; scanned 2 minutes ago",
            pill("bad", "Produce short"))}
<div style="display:flex;gap:14px">
 <div class=card style="flex:0 0 168px;padding:16px;display:flex;flex-direction:column;
   align-items:center;justify-content:center;gap:4px">{ring(75, 96, BAD, "3 of 4")}</div>
 <div class=card style="flex:1;padding:18px 20px;display:flex;flex-direction:column;
   justify-content:center;gap:13px">
  {"".join(f'<div>{cat_bar(n, c)}</div>' for n, c, _ in CATEGORIES)}</div></div>
<div class=card style="padding:14px 18px;display:flex;align-items:center;gap:12px;
  background:{WASH};border:none">
 <span class=h2 style="font-size:13px">4 lines held back as unreadable</span>
 <span class=mute style="font-size:12px;font-weight:500;flex:1">
  Roma tomatoes and yellow onions were priced by weight.</span>
 <span class=h2 style="font-size:12px;color:{BLUE}">Review</span></div>""", "Dashboard", 430)
    return page(f"""
<div style="width:{SW}px;height:790px;display:flex;align-items:center;overflow:hidden;
  background:linear-gradient(180deg,{PAPER} 0%,{WASH} 100%)">
 <div style="flex:0 0 700px;padding-left:60px">
  {pill("neut", "For SNAP and WIC authorized stores", 13)}
  <div class=h1 style="font-size:66px;margin-top:22px;letter-spacing:-.04em">
   Know in seconds if<br>you'd pass a stocking<br>review.</div>
  <div class=mute style="font-size:19px;margin-top:24px;font-weight:500;line-height:1.55;
    max-width:520px">
   Photograph a delivery invoice. Ledger reads every printed line, counts stocking
   units by staple category, and tells you where you're short before an inspector does.</div>
  <div style="display:flex;gap:13px;margin-top:32px;align-items:center">
   <span class=btn style="font-size:16px;padding:17px 28px">Scan an invoice</span>
   <span class=btn2 style="font-size:16px;padding:17px 28px">See a sample result</span></div>
  <div class=mute style="font-size:14px;margin-top:20px;font-weight:500">
   No integration. Works from a phone photo.</div>
 </div>
 <div style="flex:1;margin-left:34px;margin-right:-190px">{window(body)}</div>
</div>""", SW, 860)


def s03_how():
    def step(i, t, s, inner):
        return (f'<div style="flex:1;display:flex;flex-direction:column;gap:16px">'
                f'<div style="display:flex;align-items:center;gap:11px">'
                f'<div style="width:26px;height:26px;border-radius:50%;background:{INK};'
                f'color:{PAPER};font-size:13px;font-weight:700;display:flex;align-items:center;'
                f'justify-content:center">{i}</div>'
                f'<span class=h2 style="font-size:19px">{t}</span></div>'
                f'<div class=mute style="font-size:15px;font-weight:500;line-height:1.55">{s}</div>'
                f'<div class=card style="flex:1;padding:20px;background:{WASH};border:none;'
                f'display:flex;flex-direction:column;justify-content:center">{inner}</div></div>')
    shot1 = (f'<div style="display:flex;flex-direction:column;gap:9px">' +
             "".join(f'<div style="background:{PAPER};border:1px solid {LINE};border-radius:9px;'
                     f'padding:11px 13px;font-size:13px;font-weight:600">{n}</div>'
                     for n in ["SNAP Authorization", "WIC Vendor Status", "County Health Permit"]) +
             f'<div class=btn style="text-align:center;padding:11px;font-size:13px">Add license</div></div>')
    shot2 = "".join(f'<div style="padding:7px 0">{cat_bar(n, c)}</div>' for n, c, _ in CATEGORIES)
    shot3 = "".join(
        f'<div style="display:flex;align-items:center;gap:10px;background:{PAPER};'
        f'border:1px solid {LINE};border-radius:9px;padding:11px 13px;margin-bottom:9px">'
        f'<div style="width:16px;height:16px;border:2px solid {LINE};border-radius:5px"></div>'
        f'<span style="font-size:13px;font-weight:600;flex:1">{n}</span>'
        f'<span style="font-size:12px;font-weight:600;color:{c}">{d}</span></div>'
        for n, d, c in [("Add 2 produce varieties", "blocks review", BAD),
                        ("Renew health permit", "overdue", BAD),
                        ("WIC price list", "9 days", WARN)])
    return page(f"""
<div style="width:{SW}px;height:760px;padding:64px 60px;display:flex;flex-direction:column;gap:40px">
 <div style="max-width:760px">
  <div class=lbl style="color:{BLUE}">How it works</div>
  <div class=h1 style="font-size:44px;margin-top:14px">Three steps, then it runs itself.</div></div>
 <div style="display:flex;gap:28px;flex:1">
  {step(1, "Enter your licenses", "Once. Ledger learns which stocking rules apply to you.", shot1)}
  {step(2, "See where you stand", "Every staple category against the requirement, after each scan.", shot2)}
  {step(3, "Fix it before inspection", "A ranked list of what actually blocks you.", shot3)}
 </div></div>""", SW, 820)


def s04_features():
    def txt(t, b, small=False):
        return (f'<div class="card elev" style="flex:1;padding:{22 if small else 28}px;'
                f'display:flex;flex-direction:column;justify-content:center">'
                f'<div class=h2 style="font-size:{16 if small else 19}px">{t}</div>'
                f'<div class=mute style="font-size:{13 if small else 15}px;margin-top:8px;'
                f'font-weight:500;line-height:1.55">{b}</div></div>')
    held = "".join(
        f'<div style="display:flex;align-items:center;gap:10px;padding:9px 0;'
        f'border-bottom:1px solid {LINE}">'
        f'<span class=h2 style="font-size:12px;flex:1">{n}</span>'
        f'<span class=mute style="font-size:11px;font-weight:500">{w}</span></div>'
        for n, _, w in EXCLUDED[:3])
    return page(f"""
<div style="width:{SW}px;height:820px;padding:64px 60px;display:flex;flex-direction:column;gap:30px">
 <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:60px">
  <div><div class=lbl style="color:{BLUE}">Why Ledger</div>
   <div class=h1 style="font-size:46px;margin-top:13px">Built to undercount.</div></div>
  <div class=mute style="font-size:17px;font-weight:500;line-height:1.55;max-width:440px">
   Telling a store it passes when it doesn't is the expensive mistake. Anything Ledger
   can't read with confidence is held back, not scored.</div></div>
 <div style="display:flex;gap:18px;flex:1.25">
  <div class="card elev" style="flex:1.55;padding:30px;display:flex;gap:28px;align-items:center">
   <div style="flex:1">
    <div class=h2 style="font-size:22px">It shows you what it refused to count</div>
    <div class=mute style="font-size:15px;margin-top:11px;font-weight:500;line-height:1.6">
     A case priced by weight has no unit count to read, so Ledger lists it with the reason
     instead of inventing a number. Four lines held back beats one wrong total.</div></div>
   <div style="flex:0 0 300px;background:{WASH};border-radius:12px;padding:16px 18px">
    <div class=lbl style="color:{MUTE};font-size:10px;margin-bottom:6px">Held back</div>
    {held}</div></div>
  <div class="card elev" style="flex:1;padding:30px;display:flex;flex-direction:column;
    justify-content:center;gap:26px">
   <div style="display:flex;gap:6px">
    {"".join(f'<div style="flex:1;text-align:center;border:1px solid {LINE};border-radius:9px;padding:11px 3px"><div class=h2 style="font-size:19px;color:{BLUE if c>=3 else BAD}">{c}</div><div class=mute style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-top:3px">{n[:7]}</div></div>' for n, c, _ in CATEGORIES)}</div>
   <div><div class=h2 style="font-size:19px">It knows the staple rules</div>
    <div class=mute style="font-size:14px;margin-top:8px;font-weight:500;line-height:1.55">
     Three varieties in each of four categories. Butter and jerky are accessory foods,
     so they count for nothing.</div></div></div>
 </div>
 <div style="display:flex;gap:18px;flex:0.62">
  {txt("Two passes, not one", "Transcribe the printed lines exactly, then classify them. Reading mistakes never get laundered into confident answers.", True)}
  {txt("Cases become units", "A 24-pack is 24 sellable units, not one case. Pack maths happens in one place you can correct.", True)}
  {txt("Every scan is kept", "Seven years of history, so you can show an inspector how you arrived at the number.", True)}
 </div></div>""", SW, 880)


def s05_proof():
    return page(f"""
<div style="width:{SW}px;height:540px;padding:60px;display:flex;gap:64px;align-items:center">
 <div style="flex:1.5">
  <div style="font-size:32px;font-weight:600;letter-spacing:-.03em;line-height:1.38">
   &ldquo;We lost SNAP authorization once over two produce varieties nobody noticed
   were gone. It took four months to get back. Now I photograph the invoice at the
   back door and I know before the truck leaves.&rdquo;</div>
  <div style="display:flex;align-items:center;gap:14px;margin-top:32px">
   <div style="width:46px;height:46px;border-radius:50%;background:{WASH};display:flex;
     align-items:center;justify-content:center;font-weight:600">RM</div>
   <div><div class=h2 style="font-size:16px">Rosa Medina</div>
    <div class=mute style="font-size:14px;font-weight:500">
     Owner, Corner Market. Four stores in Los Angeles.</div></div></div></div>
 <div class="card elev" style="flex:0 0 380px;padding:30px">
  <div class=lbl style="color:{MUTE}">Since switching</div>
  <div class=h1 style="font-size:64px;margin-top:12px">0</div>
  <div style="font-size:16px;font-weight:600;margin-top:6px">
   line items counted that Ledger wasn't certain about</div>
  <div style="border-top:1px solid {LINE};margin-top:22px;padding-top:18px;display:flex;
    justify-content:space-between;align-items:baseline">
   <span class=mute style="font-size:14px;font-weight:500">Average scan</span>
   <span class=h2 style="font-size:22px">20s</span></div></div>
</div>""", SW, 600)


def s06_pricing():
    def plan(name, price, per, blurb, feats, hi=False):
        rows = "".join(
            f'<div style="display:flex;gap:10px;align-items:flex-start;font-size:14px;'
            f'font-weight:500;color:{MUTE};margin-bottom:11px">'
            f'<span style="color:{BLUE};font-weight:700">&check;</span>{f}</div>' for f in feats)
        return (f'<div class=card style="flex:1;padding:32px;display:flex;flex-direction:column;'
                f'gap:20px;{f"border:2px solid {BLUE};" if hi else ""}">'
                f'<div><div style="display:flex;align-items:center;gap:10px">'
                f'<span class=h2 style="font-size:18px">{name}</span>'
                f'{pill("ok","Most stores",11) if hi else ""}</div>'
                f'<div class=mute style="font-size:14px;margin-top:8px;font-weight:500">{blurb}</div></div>'
                f'<div><span class=h1 style="font-size:44px">{price}</span>'
                f'<span class=mute style="font-size:15px;font-weight:500;margin-left:3px">{per}</span></div>'
                f'<div style="flex:1">{rows}</div>'
                f'<div class="{"btn" if hi else "btn2"}" style="text-align:center">Start free</div></div>')
    return page(f"""
<div style="width:{SW}px;height:900px;padding:70px 60px;display:flex;flex-direction:column;gap:40px">
 <div style="max-width:760px">
  <div class=lbl style="color:{BLUE}">Pricing</div>
  <div class=h1 style="font-size:44px;margin-top:14px">Priced per store, not per scan.</div>
  <div class=mute style="font-size:18px;margin-top:14px;font-weight:500">
   Scan as often as you take deliveries. Cancel any time.</div></div>
 <div style="display:flex;gap:22px;flex:1">
  {plan("Single store", "$29", "/month", "One location, one owner.",
        ["Unlimited invoice scans", "All four staple categories", "Licence renewal reminders",
         "7 years of scan history"])}
  {plan("Group", "$24", "/store/month", "Two to ten locations.",
        ["Everything in Single store", "One view across every store", "Per-store scorecards",
         "Staff card tracking", "CSV export"], hi=True)}
  {plan("Chain", "Talk to us", "", "Eleven locations or more.",
        ["Everything in Group", "Bulk onboarding", "Priority support", "Custom stocking rules"])}
 </div></div>""", SW, 900)


def s07_faq():
    def q(a, b):
        return (f'<div style="padding:24px 0;border-bottom:1px solid {LINE}">'
                f'<div class=h2 style="font-size:18px">{a}</div>'
                f'<div class=mute style="font-size:15px;margin-top:10px;font-weight:500;'
                f'line-height:1.6;max-width:680px">{b}</div></div>')
    return page(f"""
<div style="width:{SW}px;height:790px;padding:64px 60px;display:flex;gap:70px">
 <div style="flex:0 0 380px">
  <div class=lbl style="color:{BLUE}">FAQ</div>
  <div class=h1 style="font-size:40px;margin-top:14px">Questions<br>we get asked.</div>
  <div class=mute style="font-size:15px;margin-top:18px;font-weight:500;line-height:1.6">
   Still stuck? Reply to any scan email and a person answers.</div></div>
 <div style="flex:1">
  {q("What if the photo is blurry?", "Ledger transcribes only what it can actually read. Anything ambiguous is listed as held back with a reason, and never counted. A blurry photo gives you a shorter count, not a wrong one.")}
  {q("Does a case count as one unit?", "No. A case becomes the number of sellable units inside it &mdash; a 24-pack is 24. If an item is priced by weight, like a 50 lb sack, there is no unit count to read, so it is held back for you to confirm.")}
  {q("Why didn't my butter count?", "Butter and jerky are accessory foods under the SNAP staple rules, so they count for nothing toward a variety. They still appear in the scan so you can see they were read.")}
  {q("Do I need to integrate my POS?", "No. Ledger works from a photograph of the paper invoice. Nothing to install at the register.")}
  {q("Is this official SNAP guidance?", "No. Ledger helps you see where you stand against the published stocking requirements. The authorization decision is always the agency's.")}
 </div></div>""", SW, 900)


def s08_cta():
    return page(f"""
<div style="width:{SW}px;height:460px;background:{INK};display:flex;align-items:center;
  justify-content:space-between;padding:0 80px">
 <div>{lockup(30, PAPER)}
  <div class=h1 style="font-size:46px;color:{PAPER};margin-top:26px">
   Photograph one invoice.<br>See where you actually stand.</div></div>
 <div style="display:flex;flex-direction:column;gap:14px;align-items:flex-end">
  <span class=btn style="background:{PAPER};color:{INK};font-size:17px;padding:18px 30px">
   Scan an invoice</span>
  <span style="color:#9AA0A6;font-size:14px;font-weight:500">Free for your first store</span></div>
</div>""", SW, 460)


def s09_footer():
    def col(h, items):
        return (f'<div style="flex:1"><div class=h2 style="font-size:14px;margin-bottom:16px">{h}</div>'
                + "".join(f'<div class=mute style="font-size:14px;font-weight:500;'
                          f'margin-bottom:11px">{i}</div>' for i in items) + '</div>')
    return page(f"""
<div style="width:{SW}px;height:420px;padding:60px;display:flex;flex-direction:column;
  justify-content:space-between;border-top:1px solid {LINE}">
 <div style="display:flex;gap:70px">
  <div style="flex:0 0 300px">{lockup(24)}
   <div class=mute style="font-size:14px;margin-top:16px;font-weight:500;line-height:1.6">
    Stocking compliance for SNAP and<br>WIC authorized stores.</div></div>
  {col("Product", ["Scan an invoice", "Staple categories", "Licence tracking", "Pricing"])}
  {col("Company", ["About", "Contact", "Careers"])}
  {col("Legal", ["Privacy", "Terms", "Data retention"])}
 </div>
 <div style="display:flex;justify-content:space-between;align-items:center;
   border-top:1px solid {LINE};padding-top:26px">
  <span class=mute style="font-size:13px;font-weight:500">
   &copy; 2026 Ledger. Not affiliated with USDA FNS. Authorization decisions rest with the agency.</span>
  <span class=mute style="font-size:13px;font-weight:500">Los Angeles, CA</span></div>
</div>""", SW, 420)


SECTIONS = {
    "s01-nav.png": (s01_nav, SW, 110),
    "s02-hero.png": (s02_hero, SW, 790),
    "s03-how-it-works.png": (s03_how, SW, 760),
    "s04-features.png": (s04_features, SW, 820),
    "s05-social-proof.png": (s05_proof, SW, 540),
    "s06-pricing.png": (s06_pricing, SW, 900),
    "s07-faq.png": (s07_faq, SW, 790),
    "s08-cta.png": (s08_cta, SW, 460),
    "s09-footer.png": (s09_footer, SW, 420),
}


if __name__ == "__main__":
    raise SystemExit(main())
