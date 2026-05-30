# CLAUDE.md — Check Writer Application

> A modern fintech web application that generates print-ready, bank-cashable personal checks.
> Runs on localhost. No login. No payment. Free utility.

---

## Context Window Policy

- **50%** — preferred working limit
- **40%** — warn user that context is filling up
- **55%** — hard stop; do not proceed, ask user to start a new session

---

## Project Overview

**Check Writer** is a single-page web application where a user enters:

1. **Bank Routing Number** (9 digits, ABA format)
2. **Account Number** (variable length, typically 6–17 digits)
3. **Check Number** (user-specified or auto-incremented)
4. **Payee Name** ("Pay to the order of")
5. **Amount** (numeric + written-out legal line)
6. **Date**
7. **Memo** (optional)
8. **Name / Address** (account holder info, top-left of check)
9. **Design Tile** — a small image/logo uploaded by the user, rendered in the **top-left corner** of the check (where bank logos typically appear)

The app renders a **live preview** of the check and lets the user **print** a document that can actually be deposited/cashed at a bank.

### Tech Stack

- **Frontend only** — HTML, CSS, vanilla JavaScript (or a lightweight framework like Vite if needed)
- **No backend / no database / no auth**
- **Runs on localhost** via a dev server (`npm run dev` or simple static server)
- **Modern fintech aesthetic** — dark mode, glassmorphism, premium typography, micro-animations
- **PDF generation** preferred for print output (e.g., jsPDF) to guarantee exact sizing; fallback to `@media print` CSS if simpler

---

## ⚠️ CRITICAL: MICR Line & Check Printing Standards

This is the most important technical domain knowledge for this project. **If the MICR line is wrong, the check will be rejected by the bank.**

### MICR E-13B Font

- The **MICR E-13B** character set is the **only** accepted font for the magnetic encoding line at the bottom of U.S. checks.
- It contains **10 digits (0–9)** and **4 special symbols**:

| Symbol | Name       | Purpose                                    | Common Key Mapping |
|--------|------------|--------------------------------------------|--------------------|
| ⑆      | **Transit**  | Brackets the 9-digit routing number        | `A` or `[` or `]`  |
| ⑈      | **On-Us**    | Delimits account number / check number     | `C` or `@`         |
| ⑇      | **Amount**   | Delimits amount field (bank use only)      | `B` or `#` or `$`  |
| ⑉      | **Dash**     | Separator within number fields             | `D` or `-`         |

> **Key mapping varies by font vendor.** Always check the specific font's documentation for which keyboard character maps to which MICR symbol. The most common mapping uses `A` = Transit, `B` = Amount, `C` = On-Us, `D` = Dash.

### MICR Line Format (Left to Right on a Personal Check)

```
⑆RRRRRRRRR⑆ AAAAAAAAAA⑈ CCCC
```

Where:
- `⑆RRRRRRRRR⑆` = **Routing Number** (9 digits) enclosed by two **Transit** symbols
- `AAAAAAAAAA⑈` = **Account Number** (variable length) followed by an **On-Us** symbol
- `CCCC` = **Check Number** (typically 4 digits, may also be preceded by On-Us)

**Full example:** `⑆021000021⑆ 123456789⑈ 0001`

> **IMPORTANT:** The check number can appear on the left side of the MICR line OR as part of the On-Us field. For personal checks, the most common format is: `⑆Routing⑆ Account⑈ CheckNum`. Some banks use: `CheckNum⑈ ⑆Routing⑆ Account⑈`. **Default to the first format** unless the user specifies otherwise.

### Font Sourcing

- **GnuMICR** (`alerque/gnumicr` on GitHub) — GPL-licensed PostScript Type 1 MICR font. Acceptable for this project.
- **Commercial fonts** (IDAutomation, BarcodeSoft) are more precise but require licensing.
- For a **web app**, embed the font via `@font-face` using `.woff2` / `.ttf` formats.
- **The font only controls the visual shape.** Real magnetic ink requires MICR toner — add a clear disclaimer to users that they need MICR toner for guaranteed bank acceptance. Non-magnetic prints may still be accepted via image-based processing at most modern banks, but this is NOT guaranteed.

