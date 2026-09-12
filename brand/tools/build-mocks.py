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


def f13_autoparts():
    """The positioning is multi-industry, so the feature set cannot be food-only."""
    def row(abbr, name, note, cls, status):
        return (f'<div style="display:flex;align-items:center;gap:14px;padding:14px 20px;'
                f'border-bottom:1px solid {LINE}">{badge(abbr, 38, mute=True)}'
                f'<div style="flex:1;min-width:0"><div class=h2 style="font-size:15px">{name}</div>'
                f'<div class=mute style="font-size:12px;margin-top:2px;font-weight:500">{note}</div></div>'
                f'{pill(cls, status, 12)}</div>')
    return app_frame(f"""
{app_header("Sunset Auto Parts", "3190 W Sunset Blvd &middot; auto parts & service",
            pill("warn", "2 need action"))}
<div style="display:flex;gap:14px">
 <div class=card style="flex:0 0 210px;padding:20px;display:flex;align-items:center;
   justify-content:center">{ring(83, 108, WARN, "5 of 6")}</div>
 <div class=card style="flex:1;padding:20px 22px;display:flex;flex-direction:column;
   justify-content:center;gap:12px">
  <div class=h2 style="font-size:16px">Next deadlines</div>
  <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:500">
   <span>Used oil hauler manifest (EPA)</span>
   <span style="color:{BAD};font-weight:600">overdue 6 days</span></div>
  <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:500">
   <span>EPA 609 technician certification</span>
   <span style="color:{WARN};font-weight:600">18 days</span></div>
  <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:500">
   <span>Hazard communication posting review</span>
   <span style="color:{WARN};font-weight:600">30 days</span></div></div></div>
{rows_table(thead("Permits & filings", "6 tracked"), [
  row("EPA", "Used oil & hazardous waste", "Generator status: very small quantity", "bad", "Manifest overdue"),
  row("EPA", "Refrigerant handling (609)", "1 of 2 technicians certified", "warn", "18 days"),
  row("OSHA", "Hazard communication", "Safety data sheets on file", "warn", "Review due"),
  row("DOT", "Hazmat shipping", "Batteries and aerosols", "ok", "Current"),
  row("BAR", "Automotive repair registration", "Renews 3 Apr 2027", "ok", "Active"),
  row("BTC", "Business tax certificate", "Renews 1 Jan 2027", "ok", "Active"),
], tfoot("Different store type, same calendar", "Add a permit"))}""", "Licenses")


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
    "f13-auto-parts.png": (f13_autoparts, 1200, 800),
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
# Layout rule: no two consecutive sections share a shape. The first pass used a
# bordered white card everywhere, roughly forty times down the page, which is
# why it all blended. Borders are now the exception; hairlines and space do the
# separating, and body copy never drops below 15px.
SW = 1600
PAD = 72


def s01_nav():
    links = "".join(f'<span style="font-size:16px;font-weight:500;color:{MUTE}">{n}</span>'
                    for n in ["Industries", "How it works", "Coverage", "Pricing"])
    return page(f"""
<div style="width:{SW}px;height:104px;border-bottom:1px solid {LINE};display:flex;
  align-items:center;justify-content:space-between;padding:0 {PAD}px">
 {lockup(26)}
 <div style="display:flex;align-items:center;gap:40px">{links}</div>
 <div style="display:flex;align-items:center;gap:22px">
  <span style="font-size:16px;font-weight:600">Sign in</span>
  <span class=btn style="padding:12px 22px;font-size:16px">Start free</span></div>
</div>""", SW, 104)


