"""Tiny static-site builder.
Reads page bodies from /pages/*.body.html and wraps them with the shared
header/footer. Output goes alongside source — index.html stays hand-written
because it's the most important page.

Run: python3 build.py
"""
from pathlib import Path
import os, sys

ROOT = Path(__file__).parent
PAGES_DIR = ROOT / "pages"

NAV_LINKS = [
    ("how-it-works", "How it works"),
    ("industries", "Industries"),
    ("pricing", "Pricing"),
    ("case-studies", "Case studies"),
    ("about", "About"),
]

def header_html(current_slug, depth=0):
    # Always use absolute /-paths. Vercel's cleanUrls strips .html.
    prefix = "/"
    def _link(slug, label):
        cls = ' class="bf-current"' if slug == current_slug else ''
        return f'<a href="{prefix}{slug}"{cls}>{label}</a>'
    nav_html = "\n      ".join(_link(s, l) for s, l in NAV_LINKS)
    return f"""<header class="bf-header">
  <div class="bf-wrap bf-header-inner">
    <a href="{prefix}" class="bf-logo">Booth<span>funnel</span></a>
    <nav class="bf-nav">
      {nav_html}
    </nav>
    <div class="bf-header-cta">
      <a href="{prefix}contact" class="bf-btn bf-btn-ghost">Talk to us</a>
      <a href="{prefix}get-started" class="bf-btn bf-btn-primary">Start your booth</a>
    </div>
  </div>
</header>
"""

def footer_html(depth=0):
    prefix = "/"
    return f"""<footer class="bf-footer">
  <div class="bf-wrap">
    <div class="bf-footer-grid">
      <div>
        <div class="bf-logo" style="margin-bottom: 12px;">Booth<span>funnel</span></div>
        <p class="bf-body" style="max-width: 32ch;">Branded social photobooths that capture every guest's email and deliver a social-ready photo. Built so your floor doubles as a lead-generation channel.</p>
      </div>
      <div>
        <h4>Product</h4>
        <ul>
          <li><a href="{prefix}how-it-works">How it works</a></li>
          <li><a href="{prefix}pricing">Pricing</a></li>
          <li><a href="{prefix}case-studies">Case studies</a></li>
        </ul>
      </div>
      <div>
        <h4>Industries</h4>
        <ul>
          <li><a href="{prefix}industries/bars">Bars &amp; nightlife</a></li>
          <li><a href="{prefix}industries/restaurants">Restaurants</a></li>
          <li><a href="{prefix}industries/venues">Event venues</a></li>
          <li><a href="{prefix}industries/retail">Retail &amp; pop-ups</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="{prefix}about">About</a></li>
          <li><a href="{prefix}contact">Contact</a></li>
          <li><a href="{prefix}legal/terms">Terms</a></li>
          <li><a href="{prefix}legal/privacy">Privacy</a></li>
          <li><a href="{prefix}legal/dpa">DPA</a></li>
        </ul>
      </div>
    </div>
    <div class="bf-footer-bar">
      <div>© 2026 BoothFunnel, Inc.</div>
      <div>Made for venues that want to be remembered.</div>
    </div>
  </div>
</footer>
"""

