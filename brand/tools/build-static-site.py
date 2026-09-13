#!/usr/bin/env python3
"""Generate the static Ledger site into site/ for GitHub Pages.

A no-backend fallback for the demo: everything here is plain HTML, CSS and JS,
so it runs on static hosting with no server, no key and no build step. The scan
demo calls the live API when it is up and replays a saved scan when it is not.

Thresholds mirror lib/rule-engine.ts (USDA Criterion A, effective 4 Nov 2026):
seven varieties per category, three stocking units each, 84 units in total, and
a perishable variety in three of the four categories.

    python3 brand/tools/build-static-site.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "site"

VARIETIES, UNITS_PER, TOTAL_UNITS, PERISH = 7, 3, 84, 3
DISCLAIMER = ("Program names identify what Ledger tracks. Ledger is not affiliated with, "
              "endorsed by, or acting on behalf of any agency or program. A scan is a "
              "readiness estimate for the submitted image, not an official eligibility "
              "determination.")

SHORT = [("SNAP","Food benefits"),("WIC","Vendor status"),("EBT","Benefit payments"),
         ("EPA","Waste & refrigerant"),("OSHA","Workplace safety"),("ABC","Alcohol licence"),
         ("DOT","Hazmat shipping"),("CHP","Health permit"),("W&M","Scales"),("TRL","Tobacco")]

PROGRAMS = {
 "Federal":[("SNAP","Supplemental Nutrition Assistance Program retailer authorization"),
            ("WIC","Women, Infants and Children vendor authorization"),
            ("EBT","Electronic Benefit Transfer acceptance"),
            ("FDA","Food facility registration"),
            ("EPA","Used oil, hazardous waste and refrigerant handling"),
            ("OSHA","Hazard communication and workplace posting"),
            ("DOT","Hazardous materials shipping"),
            ("TTB","Alcohol and tobacco federal permits")],
 "State":[("ABC","Alcoholic beverage control licence"),("W&M","Weights and measures certification"),
          ("BAR","Automotive repair registration"),("TRL","Tobacco retail licence"),
          ("RSP","Seller's permit and resale certificate"),("BOP","Board of pharmacy licence")],
 "Local":[("CHP","County health permit"),("FIRE","Fire marshal inspection"),
          ("BTC","Business tax certificate"),("CoO","Certificate of occupancy")],
}

VERTICALS = [
 ("Grocery & convenience","SNAP and WIC stocking, health permit, tobacco, scales",
  ["SNAP","WIC","EBT","CHP","TRL","W&M"]),
 ("Auto parts & service","Used oil and hazardous waste, refrigerant handling, repair registration",
  ["EPA","OSHA","DOT","BAR","BTC","FIRE"]),
 ("Liquor & tobacco","State licence conditions, federal permits, age-verification posting",
  ["ABC","TTB","TRL","BTC","FIRE"]),
 ("Pharmacy & health","Board of pharmacy, controlled substances, cold chain",
  ["BOP","FDA","CHP","OSHA"]),
 ("Hardware & garden","Pesticide sales, hazardous storage, fire load, scales",
  ["EPA","OSHA","FIRE","W&M","BTC"]),
]

# What fixtures/sample-invoice.png actually yields, so the mock, the demo and
# the live API all describe the same delivery. See site/assets/app.js.
CATS = [("Dairy",3),("Grains",3),("Protein",3),("Fruits and Vegetables",1)]

# Worked from a second, produce-only invoice (Wholesale Produce Distributor,
# 20 July 2017, 12 rows). Nine of its twelve rows print no countable pack, which
# makes it the clearest example of what Ledger refuses to guess. Only the three
# rows with an explicit per-case count contribute: 4x16 + 8x24 + 6x24 = 400.
EXCLUDED_SOURCE = ("Wholesale Produce Distributor", 12, 9, 3, 400)
EXCLUDED = [("Yam Louisiana / Mississippi 40 #", "40 #", "A case weight, not a count of 40 units"),
            ("Tomato 4x4", "4x4", "A size grade, not a pack count"),
            ("Tomato, Grape pint", "pint", "A container with no multipack count"),
            ("Select Cucumber bushel", "bushel", "A container with no multipack count"),
            ("Green Cabbage Box", "Box", "A container with no multipack count"),
            ("Roma Tomato", "\u2014", "No pack count printed on the line")]

FAQ = [
 ("New rules start 4 November 2026. What changes?",
  f"The stocking standard rises to {VARIETIES} varieties in each of four staple categories, "
  f"{UNITS_PER} stocking units per variety, {TOTAL_UNITS} units in total, and a perishable "
  f"variety in {PERISH} of the 4 categories. A store found short can be withdrawn from SNAP "
  "and must wait six months to reapply."),
 ("I don't sell food. Is this for me?",
  "Yes. Auto parts, liquor, pharmacy and hardware stores all carry permit stacks with different "
  "renewal dates and different inspectors. The invoice scan is the food-specific part; the "
  "permit tracking is not."),
 ("Are you affiliated with SNAP or the EPA?",
  "No. Ledger tracks published programme requirements so you can see where you stand. It is not "
  "affiliated with, endorsed by, or acting for any agency, and no eligibility determination is "
  "ever ours."),
 ("What if the photo is blurry?",
  "Ledger transcribes only what it can actually read. Anything ambiguous is listed as held back "
  "with a reason, and never counted. A blurry photo gives you a shorter count, not a wrong one."),
 ("Does a case count as one unit?",
  "No. A case becomes the number of sellable units inside it. A 24-pack is 24. If an item is "
  "priced by weight there is no unit count to read, so it is held back for you to confirm."),
]


def tile(a, cls="tile"):
    return f'<div class="{cls}">{a}</div>'


def head(title, desc, rel=""):
    return f"""<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta property="og:image" content="{rel}assets/img/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{rel}assets/favicon.ico" sizes="any">