def s02_hero():
    body = mini_app(f"""
{app_header("Corner Market #17", "Valley Fresh invoice VF-88213 &middot; scanned 2 minutes ago",
            pill("bad", "Produce short"))}
<div style="display:flex;gap:14px">
 <div class=card style="flex:0 0 168px;padding:16px;display:flex;align-items:center;
   justify-content:center">{ring(75, 96, BAD, "3 of 4")}</div>
 <div class=card style="flex:1;padding:18px 20px;display:flex;flex-direction:column;
   justify-content:center;gap:13px">
  {"".join(f'<div>{cat_bar(n, c)}</div>' for n, c, _ in CATEGORIES)}</div></div>
<div class=card style="padding:14px 18px;display:flex;align-items:center;gap:12px;
  background:{WASH};border:none">
 <span class=h2 style="font-size:13px">4 lines held back as unreadable</span>
 <span class=mute style="font-size:12px;font-weight:500;flex:1">
  Roma tomatoes and yellow onions were priced by weight.</span></div>""", "Dashboard", 430)
    return page(f"""
<div style="width:{SW}px;height:820px;display:flex;align-items:center;overflow:hidden;
  background:linear-gradient(165deg,{PAPER} 40%,{TINT} 100%)">
 <div style="flex:0 0 720px;padding-left:{PAD}px">
  <div style="font-size:15px;font-weight:600;color:{MUTE};letter-spacing:-.01em">
   Grocery &middot; auto parts &middot; liquor &middot; pharmacy &middot; hardware</div>
  <div class=h1 style="font-size:76px;margin-top:20px;letter-spacing:-.045em">
   Every permit your<br>store has to hold,<br>in one place.</div>
  <div class=body-lg style="margin-top:26px">
   Ledger tracks the licences, filings and stocking rules a small retailer is
   judged on, and tells you which one is about to fail.</div>
  <div style="display:flex;gap:14px;margin-top:34px;align-items:center">
   <span class=btn style="font-size:17px;padding:18px 30px">Start free</span>
   <span style="font-size:17px;font-weight:600">See a sample scan &rarr;</span></div>
  <div style="font-size:15px;color:{MUTE};font-weight:500;margin-top:22px">
   No integration. Works from a phone photo.</div>
 </div>
 <div style="flex:1;margin-left:30px;margin-right:-220px">{window(body)}</div>
</div>""", SW, 820)


def s03_strip():
    order = ["SNAP", "WIC", "EBT", "EPA", "OSHA", "ABC", "DOT", "CHP", "W&M", "TRL"]
    tiles = "".join(
        f'<div style="display:flex;flex-direction:column;align-items:center;gap:11px;'
        f'text-align:center;width:128px">{badge(a, 58)}'
        f'<span style="font-size:13px;font-weight:600;color:{MUTE};line-height:1.35">'
        f'{SHORT[a]}</span></div>' for a in order)
    return page(f"""
<div style="width:{SW}px;height:290px;padding:52px {PAD}px;display:flex;flex-direction:column;
  justify-content:center;gap:32px;border-bottom:1px solid {LINE}">
 <div style="font-size:17px;font-weight:600;color:{MUTE}">
  Eighteen programmes tracked across federal, state and local authorities</div>
 <div style="display:flex;justify-content:space-between;align-items:flex-start">{tiles}</div>
 <div style="font-size:13px;font-weight:500;color:{MUTE}">{NON_AFFILIATION}</div>
</div>""", SW, 290)


def s04_industries():
    """An editorial list, not five cards. Hairlines separate; nothing is boxed."""
    rows = ""
    for i, (name, blurb, codes) in enumerate(VERTICALS):
        tiles = "".join(badge(c, 38, mute=True) for c in codes)
        rows += (f'<div style="display:flex;align-items:center;gap:40px;padding:26px 0;'
                 f'{"border-top:1px solid " + LINE + ";" if i else ""}">'
                 f'<div style="flex:0 0 300px"><div class=h2 style="font-size:23px">{name}</div></div>'
                 f'<div style="flex:1;font-size:17px;font-weight:500;color:{MUTE};'
                 f'line-height:1.55">{blurb}</div>'
                 f'<div style="display:flex;gap:8px;flex:0 0 auto">{tiles}</div></div>')
    return page(f"""
<div style="width:{SW}px;height:700px;padding:70px {PAD}px;display:flex;flex-direction:column">
 <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:70px;
   margin-bottom:30px">
  <div class=h1 style="font-size:52px">Not just grocery.</div>
  <div class=body style="max-width:520px">Any small retailer carries a stack of permits
   that expire on different dates and answer to different inspectors. Ledger holds the
   whole stack.</div></div>
 <div style="flex:1">{rows}</div>
</div>""", SW, 700)


