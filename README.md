# BoothFunnel

Marketing site for BoothFunnel — branded photobooths for bars, restaurants, and event venues. 17 pages, a 6-step checkout that hands off to Stripe, a contact form, and a Stripe webhook.

## What's here

```
boothfunnel/
  index.html                    # Home
  how-it-works.html
  pricing.html
  case-studies.html
  about.html
  contact.html
  get-started.html              # 6-step checkout
  success.html                  # post-Stripe confirmation
  cancel.html                   # post-Stripe cancellation
  industries/
    index.html                  # hub
    bars.html
    restaurants.html
    venues.html
    retail.html
  legal/
    terms.html                  # DRAFT — replace before launch
    privacy.html                # DRAFT — replace before launch
    dpa.html                    # DRAFT — replace before launch
  api/
    create-checkout-session.js  # POST → returns Stripe Checkout URL
    stripe-webhook.js           # POST ← Stripe events
    contact.js                  # POST ← contact form
  css/site.css                  # one stylesheet, design system inside
  js/site.js                    # FAQ accordion
  js/checkout.js                # 6-step form controller
  pages/                        # source bodies — edit these, then `python3 build.py`
  build.py                      # rebuilds all HTML pages from /pages/*.body.html
  package.json
  vercel.json
  .env.example
```

## To preview locally

```bash
cd boothfunnel
python3 -m http.server 4747
# open http://localhost:4747
```

This previews the marketing pages. The Stripe + contact endpoints under `/api` need `vercel dev` to run.

## To run with full functionality (Stripe checkout, contact form)

```bash
cd boothfunnel
npm install
cp .env.example .env.local      # then fill in real values
npx vercel dev                  # serves pages AND /api/* endpoints
```

## To deploy

1. **Push to GitHub.** Create a new empty repo on github.com, then:
   ```bash
   cd boothfunnel
   git init && git add . && git commit -m "Initial site"
   git branch -M main
   git remote add origin git@github.com:YOUR_USERNAME/boothfunnel.git
   git push -u origin main
   ```

2. **Import to Vercel.** Go to vercel.com → New Project → import the GitHub repo. Vercel auto-detects the static site + the `/api` serverless functions. Click Deploy.

3. **Set environment variables in Vercel** (Project Settings → Environment Variables). Copy from `.env.example`:
   - `STRIPE_SECRET_KEY` — from Stripe Dashboard → Developers → API keys
   - `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard → Developers → Webhooks → your endpoint
   - `STRIPE_PRICE_STARTER` and `STRIPE_PRICE_GROWTH` — from Stripe Dashboard → Products → create your $299/mo and $499/mo recurring prices, paste IDs here
   - `PUBLIC_BASE_URL` — your final domain, e.g. `https://boothfunnel.com`

4. **Add the Stripe webhook.** In Stripe Dashboard → Developers → Webhooks → Add endpoint:
   - URL: `https://boothfunnel.com/api/stripe-webhook`
   - Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

5. **Point the domain.** In Vercel → Project → Domains → Add `boothfunnel.com`. Vercel will show the exact DNS records. In GoDaddy → DNS Management for boothfunnel.com:
   - Add an `A` record: name `@`, value `76.76.21.21`
   - Add a `CNAME` record: name `www`, value `cname.vercel-dns.com`
   - Wait 5–60 minutes for DNS to propagate. Vercel auto-provisions an SSL cert.

## Things flagged for you to replace before launch

- **Pricing in `pages/pricing.body.html`** — the $299 / $499 tier numbers are starting suggestions from the brief. Confirm with you.
- **Case studies in `pages/case-studies.body.html`** — three placeholder client stories. Replace with real ones.
- **About page** — founder bio is a placeholder.
- **Legal pages (Terms, Privacy, DPA)** — drafts only. Get a lawyer to write the real versions; the DPA is non-negotiable since you're processing customer photos on behalf of venues.
- **Calendly embed on success.html** — placeholder block. Replace with your real Calendly snippet.
- **Logo files** — currently text-only. Drop a real logo into `/images/` and swap the `bf-logo` block.
- **Trust strip logos on home page** — placeholder grey pills. Replace with real client logos.

## Editing copy

Marketing pages are built from `/pages/*.body.html`. Edit those, then run `python3 build.py` to regenerate the wrapped HTML files. The home page (`index.html`) is hand-written separately.

## Stack

- Static HTML / CSS / vanilla JS for everything user-facing — no framework, no build step beyond the Python wrapper.
- Vercel serverless functions (Node) for `/api/*`.
- Stripe Checkout for payments (hosted by Stripe — we never see card data).
- Hosted on Vercel; domain on GoDaddy.

## License

Proprietary. © 2026 BoothFunnel, Inc.
