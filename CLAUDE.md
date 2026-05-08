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

## Pricing reality (revised May 8, 2026 — late)

**Four tiers, all same fully-featured package:**

| Plan | Effective rate | Billing model | Stripe? |
|---|---|---|---|
| Flexible | $495/mo | $495 charged today, recurring monthly. **3-month minimum commitment enforced via Terms** (not via Stripe). 100-contacts-month-1 money-back guarantee. | Recurring monthly |
| Annual (most popular) | $365/mo | $4,380 charged today, covers full year. Renews annually. | Recurring yearly |
| Group | $325/mo per booth | 5–49 booths. Billed every 6 months. **Sales-led**, no self-serve checkout. | None — routes to /contact?topic=group |
| Bulk | $285/mo per booth | 50+ booths. Billed every 6 months. **Sales-led**. | None — routes to /contact?topic=bulk |

Internal plan keys (`plan` field in the POST body to `/api/create-checkout-session`):

- `flexible` → recurring `STRIPE_PRICE_FLEXIBLE_MONTHLY` ($495/mo). No setup fee, no trial. Customer pays $495 today and is charged $495 every 30 days; the 3-month minimum is contractual via Terms (no automatic refund window).
- `annual`   → recurring `STRIPE_PRICE_ANNUAL` ($4,380, billing interval = 1 year). One charge today, renews annually.
- `group`    → no Stripe price; client redirects to `/contact?topic=group`.
- `bulk`     → no Stripe price; client redirects to `/contact?topic=bulk`.

**Stripe products needed (only two now):**
1. **Flexible — Monthly** · price: $495 USD · **recurring monthly** · env var `STRIPE_PRICE_FLEXIBLE_MONTHLY`
2. **Annual** · price: $4,380 USD · **recurring yearly** · env var `STRIPE_PRICE_ANNUAL`

Legacy:
- `STRIPE_PRICE_GROWTH` (= old single $499/mo plan) still wired as fallback `growth` plan key. Delete from Vercel env once the two above are in place.
- Old `STRIPE_PRICE_FLEXIBLE_SETUP` env var is no longer referenced in code — safe to delete from Vercel.

**Money-back guarantee on Flexible:** "100 contacts captured in your first month or full refund." Operationally, refund is processed manually via Stripe dashboard if a customer hits month 1 + below 100 contacts.

**Cancellation/return-shipping policy (live on Pricing page):**
- Flexible: cancel any time after month 3.
- Annual: runs the full 12 months; auto-renews unless cancelled before renewal.
- Group/Bulk: end of each 6-month term.
- BoothFunnel pays return shipping. Customer has 14 days from cancellation to ship hardware back.

**Marketing-agency anchor (live on top of Pricing page):**
"A marketing agency delivering the same three outcomes — UGC at scale, an evergreen content library, and a CRM-ready contact list — typically charges $4,500–$8,000/month on retainer."

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