def s05_how():
    """Three numbered rows, alternating sides, separated by rules. No card grid."""
    shots = [
        "".join(f'<div style="display:flex;align-items:center;gap:12px;border-bottom:1px solid '
                f'{LINE};padding:13px 0">{badge(a, 30, mute=True)}'
                f'<span style="font-size:15px;font-weight:600">{n}</span></div>'
                for a, n in [("SNAP", "SNAP retailer authorization"),
                             ("CHP", "County health permit"),
                             ("W&M", "Weights and measures")]),
        "".join(f'<div style="padding:9px 0">{cat_bar(n, c)}</div>' for n, c, _ in CATEGORIES),
        "".join(f'<div style="display:flex;align-items:center;gap:12px;border-bottom:1px solid '
                f'{LINE};padding:13px 0">'
                f'<div style="width:17px;height:17px;border:2px solid {LINE};border-radius:5px"></div>'
                f'<span style="font-size:15px;font-weight:600;flex:1">{n}</span>'
                f'<span style="font-size:14px;font-weight:600;color:{c}">{d}</span></div>'
                for n, d, c in [("Add 2 produce varieties", "blocks review", BAD),
                                ("Renew health permit", "overdue", BAD),
                                ("WIC price list", "9 days", WARN)])]
    steps = [("Add your permits", "Tell Ledger what you hold. It works out which rules apply "
                                  "to your kind of store and when each one comes due."),
             ("See where you stand", "Every requirement against its threshold, re-checked after "
                                     "each scan. No digging through renewal letters."),
             ("Fix what blocks you", "Ranked by what closes you down first, not by date. The "
                                     "top item is always the one that matters today.")]
    rows = ""
    for i, ((t, b), shot) in enumerate(zip(steps, shots)):
        left = (f'<div style="flex:0 0 520px">'
                f'<div style="display:flex;align-items:baseline;gap:14px">'
                f'<span style="font-size:15px;font-weight:700;color:{BLUE};'
                f'font-variant-numeric:tabular-nums">0{i+1}</span>'
                f'<span class=h2 style="font-size:26px">{t}</span></div>'
                f'<div class=body style="margin-top:12px;font-size:17px">{b}</div></div>')
        right = f'<div style="flex:1;max-width:620px">{shot}</div>'
        order = (left + right) if i % 2 == 0 else (right + left)
        rows += (f'<div style="display:flex;align-items:center;gap:80px;padding:34px 0;'
                 f'{"border-top:1px solid " + LINE + ";" if i else ""}">{order}</div>')
    return page(f"""
<div style="width:{SW}px;height:100%;min-height:1040px;padding:70px {PAD}px;
  background:{TINT};display:flex;flex-direction:column">
 <div class=h1 style="font-size:52px;margin-bottom:20px">Set it up once.<br>It runs itself.</div>
 <div style="flex:1">{rows}</div>
</div>""", SW, 1040)


