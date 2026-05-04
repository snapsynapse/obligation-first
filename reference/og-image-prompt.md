# Gemini Prompt — Obligation-First OG Image

Use this prompt with Gemini's image generation (or Nano Banana / Imagen / any image-gen model). Output: a single PNG, **1200×630**, under 1 MB, suitable for `og:image` and `twitter:image` social cards.

The image lives at `docs/imgs/og.png` once generated. Once it exists, the existing `<meta property="og:image">` block in the landing page (and the `image` field in the JSON-LD `TechArticle`) will resolve.

---

## The prompt

```
Generate an OpenGraph social-share image for an open standard called
"Obligation-First". The image will be displayed as a 1200×630 social
card on LinkedIn, Twitter/X, and other link previews. It should be
clean, modern, technical, and unmistakable as a programming/standards
project rather than a marketing image.

DIMENSIONS
- Exactly 1200 pixels wide × 630 pixels tall
- PNG format, under 1 MB

PALETTE (use these exact hex values, no others)
- Background: #0f1117 (very dark blue-black)
- Surface accents: #1a1d27 (slightly lighter dark)
- Primary accent: #a78bfa (soft violet)
- Hover/secondary accent: #c4b5fd (lighter violet)
- Body text: #e1e4ed (off-white, high contrast)
- Muted text: #8b90a0 (cool gray, for sub-labels)
- Border / hairline detail: #2e3345 (dark slate)

LAYOUT
- Solid #0f1117 background with a very subtle vertical gradient
  toward #1a1d27 at the bottom edge — barely perceptible.
- Composition is split roughly 60% text on the left, 40% logo / mark
  on the right. The logo and the headline must both feel anchored
  and balanced; neither dominates the other.

THE LOGO/MARK (right side, ~35% of canvas width)
- A vertical "spine" diagram representing four concepts stacked
  on a vertical axis from top to bottom:
    Top:    a small hollow circle, ~32px diameter, 2px stroke
            in #a78bfa
    2nd:    a small hollow circle, ~32px diameter, 2px stroke
            in #a78bfa
    3rd:    a small hollow circle, ~32px diameter, 2px stroke
            in #a78bfa
    Bottom: a SOLID FILLED circle, ~52px diameter, in #a78bfa
            (this one is larger and filled — it is the
            "Obligation" at the base of the spine, the primary)
- A thin (2px) vertical line in #a78bfa connects the four circles,
  drawn as short segments between each circle, NOT a continuous
  through-line that crosses the circles.
- Center the spine vertically in the right 40% of the canvas.
- Add subtle outer glow / soft violet shadow around the spine
  for depth, but keep it minimal — this is a technical mark,
  not a glamour shot.

THE HEADLINE TEXT (left side, ~55% of canvas width)
- Set in a clean sans-serif (Inter, Söhne, or similar geometric
  sans). NO Times-style serifs. NO Comic Sans. NO scripted fonts.
- Top of left column, in #e1e4ed, ~80-96 pt:
    "Obligation-First"
  Bold weight, tight tracking (-1% to -2% letter-spacing).
- Below it, in #8b90a0 muted gray, ~32-40 pt, regular weight:
    "An open upper schema for normative content"
- Below that, smaller, also in #8b90a0, ~22-26 pt:
    "Bound to gist. Aligned with LegalRuleML."
- At the bottom-left of the canvas, in #a78bfa, ~22 pt, mono font
  (SF Mono, Fira Code, or similar):
    "obligationfirst.org"

WHAT TO AVOID
- No stock-photo people, no abstract "AI brain" imagery, no
  glowing networks, no neon, no glitch effects.
- No third-party logos or company marks of any kind.
- No emoji.
- No drop shadows on the text — keep the type clean.
- No gradients on the text — solid fill colors only.
- No perspective tricks. The composition is flat and
  poster-style, not 3D.
- No "AI"-themed visual cliches (circuit traces, robot heads,
  brain icons, glowing nodes connected by lines).

STYLE REFERENCE
- Think: a developer-tool homepage hero from Stripe, Vercel, or
  Linear. Confident, restrained, slightly austere. The visual
  weight is in the typography and the geometric mark, not in
  decorative flourishes.

EXPECTED OUTPUT
A single 1200×630 PNG with the elements described above. The image
should be readable and recognizable when scaled down to thumbnail
size (300×157), which is the size most social platforms actually
display.
```

---

## Notes on iteration

If the first generation doesn't quite land, common adjustments:

- **Spine looks like a bullet list, not a deliberate mark** — emphasize that the bottom circle is *filled* and *larger*, and that the connecting line should be thin and subtle.
- **Image looks too "AI"-generic** — explicitly forbid neural network imagery, robot heads, glowing connections.
- **Typography wobbles** — request that text be set in a single weight per line and that the letter-spacing be tight.
- **Logo dominates** — adjust the layout split (e.g., 65/35 favoring text).

## After generating

1. Save the result as `docs/imgs/og.png` (path matches the `og:image` URL in the page head).
2. Verify the file is under 1 MB and exactly 1200×630. If larger, run through `pngquant` or similar.
3. Add the `<meta property="og:image">` and `<meta property="twitter:image">` lines back into `docs/index.html` head (currently omitted because the image didn't exist).
4. Add `image` field to the JSON-LD TechArticle pointing at the same URL.
5. Test the result with the [Twitter Card Validator](https://cards-dev.twitter.com/validator) and the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
6. Commit. The deployed site picks up the new image on next push.
