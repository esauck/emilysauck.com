# emilysauck.com

Production build of Dr. Emily Sauck's personal site, split into real routes from
the approved v19 single-file preview (the file of record). Plain static
HTML/CSS/JS + one Vercel serverless function — no framework, no build step, no
npm dependencies.

## Layout

| Path | What it is |
|---|---|
| `index.html` | Homepage — hero with Emily's story, chooser CTAs, guided booking form (`#contact`) |
| `athletes.html` → `/athletes` | Cycle 101 detail/booking page |
| `menopause.html` → `/menopause` | Peri/Menopause 101 detail/booking page |
| `events.html` → `/events` | Live events ("Live events", never "Speaking") |
| `about.html` → `/about` | Bio (copy FINAL, Emily-approved), HAC band, credentials |
| `404.html` | Not-found page |
| `css/site.css` | The approved v19 stylesheet, extracted verbatim (+ a small marked "production additions" block: honeypot + disabled-button styles) |
| `js/site.js` | Shared: mobile menu + scroll-reveal |
| `js/form.js` | Homepage form: track/option selection, `#contact-cycle` / `#contact-meno` deep-link preselect, POST to `/api/contact` |
| `api/contact.js` | Vercel serverless function → Resend (notification + auto-reply) |
| `vercel.json` | `cleanUrls` (extensionless routes), security + asset-cache headers |
| `assets/` | Self-hosted images (see "Assets" below) |

The hash router from the preview is gone — each page is a real route. The
Squarespace CDN links are gone from the markup; all images reference
`/assets/`.

## REQUIRED before deploy

1. **Photos.** Two image files are referenced but NOT in the repo — Emily is
   supplying them (never re-hotlink the Squarespace CDN):
   - `assets/emily-hero.jpg` — the teal-suit photo (homepage hero, 4:5 crop region)
   - `assets/headshot.jpg` — the headshot (/about portrait)

   `assets/hac-logo.png` is already present (extracted from the preview's
   embedded copy; ask Emily for the source file if larger sizes are needed).
2. **Resend API key.** The Resend account exists under
   emilysauckconsulting@gmail.com and the domain `emilysauck.com` is verified
   (DKIM/SPF/MX at Porkbun). Request the API key from Emily and set it in
   Vercel as the environment variable `RESEND_API_KEY` (all environments).
   Never commit it. Sends go out from `hello@emilysauck.com`.

## Deploy (Vercel)

1. Push this directory to a repo under the **esauck** GitHub account (Emily's
   personal account — not the HormoneAthleteClub org).
2. Vercel (free tier) → New Project → import the repo. No framework preset
   ("Other"), no build command, output = repo root. The `api/` directory is
   picked up automatically as serverless functions.
3. Set `RESEND_API_KEY` in Project → Settings → Environment Variables.
4. Verify the preview URL end-to-end (see checklist) and get **Emily's
   approval** on it.
5. Only then point DNS: `emilysauck.com` stays registered where it is; add the
   Vercel A/CNAME records at the DNS host. Keep the Squarespace *website*
   subscription active until the domain switch is verified live — then cancel
   the website plan (keep the domain registration).

## Pre-launch checklist

- [ ] Photos in `assets/`, pages render with images on the preview URL
- [ ] `/`, `/athletes`, `/menopause`, `/events`, `/about` all load; nav + mobile menu work
- [ ] "Book Cycle 101" (on /athletes) lands on the form with **Cycle 101 preselected**; "Book Peri/Menopause 101" preselects the other track; "Work with me" / "Book an event" / "Contact" arrive unselected
- [ ] Form submit: notification arrives at emilysauckconsulting@gmail.com with track + option in the subject; auto-reply arrives at the submitter from hello@emilysauck.com
- [ ] On-screen confirmation matches the auto-reply wording (they must stay in sync — `js/form.js` + `api/contact.js`)
- [ ] Honeypot: filling the hidden "company" field sends nothing but shows success
- [ ] `sitemap.xml` + `robots.txt` reachable

## Contact form contract

- Tracks/options are defined in `js/form.js` and mirrored in
  `api/contact.js` (`TRACK_OPTIONS`) — the API validates against the mirror,
  so **change both together**.
- Auto-reply (subject "Thanks for reaching out!"):
  "Thank you for reaching out, {first name}! We will review your request and
  get back to you within 2 business days. Look forward to talking, Emily"
- Spam protection: honeypot field + per-IP rate limit (5 requests / 10 min,
  in-memory per function instance — fine for a personal site).

## Editing notes

- **Locked decisions** (see HANDOFF.md of the redesign project): nav labels,
  no hero caption, no lifespan-wave SVG, coral "not" in "Coaching, not a
  clinic visit", Live-events section colors (#0C6B62 / #B9E8E3) and its locked
  heading, door chip wording. Don't revert any of it.
- The disclaimer footer and the "Coaching, not a clinic visit" section are
  **required content** — never remove them. Final disclaimer wording is
  subject to legal review (Alexandra).
- To add an engagement on /events, copy an `.engagement` block (comment marks
  the spot in `events.html`).
- The quote "Your hormones shift your whole life. The shifts aren't the
  problem — not understanding them is." is intentionally **absent** — Emily is
  still deciding where it lives. Don't add it until she decides.
- Instagram is **@dremilysauck** (old @sauckittome links are obsolete).

## Open items (not blockers)

- MSCP logo: request the official mark from The Menopause Society; get Emily
  listed in their "Find a Menopause Practitioner" directory.
- Sofrena summit date/location + the national professional org name, once
  announced — update `/events`.
- Optional: Calendly embed if Emily wants direct booking later.