def s06_undercount():
    """The differentiator. One idea, one large piece of evidence, no card grid."""
    held = "".join(
        f'<div style="display:flex;align-items:center;gap:16px;padding:15px 0;'
        f'border-bottom:1px solid {LINE}">'
        f'<span class=h2 style="font-size:16px;flex:0 0 250px">{n}</span>'
        f'<span style="font-size:15px;font-weight:500;color:{MUTE};flex:0 0 130px">{p}</span>'
        f'<span style="font-size:15px;font-weight:500;color:{INK};flex:1">{w}</span></div>'
        for n, p, w in EXCLUDED)
    return page(f"""
<div style="width:{SW}px;height:640px;padding:70px {PAD}px;display:flex;gap:80px">
 <div style="flex:0 0 520px;display:flex;flex-direction:column;justify-content:center">
  <div class=h1 style="font-size:54px">Built to<br>undercount.</div>
  <div class=body style="margin-top:22px;font-size:18px">
   Telling a store it passes when it doesn't is the expensive mistake. A case priced
   by weight has no unit count to read, so Ledger lists it with the reason instead of
   inventing a number.</div>
  <div style="margin-top:28px;padding-top:24px;border-top:1px solid {LINE}">
   <div class=h1 style="font-size:56px">4</div>
   <div style="font-size:17px;font-weight:600;margin-top:6px">lines held back on this
    invoice</div>
   <div style="font-size:16px;font-weight:500;color:{MUTE};margin-top:8px">
    Four held back beats one wrong total.</div></div>
 </div>
 <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
  <div style="display:flex;gap:16px;font-size:12px;font-weight:700;color:{MUTE};
    text-transform:uppercase;letter-spacing:.09em;padding-bottom:12px;
    border-bottom:2px solid {INK}">
   <span style="flex:0 0 250px">Line</span><span style="flex:0 0 130px">Pack</span>
   <span style="flex:1">Why it was not counted</span></div>
  {held}
 </div></div>""", SW, 640)


def s07_coverage():
    def group(level, items):
        rows = "".join(
            f'<div style="display:flex;align-items:center;gap:14px;padding:13px 0;'
            f'border-bottom:1px solid #1C202B">{badge(a, 40, dark=True)}'
            f'<div style="min-width:0"><div class=h2 style="font-size:15px;color:{PAPER}">{a}</div>'
            f'<div style="font-size:13.5px;color:{MUTE_DK};font-weight:500;margin-top:3px;'
            f'line-height:1.45">{d}</div></div></div>' for a, d in items)
        return (f'<div style="flex:1"><div style="font-size:13px;font-weight:700;color:{BLUE_UP};'
                f'text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px">{level}</div>'
                f'{rows}</div>')
    return page(f"""
<div style="width:{SW}px;height:920px;padding:70px {PAD}px;background:{COAL};display:flex;
  flex-direction:column;gap:36px">
 <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:70px">
  <div class=h1 style="font-size:52px;color:{PAPER}">Eighteen programmes,<br>three levels of
   government.</div>
  <div class=body-dk style="max-width:500px;font-size:18px">Each has its own renewal date,
   its own filing and its own inspector. Ledger holds all of them against one calendar.</div>
 </div>
 <div style="display:flex;gap:56px;flex:1">
  {"".join(group(k, v) for k, v in PROGRAMS.items())}</div>
 <div style="border-top:1px solid #1C202B;padding-top:22px;font-size:13.5px;
   color:{MUTE_DK};font-weight:500;max-width:1000px">{NON_AFFILIATION}</div>
</div>""", SW, 920)


def s08_proof():
    return page(f"""
<div style="width:{SW}px;height:560px;padding:70px {PAD}px;display:flex;gap:80px;
  align-items:center;background:{TINT}">
 <div style="flex:1.6">
  <div style="font-size:36px;font-weight:600;letter-spacing:-.03em;line-height:1.36">
   &ldquo;We lost SNAP authorization once over two produce varieties nobody noticed
   were gone. It took four months to get back. Now I photograph the invoice at the
   back door and I know before the truck leaves.&rdquo;</div>
  <div style="display:flex;align-items:center;gap:16px;margin-top:34px">
   <div style="width:48px;height:48px;border-radius:50%;background:{PAPER};display:flex;
     align-items:center;justify-content:center;font-weight:600;font-size:16px">RM</div>
   <div><div class=h2 style="font-size:17px">Rosa Medina</div>
    <div style="font-size:16px;font-weight:500;color:{MUTE}">
     Owner, Corner Market. Four stores in Los Angeles.</div></div></div></div>
 <div style="flex:0 0 320px;border-left:1px solid {LINE};padding-left:56px">
  <div class=h1 style="font-size:76px">0</div>
  <div style="font-size:18px;font-weight:600;margin-top:10px;line-height:1.45">
   line items counted that<br>Ledger wasn't certain about</div>
  <div style="margin-top:26px;padding-top:20px;border-top:1px solid {LINE};
    display:flex;justify-content:space-between;align-items:baseline">
   <span style="font-size:16px;font-weight:500;color:{MUTE}">Average scan</span>
   <span class=h2 style="font-size:24px">20s</span></div></div>
</div>""", SW, 560)