<link rel="icon" href="{rel}assets/logo/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{rel}assets/apple-touch-icon-180.png">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="{rel}assets/style.css">
<script>document.documentElement.className="js"</script>
</head><body>"""


def nav(rel=""):
    links = "".join(f'<a href="{rel}index.html#{i}">{n}</a>'
                    for n, i in [("Industries","industries"),("How it works","how"),
                                 ("Coverage","coverage"),("Pricing","pricing")])
    return f"""<header class="nav"><div class="wrap nav__in">
<a href="{rel}index.html"><img src="{rel}assets/logo/ledger-lockup.svg" alt="Ledger" style="height:26px"></a>
<nav class="nav__links">{links}</nav>
<div class="nav__cta"><a href="{rel}demo.html" style="font-size:16px;font-weight:600">Sign in</a>
<a class="btn" style="padding:12px 22px;font-size:16px" href="{rel}demo.html">Start free</a></div>
</div></header>"""


def cat_bar(name, have, need=VARIETIES):
    """Same markup as catBar() in site/assets/app.js, rendered at build time so
    the bars are visible before (and without) the script."""
    ok = have >= need
    segs = "".join(
        f'<div class="cat__seg {"on" if ok else "bad"}" style="transition-delay:{i*60}ms"></div>'
        if i < have else f'<div class="cat__seg" style="transition-delay:{i*60}ms"></div>'
        for i in range(max(need, have)))
    return (f'<div class="cat"><div class="cat__top">'
            f'<span class="h" style="font-size:15px">{name}</span>'
            f'<span class="pill {"pill--ok" if ok else "pill--bad"}"><span class="dot"></span>'
            f'{have} of {need}</span></div><div class="cat__segs">{segs}</div></div>')


def app_mock():
    bars = "".join(f'<div data-catbar="{n}|{v}">{cat_bar(n, v)}</div>' for n, v in CATS)
    side = "".join(f'<div class="{"on" if n=="Dashboard" else ""}">{n}</div>'
                   for n in ["Dashboard","Scans","Staples","Licenses","Staff","Settings"])
    return f"""<div class="win"><div class="win__bar">