### Check Dimensions & Layout (ANSI X9.100-160)

| Property                  | Value                                    |
|---------------------------|------------------------------------------|
| **Standard personal check** | 6.0" wide × 2.75" tall                 |
| **Business check**          | 8.5" wide × 3.5" tall (not our focus)  |
| **Clear Band**              | Bottom 5/8" (0.625") — NO printing except MICR line |
| **MICR baseline position**  | 3/16" (0.1875") from bottom edge        |
| **MICR print band**         | 1/4" (0.25") strip centered in clear band |
| **MICR character width**    | 1/8" (0.125") per character             |
| **MICR font size**          | ~12pt (varies by font; calibrate to 0.125" char width) |
| **First character position**| 5/16" (0.3125") from right edge (±1/16") |
| **Total character positions**| 65 positions, numbered right to left    |

### Check Layout Components

```
┌─────────────────────────────────────────────────────┐
│ [DESIGN TILE]   Account Holder Name        Check #  │
│  (top-left)     Address Line 1             ______   │
│                 Address Line 2              Date     │
│                                                     │
│ Pay to the                                          │
│ order of ________________________________  $ [AMT]  │
│                                                     │
│ ________________________________________________    │
│ (Written amount line)                      DOLLARS  │
│                                                     │
│ Bank Name              Memo ________  ____________  │
│                                       Signature     │
│─ ─ ─ ─ ─ ─ ─ ─ ─ CLEAR BAND (5/8") ─ ─ ─ ─ ─ ─ ─│
│    ⑆021000021⑆  123456789⑈  0001                    │
└─────────────────────────────────────────────────────┘
```

### Print Output Requirements

1. **Prefer PDF generation** (e.g., jsPDF with embedded MICR font) over raw `window.print()`. PDF guarantees exact dimensions and font embedding.
2. If using CSS `@media print`:
   - Set `@page { size: 6in 2.75in; margin: 0; }`
   - Position MICR line with `position: absolute; bottom: 0.1875in;`
   - **Instruct user: print at 100% / "Actual Size" — NEVER "Fit to Page"**
3. **Include an alignment test page** feature — let user print a test pattern to verify their printer's MICR placement.
4. **Add a disclaimer** on every print: "For best results, use MICR toner and blank check stock with security features."

---

## UI / UX Requirements

### Design Philosophy
- **Modern fintech aesthetic** — think Mercury, Brex, Wise
- Dark mode primary with an optional light mode
- Glassmorphism cards, subtle gradients, premium feel
- Google Fonts: **Inter** or **Outfit** for UI; monospace for numeric fields
- Micro-animations on interactions (hover, focus, transitions)
- Responsive but optimized for desktop (check design is a desktop workflow)

### User Flow
1. **Landing** — hero section with tagline, "Create a Check" CTA
2. **Form** — single-page form with live check preview beside it (side-by-side on desktop, stacked on mobile)
3. **Preview** — real-time rendered check that updates as user types
4. **Design Tile** — file upload (accept image/*) with crop/resize to fit the top-left tile area (~1" × 0.75")
5. **Print / Download** — button generates PDF or triggers print dialog
6. **Disclaimer footer** — legal notice about MICR toner, check stock, and bank acceptance

### Form Fields & Validation
- **Routing Number**: 9 digits exactly. Validate with ABA checksum algorithm:
  `(3(d1+d4+d7) + 7(d2+d5+d8) + (d3+d6+d9)) mod 10 == 0`
- **Account Number**: 6–17 digits. No special validation (bank-specific).
- **Check Number**: 1–6 digits. Auto-pad with leading zeros to 4 digits.
- **Payee**: Required, free text.
- **Amount**: Numeric with 2 decimal places. Auto-generate written-out legal line (e.g., "One Thousand Two Hundred Thirty-Four and 56/100").
- **Date**: Default to today. Allow future dates.
- **Memo**: Optional free text.
- **Name/Address**: Multi-line text for account holder info.
- **Design Tile**: Optional image upload. Show a default placeholder tile if none uploaded.

---

## Coding Guidelines (Karpathy Principles)

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd write it differently.
- Changing unrelated code is a bug, not a feature.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

### 5. Verify Behavior

**Don't assume code works. Prove it.**

- If you write logic, test it — manually or with a script.
- If you fix a bug, describe what was wrong and why your fix resolves it.
- If the change is non-trivial, explain how you verified correctness.
- "It should work" is not verification.

### 6. Done Means Done

**No partial implementations. No placeholders. No TODOs.**

- A task is only "done" when it is implemented, tested, and verified.
- Don't leave `// TODO` comments or stubs.
- Don't say "you can add X later" — either add it or don't mention it.
- If you can't finish, say so explicitly with what remains.

### 7. Communicate Clearly

**Say what you did, what you didn't do, and what's left.**

- After every change, summarize: what changed, why, and what to watch for.
- If you made a tradeoff, explain it.
- If something is fragile or risky, call it out.
- Don't bury important information in long explanations.

---

## Project Structure (Recommended)

```
check-writer/
├── CLAUDE.md              # This file
├── index.html             # Entry point
├── package.json           # Dependencies (if using npm/Vite)
├── src/
│   ├── main.js            # App entry, event wiring
│   ├── check-renderer.js  # Check preview & PDF generation
│   ├── micr-formatter.js  # MICR line formatting logic
│   ├── validation.js      # ABA checksum, field validation
│   ├── amount-words.js    # Number-to-words conversion for legal line
│   └── design-tile.js     # Image upload, crop, resize
├── styles/
│   ├── index.css           # Design system, tokens, base styles
│   ├── check.css           # Check preview/print styles
│   └── print.css           # @media print overrides
├── fonts/
│   ├── micr-e13b.woff2     # MICR E-13B web font
│   └── micr-e13b.ttf       # MICR E-13B TrueType fallback
├── assets/
│   └── default-tile.png    # Default design tile placeholder
└── public/
    └── (static assets)
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Print format | PDF (jsPDF) | Guarantees exact dimensions, font embedding, no browser scaling issues |
| MICR font | GnuMICR or embedded E-13B TTF | Open source, embeddable in PDF |
| Framework | Vanilla JS or Vite | No backend needed; keep it simple |
| Styling | Vanilla CSS | Full control over print layout; no utility class conflicts |
| Amount to words | Custom `amount-words.js` | Small, focused module; no heavy deps |
| Routing validation | ABA checksum in `validation.js` | Industry standard; prevents typos |
| Image handling | Canvas API for crop/resize | No external deps; browser-native |

---

## Disclaimers to Display in UI

> **Legal Notice:** This tool generates check documents for personal use. For checks to be reliably processed by bank equipment:
> - Print on **blank check stock** with security features (watermarks, micro-printing)
> - Use a printer with **MICR toner** (magnetic ink character recognition)
> - Verify the MICR line alignment using the built-in test page
> - Your bank may have specific formatting requirements — verify with your institution
> - The creators of this tool are not responsible for rejected checks or bank fees

---

## Useful References

- [ANSI X9.100-160 Check Standard](https://x9.org) — official spec
- [MICR E-13B Wikipedia](https://en.wikipedia.org/wiki/Magnetic_ink_character_recognition) — character set overview
- [GnuMICR Font (GitHub)](https://github.com/alerque/gnumicr) — open-source MICR font
- [ABA Routing Number Checksum](https://en.wikipedia.org/wiki/ABA_routing_transit_number#Check_digit) — validation algorithm