def s09_pricing():
    """Cards earn their border here: three discrete objects being compared."""
    def plan(name, price, per, blurb, feats, hi=False):
        rows = "".join(
            f'<div style="display:flex;gap:11px;align-items:flex-start;font-size:16px;'
            f'font-weight:500;color:{MUTE};margin-bottom:13px;line-height:1.45">'
            f'<span style="color:{BLUE};font-weight:700">&check;</span>{f}</div>' for f in feats)
        return (f'<div style="flex:1;padding:34px;display:flex;flex-direction:column;gap:20px;'
                f'border:{"2px solid " + BLUE if hi else "1px solid " + LINE};border-radius:16px">'
                f'<div><div style="display:flex;align-items:center;gap:10px">'
                f'<span class=h2 style="font-size:20px">{name}</span>'
                f'{pill("ok","Most stores",12) if hi else ""}</div>'
                f'<div style="font-size:16px;margin-top:9px;font-weight:500;color:{MUTE}">'
                f'{blurb}</div></div>'
                f'<div><span class=h1 style="font-size:{48 if price.startswith("$") else 30}px">'
                f'{price}</span><span style="font-size:16px;font-weight:500;color:{MUTE};'
                f'margin-left:4px">{per}</span></div>'
                f'<div style="flex:1">{rows}</div>'
                f'<div class="{"btn" if hi else "btn2"}" style="text-align:center;font-size:16px">'
                f'Start free</div></div>')
    return page(f"""
<div style="width:{SW}px;height:830px;padding:70px {PAD}px;display:flex;flex-direction:column;
  gap:36px">
 <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:70px">
  <div class=h1 style="font-size:52px">Priced per store,<br>not per scan.</div>
  <div class=body style="max-width:460px">Scan as often as you take deliveries.
   Cancel any time.</div></div>
 <div style="display:flex;gap:22px;flex:1">
  {plan("Single store", "$29", "/month", "One location, one owner.",
        ["Unlimited invoice scans", "All 18 programmes tracked", "Renewal reminders",
         "7 years of scan history"])}
  {plan("Group", "$24", "/store/month", "Two to ten locations.",
        ["Everything in Single store", "One view across every store", "Per-store scorecards",
         "Staff card tracking", "CSV export"], hi=True)}
  {plan("Chain", "Talk to us", "", "Eleven locations or more.",
        ["Everything in Group", "Bulk onboarding", "Priority support",
         "Custom thresholds"])}
 </div></div>""", SW, 830)


def s10_faq():
    def q(a, b):
        return (f'<div style="padding:26px 0;border-top:1px solid {LINE};display:flex;gap:60px">'
                f'<div class=h2 style="font-size:20px;flex:0 0 340px">{a}</div>'
                f'<div style="font-size:17px;font-weight:500;color:{MUTE};line-height:1.6;'
                f'flex:1">{b}</div></div>')
    return page(f"""
<div style="width:{SW}px;height:720px;padding:66px {PAD}px;display:flex;flex-direction:column">
 <div class=h1 style="font-size:52px;margin-bottom:26px">Questions we get asked.</div>
 <div style="flex:1">
  {q("I don't sell food. Is this for me?", "Yes. Auto parts, liquor, pharmacy and hardware stores all carry permit stacks with different renewal dates and different inspectors. The invoice scan is the food-specific part; the permit tracking is not.")}
  {q("Are you affiliated with SNAP or the EPA?", "No. Ledger tracks published programme requirements so you can see where you stand. It is not affiliated with, endorsed by, or acting for any agency, and no authorization decision is ever ours.")}
  {q("What if the photo is blurry?", "Ledger transcribes only what it can actually read. Anything ambiguous is listed as held back with a reason, and never counted. A blurry photo gives you a shorter count, not a wrong one.")}
  {q("Does a case count as one unit?", "No. A case becomes the number of sellable units inside it. A 24-pack is 24. If an item is priced by weight there is no unit count to read, so it is held back for you to confirm.")}
  {q("Do I need to integrate my POS?", "No. Ledger works from a photograph of the paper invoice and the permit details you enter once. Nothing to install at the register.")}
 </div></div>""", SW, 720)