<div class="win__dot"></div><div class="win__dot"></div><div class="win__dot"></div>
<div class="win__url"><span>app.ledger.co/dashboard</span></div><div style="width:66px"></div></div>
<div class="app"><aside class="app__side">
<img src="assets/logo/ledger-lockup.svg" alt="" style="height:21px">
<div class="app__nav">{side}</div></aside>
<div class="app__main">
<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
<div><div style="font-size:22px;font-weight:700;letter-spacing:-.03em">Corner Market #17</div>
<div class="small" style="margin-top:4px">Valley Fresh invoice VF-88213 &middot; scanned 2 minutes ago</div></div>
<span class="pill pill--bad"><span class="dot"></span>4 categories short</span></div>
<div class="card" style="padding:18px 20px;display:flex;flex-direction:column;gap:14px">{bars}</div>
<div class="card" style="padding:14px 18px;display:flex;gap:12px;align-items:center;background:var(--wash);border:0">
<span style="font-size:13px;font-weight:600">4 lines not counted</span>
<span class="small" style="font-size:12px;flex:1">Roma tomatoes and yellow onions print a case weight, not a unit count.</span>
</div></div></div></div>"""


def section_strip():
    items = "".join(f'<div class="strip__i reveal" data-delay="{i*40}">{tile(a)}<span>{d}</span></div>'
                    for i, (a, d) in enumerate(SHORT))
    return f"""<section class="sec" style="padding:52px 0;border-bottom:1px solid var(--line)">
<div class="wrap"><div class="small reveal" style="font-size:17px;font-weight:600;margin-bottom:32px">
Ten of the eighteen programmes Ledger tracks. The full list is further down.</div>
<div class="strip">{items}</div>
<p class="disclaimer" style="margin-top:26px;font-size:13px">{DISCLAIMER}</p></div></section>"""


def section_industries():
    rows = "".join(
        f'<div class="ind reveal" data-delay="{i*50}"><div class="ind__n"><div class="h">{n}</div></div>'
        f'<div class="ind__d">{d}</div><div class="ind__b">'
        + "".join(tile(c, "tile tile--sm") for c in cs) + '</div></div>'
        for i, (n, d, cs) in enumerate(VERTICALS))
    return f"""<section class="sec" id="industries"><div class="wrap">
<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:70px;
  margin-bottom:30px;flex-wrap:wrap">
<h2 class="d reveal">Not just grocery.</h2>
<p class="body reveal" data-delay="60" style="max-width:520px">Any small retailer carries a stack of
permits that expire on different dates and answer to different inspectors. Ledger holds the whole
stack.</p></div>{rows}</div></section>"""


def section_how():
    permits = "".join(
        f'<div style="display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--line);padding:13px 0">'
        f'{tile(a,"tile tile--sm")}<span style="font-size:15px;font-weight:600">{n}</span></div>'
        for a, n in [("SNAP","SNAP retailer authorization"),("CHP","County health permit"),
                     ("W&M","Weights and measures")])
    bars = "".join(f'<div data-catbar="{n}|{v}" style="padding:9px 0">{cat_bar(n, v)}</div>'
                   for n, v in CATS)
    fixes = "".join(
        f'<div style="display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--line);padding:13px 0">'
        f'<div style="width:17px;height:17px;border:2px solid var(--line);border-radius:5px"></div>'
        f'<span style="font-size:15px;font-weight:600;flex:1">{n}</span>'
        f'<span style="font-size:14px;font-weight:600;color:{c}">{d}</span></div>'
        for n, d, c in [(f"Add {VARIETIES - dict(CATS)['Fruits and Vegetables']} produce varieties","blocks review","var(--bad)"),
                        (f"Add {VARIETIES - dict(CATS)['Grains']} grain varieties","blocks review","var(--bad)"),
                        ("Renew health permit","overdue","var(--bad)"),
                        ("WIC price list","9 days","var(--warn)")])
    steps = [("Add your permits","Tell Ledger what you hold. It works out which rules apply to your "
              "kind of store and when each one comes due.", permits),
             ("See where you stand", f"Every requirement against its threshold, re-checked after each "
              f"scan. {VARIETIES} varieties per category, {TOTAL_UNITS} units in total.", bars),
             ("Fix what blocks you","Ranked by what closes you down first, not by date. The top item "
              "is always the one that matters today.", fixes)]
    out = ""
    for i, (t, b, v) in enumerate(steps):
        out += (f'<div class="step {"step--flip" if i%2 else ""} reveal" data-delay="{i*60}">'
                f'<div class="step__t"><div style="display:flex;align-items:baseline;gap:14px">'
                f'<span class="step__n">0{i+1}</span><span class="h" style="font-size:26px">{t}</span></div>'
                f'<p class="body" style="margin-top:12px">{b}</p></div>'
                f'<div class="step__v">{v}</div></div>')
    return f"""<section class="sec sec--tint" id="how"><div class="wrap">