PAGE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content="{description}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" rel="stylesheet">
  <link rel="icon" href="/brand/logos/seal-favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/css/site-v2.css" />
  <style>
    #bf-intro{{position:fixed;inset:0;background:#1A1612;z-index:9999;display:flex;align-items:center;justify-content:center;animation:bf-flash 1400ms cubic-bezier(.4,0,.2,1) forwards;pointer-events:none}}
    #bf-intro .m{{display:flex;align-items:center;gap:20px;opacity:0;animation:bf-mark 1400ms cubic-bezier(.4,0,.2,1) forwards}}
    #bf-intro .s{{width:52px;height:52px;border:1.5px solid #F2EAD8;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-style:italic;font-size:24px;color:#F2EAD8;line-height:1}}
    #bf-intro .w{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:42px;font-weight:500;color:#F2EAD8;letter-spacing:-.025em;line-height:1}}
    #bf-intro .w em{{font-family:Georgia,serif;font-style:italic;color:#B33A2A;font-weight:400}}
    @keyframes bf-flash{{0%,55%{{background:#1A1612;opacity:1}}60%{{background:#FFFFFF;opacity:1}}100%{{background:#FFFFFF;opacity:0}}}}
    @keyframes bf-mark{{0%{{opacity:0;transform:translateY(8px) scale(1)}}22%{{opacity:1;transform:translateY(0) scale(1)}}55%{{opacity:1;transform:scale(1)}}60%{{opacity:0;transform:scale(1.08)}}100%{{opacity:0;transform:scale(1.08)}}}}
    @media(prefers-reduced-motion:reduce){{#bf-intro{{display:none}}}}
    #bf-intro.is-done{{display:none}}
  </style>
  {extra_head}
</head>
<body>
<div id="bf-intro" aria-hidden="true"><div class="m"><div class="s">bf</div><div class="w">Booth<em>funnel</em></div></div></div>
{header}
{body}
{footer}
<script src="/js/site.js"></script>
{extra_scripts}
</body>
</html>
"""

def build_page(out_path, title, description, body, current_slug="", depth=0,
               extra_head="", extra_scripts=""):
    html = PAGE_TEMPLATE.format(
        title=title, description=description,
        extra_head=extra_head, extra_scripts=extra_scripts,
        header=header_html(current_slug, depth=depth),
        footer=footer_html(depth=depth),
        body=body,
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")
    print(f"  wrote {out_path.relative_to(ROOT)}")

# ---------- Page bodies (kept short here; long copy in pages/*.body.html) ----------

def read_body(name):
    return (PAGES_DIR / f"{name}.body.html").read_text(encoding="utf-8")

if __name__ == "__main__":
    print("Building BoothFunnel marketing pages...")

    PAGES = [
        # (output, title, description, slug, depth, body_file)
        ("how-it-works.html", "How it works — BoothFunnel",
         "From signup to your first branded photo in under a week. The full BoothFunnel onboarding walkthrough.",
         "how-it-works", 0, "how-it-works"),
        ("pricing.html", "Pricing — BoothFunnel",
         "Simple monthly plans. Hardware included, no installer fees, cancel anytime.",
         "pricing", 0, "pricing"),
        ("case-studies.html", "Case studies — BoothFunnel",
         "How real bars, restaurants, and venues use BoothFunnel to fill their floor and their feed.",
         "case-studies", 0, "case-studies"),
        ("about.html", "About — BoothFunnel",
         "Why we built BoothFunnel and who's behind it.",
         "about", 0, "about"),
        ("contact.html", "Contact — BoothFunnel",
         "Talk to a human about pricing, multi-location rollouts, or how the product works.",
         "contact", 0, "contact"),
        ("get-started.html", "Get started — BoothFunnel",
         "Configure your booth in 6 short steps and check out securely with Stripe.",
         "", 0, "get-started"),
        ("success.html", "You're in — BoothFunnel",
         "Order confirmed. Here's what happens next.",
         "", 0, "success"),
        ("cancel.html", "Checkout cancelled — BoothFunnel",
         "No charge made. Pick up where you left off whenever you're ready.",
         "", 0, "cancel"),
        ("industries/index.html", "Industries — BoothFunnel",
         "Bars, restaurants, event venues, retail. One booth, four ways to win.",
         "industries", 1, "industries-hub"),
        ("industries/bars.html", "Photobooths for bars and nightlife — BoothFunnel",
         "Capture peak-hour energy. Turn the queue into content. Branded prints every time.",
         "industries", 1, "industries-bars"),
        ("industries/restaurants.html", "Photobooths for restaurants — BoothFunnel",
         "Birthday tables, date nights, brunch crowds — every moment ends up branded yours.",
         "industries", 1, "industries-restaurants"),
        ("industries/venues.html", "Photobooths for event venues — BoothFunnel",
         "Weddings, corporate, private hire. One booth, every booking.",
         "industries", 1, "industries-venues"),
        ("industries/retail.html", "Photobooths for retail and pop-ups — BoothFunnel",
         "In-store moments that travel home in customers' camera rolls.",
         "industries", 1, "industries-retail"),
        ("legal/terms.html", "Terms — BoothFunnel",
         "Terms of service. Draft — replace before launch.",
         "", 1, "legal-terms"),
        ("legal/privacy.html", "Privacy — BoothFunnel",
         "Privacy policy. Draft — replace before launch.",
         "", 1, "legal-privacy"),
        ("legal/dpa.html", "Data processing addendum — BoothFunnel",
         "DPA covering customer photos processed on behalf of venues. Draft — replace before launch.",
         "", 1, "legal-dpa"),
    ]

    extra_head_for = {
        "get-started": '<link rel="stylesheet" href="/css/site-v2.css" />',
    }
    extra_scripts_for = {
        "get-started": '<script src="/js/checkout.js"></script>',
    }

    for out_rel, title, desc, slug, depth, body_name in PAGES:
        body = read_body(body_name)
        build_page(
            ROOT / out_rel, title, desc, body, current_slug=slug, depth=depth,
            extra_head=extra_head_for.get(body_name, ""),
            extra_scripts=extra_scripts_for.get(body_name, ""),
        )

    print("Done.")
