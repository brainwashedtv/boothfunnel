# BoothFunnel — Project Memory

Persistent facts for any future Claude session working on this project. Read this before doing anything else.

## What BoothFunnel actually is — corrected May 5, 2026

**No physical printing.** The product does NOT produce physical paper photos. There is no thermal printer, no print frame on paper, no walk-away-with-a-print moment.

**The delivery system is digital — and that's the whole point.**
- Customers take a photo at the booth.
- To get the photo, they enter their **email or phone number**.
- The system sends a digital, social-optimized version to that contact.
- The branded frame is applied digitally before sending.
- Photos are sized for social posting (square or vertical).

**The data is the product (for the venue).** Digital delivery is the excuse to capture leads. The venue ends up with an email/phone list of every guest who used the booth — that's the primary value to the operator. The branded social content is the secondary value.

## What this means for the brand identity

The Heritage Frame brand direction (cream + ink + Kodak red, sans + italic serif moment, the bf seal) **still works** — the film/Polaroid aesthetic is about the FEEL of the photo (instant, branded, of-a-moment), not whether it's physical. Apps like Dispo, Hipstamatic, and VSCO all evoke film successfully without printing.

**What changes in the brand:**
- "Print frame device" → "Digital frame device" — applied as a frame around the photo in the email/SMS the customer receives. Still uses the Polaroid-esque white border treatment.
- The seal stamp → a digital watermark in the corner of every photo delivered. Same red-circle bf design, just applied digitally instead of printed.
- "Every guest leaves with a print and a post" → "Every guest leaves with a branded photo on their phone — and you leave with their email."

## What this means for the website

The current copy on boothfunnel.com is heavily print-centric. **Many references need to change**, including:

- Pricing page: "Unlimited branded prints" → drop entirely. Replace with "Unlimited captures" or "Unlimited digital deliveries."
- "What every plan includes" — drop print credit references; add "lead capture dashboard," "email/SMS delivery," "social-optimized output."
- Hero: "every photo your customers post is tagged yours" stays — it's about the social post, not prints.
- How-it-works: drop the "print drops out in 8 seconds" line. Replace with the email/SMS delivery flow.
- Industry pages (bars/restaurants/venues/retail): all reference "branded prints," "print credits," "print frames swapped via app." Rewrite as digital frames, digital deliveries, branded watermarks.
- Case studies: "4,200 branded photos printed" → "4,200 branded photos delivered" (still works — the metric is captures/deliveries, not prints).
- About page: rewrite the origin story to be digital-native.
- Get Started checkout: the "branding basics" step asks about the print frame; should be the digital frame.

## What stays the same on the website

- Wordmark, seal, color palette, typography system — all unchanged.
- Hero polaroid grid mockup — still works as a visual metaphor for the "framed photo" output, even though the output is digital.
- Voice principles (operator-first, quietly confident, specific not abstract) — all hold.
- The 6-step checkout structure.

## What this means for the brand deck

The deck has print-explicit language in: the manifesto, photography direction, application slides. Needs revision before final hand-off. The visual identity is sound; the copy framing isn't.

## Positioning — corrected May 5, 2026 (evening)

**Old framing:** "A guest list, disguised as a photobooth." (lead-capture-first)
**New framing:** "A marketing agency, hidden in a photobooth." (full-stack marketing service)

The product is positioned as a marketing agency, not a lead-gen tool. The pitch:

**One photo. Three marketing channels. Zero user input.**

When a guest takes a photo, the booth automatically generates three parallel marketing outputs:

1. **Customer's socials** — the guest posts the branded photo to their feed, reaching their audience for the venue. Organic UGC at scale.
2. **Venue's owned media** — the photo enters the operator's content library, ready to be reposted on the venue's social accounts and used in paid ads. Evergreen content production.
3. **Customer database** — the email/phone captured at the booth lands in the operator's CRM, ready for direct email/SMS marketing.

This is the new focal point of the website's home page and brand deck.

## Pricing reality (revised May 7, 2026)

**Three commitment tiers, all same fully-featured package:**

| Plan | Monthly rate | Commitment | Billing cadence | Charge per cycle |
|---|---|---|---|---|
| Flexible | $495/mo | 3-month minimum | Every 3 months | $1,485 |
| Annual (most popular) | $365/mo | 12-month | Every 6 months | $2,190 |
| Bulk (50+) | $285/mo per booth | 12-month, 50+ units | Every 6 months | $1,710 × N booths |

Internal plan keys used by the code (`plan` field in checkout payload):
- `flexible` → Stripe price env: `STRIPE_PRICE_FLEXIBLE` (recurring every 3 months at $1,485)
- `annual`   → Stripe price env: `STRIPE_PRICE_ANNUAL` (recurring every 6 months at $2,190)
- `bulk`     → no Stripe price; client redirects to `/contact?topic=bulk` for sales-led rollout

Legacy: `STRIPE_PRICE_GROWTH` (= old single $499/mo plan) still wired as fallback `growth` plan key. Remove once Vercel env is migrated to the two new IDs.

**Every base package includes:**
- Monthly data delivery + analytics
- 5 custom branded borders
- 24/7 photo booth access
- 11" iPad
- Unlimited contacts & media

**Upgrades (add to base):**
- 5G cellular for portable booth (no Wi-Fi needed): $100/mo
- 13" iPad upgrade: $150/mo
- Step & Repeat Backdrop, 10x8: $1,000 (one-time)
- Step & Repeat Backdrop, 5x8: $700 (one-time)
- Custom holiday borders: $25/mo
- Email Marketing Campaigns: setup consultation
- Text Marketing Campaigns: setup consultation

**To migrate Stripe prices:**
1. Stripe dashboard → Products → "Flexible 3-month" → add price: $1,485 USD recurring every 3 months. Copy ID into Vercel env `STRIPE_PRICE_FLEXIBLE`.
2. Add product "Annual 12-month" → price $2,190 USD recurring every 6 months. Copy ID into `STRIPE_PRICE_ANNUAL`.
3. Bulk does not need a Stripe price (sales-led).
4. Once both new IDs are set in Vercel, the old `STRIPE_PRICE_GROWTH` env var can be deleted.

## Other operational facts

- Domain: boothfunnel.com (apex 307-redirects to www.boothfunnel.com).
- Hosting: Vercel (Hobby tier — needs Pro before launch per Vercel commercial-use terms).
- Repo: github.com/brainwashedtv/boothfunnel.
- Stripe: in test mode. Identity verification not yet completed.
- Webhook secret in Vercel env: STRIPE_WEBHOOK_SECRET.
- Email/SMS delivery infrastructure: not yet wired. Will need a transactional email provider (Resend/Postmark) and SMS provider (Twilio) when the actual booth product is built. The website is just the marketing/checkout layer right now.
- Photobooth hardware product itself is not built yet — this is pre-launch.

## Founder

David Brain (workforbrains@gmail.com). Personal style preference: premium and quiet, B2B-focused. Has Maricel Pabalan as a delegate on the GoDaddy account.