<h2 class="d reveal" style="margin-bottom:20px">Set it up once.<br>It runs itself.</h2>{out}</div></section>"""


def section_undercount():
    src, lines, held, counted, total = EXCLUDED_SOURCE
    rows = "".join(f'<tr><td class="k">{n}</td><td class="small" style="font-size:15px">{p}</td>'
                   f'<td>{w}</td></tr>' for n, p, w in EXCLUDED)
    return f"""<section class="sec"><div class="wrap" style="display:flex;gap:80px;flex-wrap:wrap">
<div style="flex:1 1 520px;min-width:min(300px,100%)">
<h2 class="d reveal">Built to<br>undercount.</h2>
<p class="body reveal" data-delay="60" style="margin-top:22px;font-size:18px">Telling a store it
meets the standard when it doesn't is the expensive mistake. A pack count is only ever read from an
explicit printed expression, and an unknown one is never rounded up to one. A case sold by weight
has no unit count to read, so Ledger prints the reason instead of inventing a number.</p>
<div class="rule reveal" data-delay="120" style="margin-top:28px;padding-top:24px">
<div style="font-size:56px;font-weight:700;letter-spacing:-.04em" data-count="{held}">{held}</div>
<div style="font-size:17px;font-weight:600;margin-top:6px">of {lines} lines held back</div>
<div class="small" style="margin-top:8px">{src}, {lines} rows. Only {counted} print a per-case
count, so only {counted} can contribute &mdash; {total} stocking units in total. Nine held back
beats one wrong number.</div></div></div>
<div style="flex:1;min-width:320px" class="reveal" data-delay="100">
<table><thead><tr><th>Line</th><th>Pack read</th><th>Why it was not counted</th></tr></thead>
<tbody>{rows}</tbody></table></div></div></section>"""


def section_coverage():
    cols = ""
    for level, items in PROGRAMS.items():
        rows = "".join(f'<div class="cov__r">{tile(a,"tile tile--sm tile--dk")}'
                       f'<div><b>{a}</b><span>{d}</span></div></div>' for a, d in items)
        cols += f'<div class="cov__c reveal"><div class="eyebrow" style="color:var(--blue-lift);margin-bottom:16px">{level}</div>{rows}</div>'
    return f"""<section class="sec sec--coal" id="coverage"><div class="wrap">
<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:70px;
  margin-bottom:36px;flex-wrap:wrap">
<h2 class="d reveal" style="color:var(--paper)">Eighteen programmes,<br>three levels of government.</h2>
<p class="body body--dk reveal" data-delay="60" style="max-width:500px;font-size:18px">Each has its own
renewal date, its own filing and its own inspector. Ledger holds all of them against one calendar.</p></div>
<div class="cov">{cols}</div>
<p class="disclaimer rule--dk" style="margin-top:30px;padding-top:22px">{DISCLAIMER}</p></div></section>"""


def section_proof():
    return f"""<section class="sec sec--tint"><div class="wrap" style="display:flex;gap:80px;