def s11_cta():
    return page(f"""
<div style="width:{SW}px;height:460px;background:{COAL};display:flex;align-items:center;
  justify-content:space-between;padding:0 {PAD}px">
 <div>{lockup(30, PAPER, on_dark=True)}
  <div class=h1 style="font-size:52px;color:{PAPER};margin-top:26px">
   Find out which permit<br>is about to fail.</div></div>
 <div style="display:flex;flex-direction:column;gap:14px;align-items:flex-end">
  <span class=btn style="background:{PAPER};color:{INK};font-size:18px;padding:19px 34px">
   Start free</span>
  <span style="color:{MUTE_DK};font-size:16px;font-weight:500">First store free. No card.</span>
 </div></div>""", SW, 460)


def s12_footer():
    def col(h, items):
        return (f'<div style="flex:1"><div class=h2 style="font-size:15px;margin-bottom:16px">{h}</div>'
                + "".join(f'<div style="font-size:15px;font-weight:500;color:{MUTE};'
                          f'margin-bottom:11px">{i}</div>' for i in items) + '</div>')
    return page(f"""
<div style="width:{SW}px;height:440px;padding:56px {PAD}px;display:flex;flex-direction:column;
  justify-content:space-between;border-top:1px solid {LINE}">
 <div style="display:flex;gap:60px">
  <div style="flex:0 0 280px">{lockup_stacked(24)}</div>
  {col("Product", ["Permit tracking", "Invoice scanning", "Coverage", "Pricing"])}
  {col("Industries", ["Grocery & convenience", "Auto parts & service", "Liquor & tobacco",
                      "Pharmacy & health", "Hardware & garden"])}
  {col("Company", ["About", "Contact", "Privacy", "Terms"])}
 </div>
 <div style="border-top:1px solid {LINE};padding-top:24px">
  <div style="font-size:14px;font-weight:500;color:{MUTE};line-height:1.6;max-width:1000px">
   {NON_AFFILIATION}</div>
  <div style="display:flex;justify-content:space-between;margin-top:12px">
   <span style="font-size:15px;font-weight:500;color:{MUTE}">&copy; 2026 Ledger</span>
   <span style="font-size:15px;font-weight:500;color:{MUTE}">Los Angeles, CA</span></div></div>
</div>""", SW, 440)


SECTIONS = {
    "s01-nav.png": (s01_nav, SW, 104),
    "s02-hero.png": (s02_hero, SW, 820),
    "s03-coverage-strip.png": (s03_strip, SW, 290),
    "s04-industries.png": (s04_industries, SW, 700),
    "s05-how-it-works.png": (s05_how, SW, 1040),
    "s06-features.png": (s06_undercount, SW, 640),
    "s07-coverage.png": (s07_coverage, SW, 920),
    "s08-social-proof.png": (s08_proof, SW, 560),
    "s09-pricing.png": (s09_pricing, SW, 830),
    "s10-faq.png": (s10_faq, SW, 720),
    "s11-cta.png": (s11_cta, SW, 460),
    "s12-footer.png": (s12_footer, SW, 440),
}


if __name__ == "__main__":
    raise SystemExit(main())
