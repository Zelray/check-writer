# Check Writer ✍️

> Because sometimes you just need to pay your landlord and your bank's "bill pay" has a 5-day delay.

**[→ Open the app](https://mortgagegenius.pro/check-writer/)**

A free, no-login, no-backend, no-drama web app for generating print-ready personal checks. Enter your info, watch the check render live, hit print. That's it.

---

## What is this?

Checks are a relic of a more tactile financial era, yet here we are — landlords, court fees, and the occasional small business that still hands you a paper invoice like it's 1987. Check Writer is a clean, modern tool that generates a properly formatted check you can actually print and deposit at a bank. It handles the fussy parts: the MICR magnetic ink line, the written-out dollar amount, ABA routing number validation, and keeping everything exactly where ANSI says it should be.

No account. No subscription. No "premium tier." Just open the page and write a check.

---

## Features

- **Live check preview** — updates as you type, so you can catch "Pay to the Order of: Landlrod" before you hand it over
- **MICR E-13B font** — the squiggly magnetic characters at the bottom of every check, the ones that look like they were designed by a robot in 1958 (they were, roughly)
- **ABA routing number validation** — real checksum math, not just "is it 9 digits?" vibes
- **Amount-to-words conversion** — turns `1234.56` into `One Thousand Two Hundred Thirty-Four and 56/100 DOLLARS` automatically
- **Logo / design tile upload** — drop in your own image for the top-left corner, like a tiny crest for your personal checking account
- **PDF output via jsPDF** — exact dimensions, embedded font, none of the browser-scaling weirdness that ruins MICR placement
- **Zero backend** — everything runs in your browser; your routing number never leaves your machine

---

## Quick Start

```bash
git clone https://github.com/Zelray/check-writer.git
cd check-writer
npm install
npm run dev
```

Open `http://localhost:3001` and start writing checks like it's 1987.

To build for production:

```bash
npm run build
# output lands in dist/
```

---

## Deploying to a Subfolder

If you're hosting this at `/check-writer/` (or any path that isn't the root), set the `base` in `vite.config.js`:

```js
// vite.config.js
export default defineConfig({
  base: '/check-writer/',
  // ...
})
```

Then build and drop the `dist/` contents into that subfolder on your server. Without this, all the asset paths will 404 and you'll have a very blank check.

---

## Printing Notes

**The only rule that actually matters: print at 100% / Actual Size.**

Never "Fit to Page." Never "Scale to fit." The MICR line at the bottom of a check has to land within 3/16" of the bottom edge, per ANSI X9.100-160. If your printer scales the document down even slightly, the magnetic readers at the bank will miss it.

**On MICR toner:** Real check processing equipment uses magnetic ink readers. Technically, for guaranteed bank acceptance you should print with MICR toner on check stock paper. *Practically*, most modern banks scan checks optically and your laser-printed PDF will probably be fine. But "probably fine" is not a guarantee, especially for larger amounts or more cautious institutions.

The short version:
- Personal checks to people you know: regular laser printer, probably works
- Anything over a few hundred dollars or going through ACH: get MICR toner and proper check stock

For the full technical deep-dive — MICR character specs, check dimensions, ANSI standards, font sourcing — see [`CLAUDE.md`](./CLAUDE.md). It's genuinely thorough.

---

## Stack

| Thing | Choice |
|---|---|
| Build tool | Vite |
| Language | Vanilla JavaScript |
| PDF generation | jsPDF |
| MICR font | GnuMICR (GPL, open source) |
| Styling | Vanilla CSS |
| Backend | lol no |

---

## Built By an AI (Mostly)

> **The entire codebase was written by [Claude Code](https://claude.ai/claude-code) — Anthropic's AI coding tool — in fewer than 8 prompts.**

Not "AI-assisted." Not "AI-enhanced." Claude did the architecture, the MICR line math, the ABA checksum implementation, the amount-to-words engine, the PDF layout, the CSS — everything. The human's contribution was describing what a check is and occasionally saying "that looks right."

This is either impressive or mildly unsettling depending on your feelings about the pace of AI development. Either way, the checks print correctly.

---

## License

MIT — do whatever you want with it. If you use it to write a check to someone interesting, consider that its own reward.

---

*Disclaimer: This tool generates check documents for personal use. For reliable bank processing, use MICR toner, blank check stock with security features, and print at 100% scale. The creators of this tool are not responsible for rejected checks, overdraft fees, or the look your landlord gives you when you hand them a piece of paper in 2025.*