align-items:center;flex-wrap:wrap">
<div style="flex:1.6;min-width:320px">
<blockquote class="reveal" style="font-size:clamp(22px,2.4vw,34px);font-weight:600;
letter-spacing:-.03em;line-height:1.38">&ldquo;We lost SNAP authorization once over two produce
varieties nobody noticed were gone. It took four months to get back. Now I photograph the invoice at
the back door and I know before the truck leaves.&rdquo;</blockquote>
<div class="reveal" data-delay="80" style="display:flex;align-items:center;gap:16px;margin-top:32px">
<img src="assets/logo/ledger-mark.svg" alt="" style="width:34px;flex:0 0 34px">
<div><div class="h" style="font-size:17px">The problem, in an owner's words</div>
<div class="small">An illustrative scenario written for this demo, not a customer quote.</div></div></div></div>
<div class="reveal" data-delay="120" style="flex:1 1 260px;min-width:min(260px,100%);border-left:1px solid var(--line);padding-left:56px">
<div style="font-size:76px;font-weight:700;letter-spacing:-.04em" data-count="0">0</div>
<div style="font-size:18px;font-weight:600;margin-top:10px;line-height:1.45">line items counted that<br>
Ledger wasn't certain about</div>
<div class="rule" style="margin-top:26px;padding-top:20px;display:flex;justify-content:space-between">
<span class="small">Typical scan</span><span class="h" style="font-size:24px">20&ndash;35s</span></div></div>
</div></section>"""


def section_pricing():
    plans = [("Single store","$29","/month","One location, one owner.",
              ["Unlimited invoice scans","All 18 programmes tracked","Renewal reminders",
               "7 years of scan history"],False),
             ("Group","$24","/store/month","Two to ten locations.",
              ["Everything in Single store","One view across every store","Per-store scorecards",
               "Staff card tracking","CSV export"],True),
             ("Chain","Talk to us","","Eleven locations or more.",
              ["Everything in Group","Bulk onboarding","Priority support","Custom thresholds"],False)]
    out = ""
    for i, (n, p, per, b, fs, hi) in enumerate(plans):
        lis = "".join(f"<li>{f}</li>" for f in fs)
        hi_cls = "plan--hi" if hi else ""
        pill = ('<span class="pill pill--ok"><span class="dot"></span>Most stores</span>'
                if hi else "")
        price_cls = "" if p.startswith("$") else "text"
        btn_cls = "btn" if hi else "btn btn--ghost"
        out += (f'<div class="plan {hi_cls} reveal" data-delay="{i*60}">'
                f'<div><div style="display:flex;align-items:center;gap:10px">'
                f'<span class="h" style="font-size:20px">{n}</span>{pill}</div>'
                f'<div class="small" style="margin-top:9px">{b}</div></div>'
                f'<div><span class="plan__price {price_cls}">{p}</span>'
                f'<span class="small" style="margin-left:4px">{per}</span></div>'
                f'<ul>{lis}</ul>'
                f'<a class="{btn_cls}" style="text-align:center" href="demo.html">Start free</a></div>')
    return f"""<section class="sec" id="pricing"><div class="wrap">
<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:70px;
margin-bottom:36px;flex-wrap:wrap">
<h2 class="d reveal">Priced per store,<br>not per scan.</h2>
<p class="body reveal" data-delay="60" style="max-width:460px">Scan as often as you take deliveries.
Cancel any time.</p></div>
<div class="plans">{out}</div></div></section>"""


def section_faq():
    rows = "".join(f'<div class="q reveal" data-delay="{i*40}"><div class="q__k">{q}</div>'
                   f'<div class="q__a">{a}</div></div>' for i, (q, a) in enumerate(FAQ))
    return f"""<section class="sec" id="faq"><div class="wrap">
<h2 class="d reveal" style="margin-bottom:26px">Questions we get asked.</h2>{rows}</div></section>"""


def section_cta():
    return """<section class="sec sec--coal"><div class="wrap" style="display:flex;
align-items:center;justify-content:space-between;gap:40px;flex-wrap:wrap">
<div class="reveal"><img src="assets/logo/ledger-lockup-inverse.svg" alt="Ledger" style="height:30px">
<h2 class="d" style="color:var(--paper);margin-top:24px">Find out which permit<br>is about to fail.</h2></div>
<div class="reveal" data-delay="80" style="display:flex;flex-direction:column;gap:13px;align-items:flex-end">
<a class="btn btn--paper" href="demo.html">Start free</a>
<span class="small body--dk" style="color:var(--mute-dark)">First store free. No card.</span></div>
</div></section>"""


def footer():
    cols = [("Product",["Permit tracking","Invoice scanning","Coverage","Pricing"]),
            ("Industries",[v[0] for v in VERTICALS]),
            ("Company",["About","Contact","Privacy","Terms"])]
    out = "".join(f'<div class="foot__c"><h4>{h}</h4>'
                  + "".join(f'<a href="#">{i}</a>' for i in items) + '</div>' for h, items in cols)
    return f"""<footer class="foot"><div class="wrap">
<div class="foot__cols"><div class="foot__c" style="flex:1 1 240px;min-width:min(240px,100%)">
<img src="assets/logo/ledger-lockup-stacked.svg" alt="Ledger" style="width:150px">
<p class="small" style="margin-top:15px">Permit and stocking compliance for<br>independent retailers.</p>
</div>{out}</div>
<div class="rule" style="margin-top:36px;padding-top:24px">
<p class="disclaimer">{DISCLAIMER}</p>
<div style="display:flex;justify-content:space-between;margin-top:12px;flex-wrap:wrap;gap:10px">
<span class="small">&copy; 2026 Ledger</span><span class="small">Los Angeles, CA</span></div></div>
</div></footer>"""


def index():
    return (head("Ledger — every permit your store has to hold",
                 "New SNAP stocking rules start 4 November 2026. Photograph an invoice and find out "
                 "where your store stands against them.")
    + nav() + f"""
<section class="hero">
 <div class="hero__grid"></div><div class="hero__glow"></div>
 <div class="wrap hero__in">
  <div class="badge-pill reveal"><img src="assets/logo/ledger-mark.svg" alt="" style="height:19px">
   <span class="eyebrow">New SNAP rules &middot; 4 November 2026</span></div>
  <h1 class="d-xl reveal" data-delay="60">Would your store meet<br>the new stocking rules?</h1>
  <p class="body-l reveal" data-delay="120">From 4 November 2026 a SNAP retailer needs
   {VARIETIES} varieties in each of four staple categories and {TOTAL_UNITS} stocking units in total.
   Photograph one delivery invoice and Ledger estimates where you're short.</p>
  <div class="hero__btns reveal" data-delay="180">
   <a class="btn" href="demo.html">Scan an invoice</a>
   <a class="btn btn--coal" href="#how">See how it works</a></div>
  <div class="hero__trust reveal" data-delay="240">
   <span class="small">No integration</span><span class="small">Works from a phone photo</span>
   <span class="small">First store free</span></div>
  <div class="hero__shot reveal" data-delay="300">{app_mock()}</div>
 </div></section>
{section_strip()}{section_industries()}{section_how()}{section_undercount()}
{section_coverage()}{section_proof()}{section_pricing()}{section_faq()}{section_cta()}{footer()}
<script type="module" src="assets/app.js"></script></body></html>""")


def demo():
    return (head("Scan an invoice — Ledger", "Photograph a delivery invoice and see where you stand.")
    + nav() + f"""
<section class="sec"><div class="wrap" style="max-width:1000px">
<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap">
<div><h1 class="d">Scan an invoice.</h1>
<p class="body" style="margin-top:16px;font-size:18px;max-width:620px">Photograph a delivery invoice.
Ledger reads every printed line, counts stocking units by staple category, and shows you every line
it refused to count.</p></div>
<div class="lang" role="group" aria-label="Language">
 <button type="button" data-lang="en" class="on">English</button>
 <button type="button" data-lang="es">Español</button></div>
</div>

<div id="stage" style="margin-top:34px">
 <label class="drop" id="drop" for="file">
  <img src="assets/logo/ledger-mark.svg" alt="" style="width:64px">
  <div><div class="h" style="font-size:21px" data-t="dropTitle">Drop an invoice photo</div>
  <div class="small" style="margin-top:7px" data-t="dropSub">JPEG or PNG, up to 8 MB &middot; a phone photo is fine</div></div>
  <span class="btn" data-t="choose">Choose a photo</span>
  <span class="small" id="or">or <a id="sample" href="#" data-t="sample">use the sample invoice</a></span>
 </label>
 <input id="file" type="file" accept="image/*" hidden>
</div>

<div id="loading" hidden style="text-align:center;padding:70px 0">
 <img class="spin" src="assets/logo/ledger-mark-animated.svg" alt="">
 <div class="h" style="margin-top:22px" id="l1">Reading the invoice&hellip;</div>
 <div class="small" style="margin-top:8px" id="l2">Two passes: transcribe, then classify.</div>
 <div class="small" style="margin-top:6px"><span id="secs">0</span>s</div>
</div>

<div id="result" class="result" hidden></div>
</div></section>
{footer()}
<script type="module">
import {{ runScan, catBar, score, fixes, heldBack, RULES, COPY, FALLBACK }} from './assets/app.js';

const T = {{
  en: {{ dropTitle:'Drop an invoice photo', dropSub:'JPEG or PNG, up to 8 MB · a phone photo is fine',
        choose:'Choose a photo', sample:'use the sample invoice', or:'or' }},
  es: {{ dropTitle:'Suelte una foto de la factura', dropSub:'JPEG o PNG, hasta 8 MB · una foto del teléfono sirve',
        choose:'Elegir una foto', sample:'usar la factura de ejemplo', or:'o' }},
}};

const $ = (id) => document.getElementById(id);
const stage=$('stage'), loading=$('loading'), result=$('result'), drop=$('drop'),
      file=$('file'), secs=$('secs');
let lang='en', last=null;

// --------------------------------------------------------------- language
document.querySelectorAll('.lang button').forEach((b)=>b.addEventListener('click',()=>{{
  lang=b.dataset.lang;
  document.querySelectorAll('.lang button').forEach((x)=>x.classList.toggle('on',x===b));
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-t]').forEach((el)=>{{ el.textContent=T[lang][el.dataset.t]; }});
  $('or').firstChild.textContent=T[lang].or+' ';
  $('l1').textContent=COPY[lang].reading; $('l2').textContent=COPY[lang].readingSub;
  if(last) render(last);                      // re-render in place, no re-scan
}}));

// ------------------------------------------------------------------- input
['dragenter','dragover'].forEach((e)=>drop.addEventListener(e,(ev)=>{{ev.preventDefault();drop.classList.add('over')}}));
['dragleave','drop'].forEach((e)=>drop.addEventListener(e,(ev)=>{{ev.preventDefault();drop.classList.remove('over')}}));
drop.addEventListener('drop',(ev)=>{{ if(ev.dataTransfer.files[0]) go(ev.dataTransfer.files[0]); }});
file.addEventListener('change',()=>{{ if(file.files[0]) go(file.files[0]); }});
$('sample').addEventListener('click',async (ev)=>{{
  ev.preventDefault(); ev.stopPropagation();
  try {{
    const blob=await fetch('assets/img/sample-invoice.png').then((r)=>r.json ? r.blob() : r.blob());
    go(new File([blob],'sample-invoice.png',{{type:'image/png'}}));
  }} catch {{
    // No sample on disk and no network: replay the saved scan directly.
    show({{...FALLBACK, categories:FALLBACK.categories, note:COPY[lang].savedScan}});
  }}
}});

async function go(f){{
  stage.hidden=true; loading.hidden=false; result.innerHTML='';
  let n=0; secs.textContent='0';
  const t=setInterval(()=>{{ secs.textContent=String(++n); }},1000);
  const data=await runScan(f, COPY[lang]);
  clearInterval(t); loading.hidden=true;
  show(data);
}}

function show(d){{ stage.hidden=true; loading.hidden=true; last=d; render(d); }}

const esc=(s)=>String(s).replace(/[&<>]/g,(c)=>({{'&':'&amp;','<':'&lt;','>':'&gt;'}}[c]));

// ------------------------------------------------------------------ render
function render(d){{
  const c=COPY[lang], r=score(d), fx=fixes(r,c);
  const label=(k)=>c.categoryLabels[k];

  const bars=r.cats.map((x)=>catBar(label(x.key),x.varieties)).join('');
  const items=d.items.map((i)=>`<tr><td class="k">${{esc(i[0])}}</td>
    <td class="small" style="font-size:15px">${{esc(i[2])}}</td>
    <td class="small" style="font-size:15px">${{i[3]!=null&&i[4]!=null?`${{i[3]}} &times; ${{i[4]}}`:'&mdash;'}}</td>
    <td><span class="pill pill--neut">${{esc(label(i[1])||i[1])}}</span></td>
    <td style="text-align:right;font-variant-numeric:tabular-nums">${{i[5]}}</td></tr>`).join('');
  const excl=heldBack(d.excluded, lang).map((e)=>`<tr><td class="k">${{esc(e[0])}}</td>
    <td class="small" style="font-size:15px">${{esc(e[1])}}</td>
    <td>${{esc(e[2])}}</td></tr>`).join('');
  const fixRows=fx.map((f)=>`<tr><td><span class="pill pill--neut">${{esc(f.category)}}</span></td>
    <td class="k">${{esc(f.item)}}</td><td>${{esc(f.reason)}}</td></tr>`).join('');

  const stat=(k,v,ok)=>`<div class="stat__c"><div class="small">${{k}}</div>
    <div class="stat__v" style="color:${{ok?'var(--blue)':'var(--bad)'}}">${{v}}</div></div>`;

  result.innerHTML=`
  ${{d.note?`<div class="pill pill--warn" style="margin-bottom:20px"><span class="dot"></span>${{esc(d.note)}}</div>`:''}}
  <div class="card" style="padding:26px;border-color:${{r.pass?'var(--blue)':'var(--bad)'}}">
   <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap">
    <div style="max-width:600px"><div class="d" style="font-size:30px;line-height:1.12">${{r.pass?c.pass:c.fail}}</div>
    <div class="small" style="margin-top:10px">${{esc(d.store)}} &middot; ${{esc(d.invoice)}}
     &middot; ${{d.rawLineCount}} ${{lang==='es'?'renglones leídos':'lines read'}}</div></div>
    <span class="pill ${{r.pass?'pill--ok':'pill--bad'}}"><span class="dot"></span>${{r.varietiesMet}} / ${{RULES.categoryCount}}</span></div>
  </div>

  <div class="stat" style="margin-top:16px">
   ${{stat(c.catsAt(RULES.varietiesPerCategory), `${{r.varietiesMet}} / ${{RULES.categoryCount}}`, r.varietiesMet===RULES.categoryCount)}}
   ${{stat(c.totalUnits, `${{r.totalUnits}} / ${{RULES.totalUnits}}`, r.totalUnits>=RULES.totalUnits)}}
   ${{stat(c.perishables, `${{r.perishablesMet}} / ${{RULES.perishableCategories}}`, r.perishablesMet>=RULES.perishableCategories)}}
  </div>

  <div class="card" style="padding:22px;margin-top:16px;display:flex;flex-direction:column;gap:14px">${{bars}}</div>

  ${{fx.length?`<h3 class="h" style="margin-top:36px">${{c.fixes}}</h3>
  <p class="body" style="margin-top:8px;font-size:16px">${{c.fixesLead}}</p>
  <table style="margin-top:12px"><thead><tr><th>${{c.category}}</th><th>${{c.item}}</th>
    <th>${{c.reason}}</th></tr></thead><tbody>${{fixRows}}</tbody></table>`:''}}

  <h3 class="h" style="margin-top:36px">${{c.counted}}</h3>
  <table style="margin-top:12px"><thead><tr><th>${{c.line}}</th><th>${{c.variety}}</th>
    <th>${{c.pack}}</th><th>${{c.category}}</th>
    <th style="text-align:right">${{c.units}}</th></tr></thead><tbody>${{items}}</tbody></table>

  <h3 class="h" style="margin-top:36px">${{c.notCounted}} &middot; ${{d.excluded.length}}</h3>
  <p class="body" style="margin-top:8px;font-size:16px">${{c.notCountedLead}}</p>
  <div class="excl" style="margin-top:12px"><table><thead><tr><th>${{c.line}}</th><th>${{c.pack}}</th>
    <th>${{c.why}}</th></tr></thead><tbody>${{excl}}</tbody></table></div>

  <p class="disclaimer" style="margin-top:30px">${{c.disclosure}}</p>
  <button type="button" class="btn btn--ghost" id="again" style="margin-top:22px">${{c.scanAnother}}</button>`;
  result.hidden=false;
  requestAnimationFrame(()=>result.querySelectorAll('.cat__seg').forEach((s)=>s.style.transform='scaleX(1)'));
  $('again').addEventListener('click',()=>{{
    last=null; result.innerHTML=''; stage.hidden=false; file.value='';
    window.scrollTo({{top:0,behavior:'smooth'}});
  }});
}}
</script></body></html>""")


def check_assets():
    """The demo uploads site/assets/img/sample-invoice.png, and the saved scan in
    site/assets/app.js is that image's expected result. If it ever drifts from
    fixtures/sample-invoice.png the two stop describing the same delivery."""
    import filecmp
    fixture = ROOT / "fixtures" / "sample-invoice.png"
    copy = OUT / "assets" / "img" / "sample-invoice.png"
    if fixture.exists() and copy.exists() and not filecmp.cmp(fixture, copy, shallow=False):
        print("WARNING: site/assets/img/sample-invoice.png differs from "
              "fixtures/sample-invoice.png. Re-copy it, or the saved scan in "
              "site/assets/app.js no longer describes the image the demo uploads.")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "index.html").write_text(index(), encoding="utf-8")
    (OUT / "demo.html").write_text(demo(), encoding="utf-8")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")   # serve _-prefixed paths
    print(f"index.html  {len(index()):,} bytes")
    print(f"demo.html   {len(demo()):,} bytes")
    check_assets()
    print(f"-> {OUT}")


if __name__ == "__main__":
    main()
