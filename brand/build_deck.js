// BoothFunnel — Heritage Frame Brand Book
// Build: NODE_PATH=/usr/local/lib/node_modules_global/lib/node_modules node build_deck.js

const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

// ----- Brand tokens ------------------------------------------------------
const C = {
  cream: "F2EAD8",
  ink:   "1A1612",
  red:   "B33A2A",
  brass: "C9A063",
  white: "FFFFFF",
  brown: "5A4A38",   // muted earth — secondary text
  rust:  "8C5142",   // eyebrow / metadata
  line:  "E5DCC8",   // hairlines
};

const F = {
  sans: "Helvetica Neue",
  serif: "Georgia",
};

// Slide dimensions (LAYOUT_WIDE: 13.333 × 7.5 in)
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

// ----- Helpers -----------------------------------------------------------

const newShadow = () => ({ type: "outer", blur: 10, offset: 2, angle: 90, color: "000000", opacity: 0.05 });

function eyebrow(slide, x, y, text, color = C.rust) {
  slide.addText(text.toUpperCase(), {
    x, y, w: 5, h: 0.25,
    fontFace: F.sans, fontSize: 9, color, charSpacing: 4, bold: true,
    margin: 0,
  });
}

function pageNum(slide, n, total) {
  slide.addText(`${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, {
    x: SLIDE_W - 1.4, y: SLIDE_H - 0.5, w: 1, h: 0.25,
    fontFace: F.sans, fontSize: 9, color: C.rust, align: "right",
    charSpacing: 2, margin: 0,
  });
  slide.addText("Boothfunnel · Brand Book v1.0", {
    x: 0.6, y: SLIDE_H - 0.5, w: 5, h: 0.25,
    fontFace: F.sans, fontSize: 9, color: C.rust,
    italic: false, charSpacing: 1, margin: 0,
  });
}

function hairline(slide, x, y, w, color = C.brass) {
  slide.addShape("line", { x, y, w, h: 0, line: { color, width: 0.5, transparency: 50 } });
}

function wordmark(slide, x, y, size = 64) {
  // Booth (sans, ink) + funnel (serif italic, red) — the brand's defining gesture
  slide.addText([
    { text: "Booth", options: { fontFace: F.sans, fontSize: size, bold: false, color: C.ink, charSpacing: -2 } },
    { text: "funnel", options: { fontFace: F.serif, italic: true, fontSize: size, color: C.red, charSpacing: -1 } },
  ], { x, y, w: 12, h: size / 50, margin: 0, valign: "middle" });
}

function seal(slide, opts) {
  // opts: { x, y, d, mode: 'outline' | 'inverted' | 'stamp' | 'upper', glyph }
  const { x, y, d, mode = "outline", glyph = "bf" } = opts;
  let circleFill, circleLine, textColor;
  if (mode === "outline") {
    circleFill = "FFFFFF00"; // none
    circleLine = { color: C.ink, width: 0.75 };
    textColor = C.ink;
  } else if (mode === "inverted") {
    circleFill = C.cream;
    circleLine = { color: C.cream, width: 0 };
    textColor = C.ink;
  } else if (mode === "stamp") {
    circleFill = C.cream;
    circleLine = { color: C.cream, width: 0 };
    textColor = C.red;
  } else if (mode === "ink") {
    circleFill = C.ink;
    circleLine = { color: C.ink, width: 0 };
    textColor = C.cream;
  }

  if (mode === "outline") {
    slide.addShape("ellipse", {
      x, y, w: d, h: d,
      fill: { color: "FFFFFF", transparency: 100 }, line: circleLine,
    });
  } else {
    slide.addShape("ellipse", {
      x, y, w: d, h: d,
      fill: { color: circleFill }, line: circleLine,
    });
  }

  const fontSize = Math.round(d * 50);
  slide.addText(glyph, {
    x: x, y: y + d * 0.04, w: d, h: d,
    fontFace: F.serif, italic: true, fontSize, color: textColor,
    align: "center", valign: "middle", margin: 0, bold: false,
  });
}

function swatch(slide, x, y, w, h, hex, name, hexLabel, lightText = false) {
  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: hex }, line: { color: hex, width: 0 },
  });
  const textColor = lightText ? C.cream : C.ink;
  if (name) {
    slide.addText(name, {
      x: x + 0.18, y: y + h - 0.55, w: w - 0.36, h: 0.25,
      fontFace: F.sans, fontSize: 11, color: textColor, bold: true, margin: 0,
    });
  }
  if (hexLabel) {
    slide.addText(hexLabel, {
      x: x + 0.18, y: y + h - 0.3, w: w - 0.36, h: 0.22,
      fontFace: "Courier New", fontSize: 9, color: textColor, charSpacing: 1, margin: 0,
    });
  }
}

function sectionTitle(slide, text, sub) {
  // For divider slides
  slide.background = { color: C.ink };
  slide.addText("·  ·  ·", {
    x: 0.6, y: 0.8, w: 6, h: 0.3,
    fontFace: F.sans, fontSize: 10, color: C.brass, charSpacing: 8, margin: 0,
  });
  slide.addText(text, {
    x: 0.6, y: 3.0, w: 12, h: 1.2,
    fontFace: F.sans, fontSize: 56, color: C.cream, bold: false, charSpacing: -2,
    margin: 0,
  });
  if (sub) {
    slide.addText(sub, {
      x: 0.6, y: 4.3, w: 10, h: 0.6,
      fontFace: F.serif, italic: true, fontSize: 18, color: C.brass, margin: 0,
    });
  }
  // Page anchor
  slide.addText("Boothfunnel · Brand Book v1.0", {
    x: 0.6, y: SLIDE_H - 0.5, w: 5, h: 0.25,
    fontFace: F.sans, fontSize: 9, color: C.brass, charSpacing: 1, margin: 0,
  });
}

// ----- Build the deck ----------------------------------------------------

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "BoothFunnel Brand Book v1.0";
pres.author = "BoothFunnel";

const TOTAL = 17;
let n = 0;

// ===== 01. Cover =========================================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };

  // Eyebrow top-left
  slide.addText("BRAND BOOK", {
    x: 0.6, y: 0.6, w: 5, h: 0.3,
    fontFace: F.sans, fontSize: 10, color: C.rust, charSpacing: 6, bold: true, margin: 0,
  });
  slide.addText("Volume 01 · 2026 edition", {
    x: 0.6, y: 0.9, w: 6, h: 0.3,
    fontFace: F.serif, italic: true, fontSize: 13, color: C.brown, margin: 0,
  });

  // Big lockup centered
  seal(slide, { x: 5.5, y: 2.3, d: 1.0, mode: "outline" });

  // Wordmark below seal
  wordmark(slide, 3.8, 4.0, 80);

  // Tag line
  slide.addText("Photobooths that pay for themselves.", {
    x: 0.6, y: 5.7, w: 12, h: 0.45,
    fontFace: F.sans, fontSize: 17, color: C.ink, align: "center", margin: 0,
  });

  // Bottom hairline + corner notes
  hairline(slide, 0.6, SLIDE_H - 0.9, 12.1);
  slide.addText("BOOTHFUNNEL.COM", {
    x: 0.6, y: SLIDE_H - 0.65, w: 4, h: 0.25,
    fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 3, bold: true, margin: 0,
  });
  slide.addText("Internal use only · v1.0", {
    x: SLIDE_W - 4.6, y: SLIDE_H - 0.65, w: 4, h: 0.25,
    fontFace: F.serif, italic: true, fontSize: 11, color: C.brown, align: "right", margin: 0,
  });
}

// ===== 02. Manifesto =====================================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "01 · The brand");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText("A film company that grew up.", {
    x: 0.6, y: 1.3, w: 12, h: 0.9,
    fontFace: F.sans, fontSize: 44, color: C.ink, charSpacing: -1.5, margin: 0,
  });

  slide.addText([
    { text: "Boothfunnel makes branded social photobooths for bars, restaurants, and event venues — built so every guest leaves with a branded photo on their phone, and the operator leaves with their email. ", options: { fontFace: F.sans, fontSize: 16, color: C.ink, lineSpacing: 26, breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "We sit at the intersection of two ideas: the analog photo as a moment — borrowed, branded, instantly shareable — and the modern operator's need for a marketing channel that builds a list while it builds a feed. ", options: { fontFace: F.sans, fontSize: 16, color: C.ink, lineSpacing: 26, breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "The brand reflects that. Modern grotesque sans does the work. ", options: { fontFace: F.sans, fontSize: 16, color: C.ink, lineSpacing: 26 } },
    { text: "An italic serif moment", options: { fontFace: F.serif, italic: true, fontSize: 16, color: C.red, lineSpacing: 26 } },
    { text: " carries the heritage. The digital frame holds the world together.", options: { fontFace: F.sans, fontSize: 16, color: C.ink, lineSpacing: 26 } },
  ], { x: 0.6, y: 2.6, w: 8.5, h: 4, margin: 0, valign: "top" });

  // Right column: small pullquote
  slide.addShape("rect", {
    x: 9.6, y: 2.6, w: 3.1, h: 3.6,
    fill: { color: C.white }, line: { color: C.line, width: 0.5 },
  });
  slide.addText("“", {
    x: 9.8, y: 2.5, w: 1, h: 0.8,
    fontFace: F.serif, italic: true, fontSize: 60, color: C.red, margin: 0,
  });
  slide.addText("Sophistication signals trust. We close $499 a month with quiet authority — not by shouting.", {
    x: 9.85, y: 3.4, w: 2.8, h: 2.2,
    fontFace: F.serif, italic: true, fontSize: 16, color: C.ink, lineSpacing: 22, margin: 0,
  });
  slide.addText("— Brand principle no. 01", {
    x: 9.85, y: 5.7, w: 2.8, h: 0.3,
    fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 2, margin: 0,
  });

  pageNum(slide, n, TOTAL);
}

// ===== 03. Brand at a glance ============================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "02 · At a glance");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText("The brand, on one page.", {
    x: 0.6, y: 1.2, w: 12, h: 0.7,
    fontFace: F.sans, fontSize: 32, color: C.ink, charSpacing: -1, margin: 0,
  });

  // Logo card
  slide.addShape("rect", { x: 0.6, y: 2.2, w: 3.9, h: 4.2, fill: { color: C.white }, line: { color: C.line, width: 0.5 } });
  slide.addText("LOGO", { x: 0.85, y: 2.4, w: 4, h: 0.25, fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 3, bold: true, margin: 0 });
  // Mini wordmark
  slide.addText([
    { text: "Booth", options: { fontFace: F.sans, fontSize: 28, color: C.ink } },
    { text: "funnel", options: { fontFace: F.serif, italic: true, fontSize: 28, color: C.red } },
  ], { x: 0.85, y: 3.2, w: 3.5, h: 0.6, margin: 0 });
  // Mini seal
  seal(slide, { x: 0.85, y: 4.4, d: 0.9, mode: "outline" });
  slide.addText("Wordmark + seal.\nMixed sans / italic serif. Red is the moment.", {
    x: 1.95, y: 4.55, w: 2.4, h: 1.0,
    fontFace: F.sans, fontSize: 11, color: C.brown, lineSpacing: 16, margin: 0,
  });

  // Color card
  slide.addShape("rect", { x: 4.7, y: 2.2, w: 3.9, h: 4.2, fill: { color: C.white }, line: { color: C.line, width: 0.5 } });
  slide.addText("COLOR", { x: 4.95, y: 2.4, w: 4, h: 0.25, fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 3, bold: true, margin: 0 });
  // 5 color stripes
  swatch(slide, 4.95, 3.0, 0.65, 2.6, C.cream, null, null);
  swatch(slide, 5.65, 3.0, 0.65, 2.6, C.ink, null, null);
  swatch(slide, 6.35, 3.0, 0.65, 2.6, C.red, null, null);
  swatch(slide, 7.05, 3.0, 0.65, 2.6, C.brass, null, null);
  swatch(slide, 7.75, 3.0, 0.65, 2.6, C.white, null, null);
  // Add 1px line on white
  slide.addShape("rect", { x: 7.75, y: 3.0, w: 0.65, h: 2.6, fill: { type: "none" }, line: { color: C.line, width: 0.5 } });

  slide.addText("Cream is the canvas.\nInk is the voice.\nRed is the moment.", {
    x: 4.95, y: 5.7, w: 3.6, h: 0.7,
    fontFace: F.serif, italic: true, fontSize: 12, color: C.brown, lineSpacing: 16, margin: 0,
  });

  // Type card
  slide.addShape("rect", { x: 8.8, y: 2.2, w: 3.9, h: 4.2, fill: { color: C.white }, line: { color: C.line, width: 0.5 } });
  slide.addText("TYPE", { x: 9.05, y: 2.4, w: 4, h: 0.25, fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 3, bold: true, margin: 0 });
  slide.addText("Söhne", {
    x: 9.05, y: 2.85, w: 3.5, h: 0.7,
    fontFace: F.sans, fontSize: 36, color: C.ink, charSpacing: -1, margin: 0,
  });
  slide.addText("Workhorse — body, nav, buttons.", {
    x: 9.05, y: 3.55, w: 3.5, h: 0.3,
    fontFace: F.sans, fontSize: 11, color: C.brown, margin: 0,
  });
  slide.addText("GT Sectra Italic", {
    x: 9.05, y: 4.05, w: 3.5, h: 0.7,
    fontFace: F.serif, italic: true, fontSize: 32, color: C.red, margin: 0,
  });
  slide.addText("Accent — one phrase per page.", {
    x: 9.05, y: 4.8, w: 3.5, h: 0.3,
    fontFace: F.sans, fontSize: 11, color: C.brown, margin: 0,
  });
  slide.addText("Inter & Georgia as accessible alternates", {
    x: 9.05, y: 5.5, w: 3.5, h: 0.3,
    fontFace: F.sans, fontSize: 9, color: C.rust, italic: true, margin: 0,
  });

  pageNum(slide, n, TOTAL);
}

// ===== 04. Section: Logo =================================================
{
  n++;
  const slide = pres.addSlide();
  sectionTitle(slide, "Logo system", "Wordmark, seal, and how they live together.");
}

// ===== 05. Wordmark — primary ============================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "03 · Logo / wordmark");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText("The wordmark.", {
    x: 0.6, y: 1.2, w: 12, h: 0.7,
    fontFace: F.sans, fontSize: 32, color: C.ink, charSpacing: -1, margin: 0,
  });

  // Big wordmark on white card
  slide.addShape("rect", { x: 0.6, y: 2.2, w: 12.1, h: 3.0, fill: { color: C.white }, line: { color: C.line, width: 0.5 } });
  wordmark(slide, 2.0, 3.0, 110);
  slide.addText("PRIMARY · 110pt", {
    x: 0.6, y: 4.95, w: 12.1, h: 0.25,
    fontFace: F.sans, fontSize: 9, color: C.rust, align: "center", charSpacing: 3, margin: 0,
  });

  // Anatomy
  slide.addText("ANATOMY", { x: 0.6, y: 5.45, w: 4, h: 0.25, fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 3, bold: true, margin: 0 });
  slide.addText([
    { text: "“Booth” ", options: { fontFace: F.sans, fontSize: 12, color: C.ink, bold: true } },
    { text: "in Söhne (Helvetica Neue alt) · tracking −20.", options: { fontFace: F.sans, fontSize: 12, color: C.brown, breakLine: true } },
    { text: "“funnel” ", options: { fontFace: F.serif, italic: true, fontSize: 12, color: C.red } },
    { text: "in GT Sectra Italic (Georgia alt) · ", options: { fontFace: F.sans, fontSize: 12, color: C.brown } },
    { text: "#B33A2A", options: { fontFace: "Courier New", fontSize: 11, color: C.red } },
    { text: ".", options: { fontFace: F.sans, fontSize: 12, color: C.brown } },
  ], { x: 0.6, y: 5.7, w: 6.0, h: 1.0, margin: 0, lineSpacing: 18 });

  slide.addText("CLEAR SPACE", { x: 7.0, y: 5.45, w: 4, h: 0.25, fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 3, bold: true, margin: 0 });
  slide.addText([
    { text: "Padding equal to the cap height of \"B\" on all sides.", options: { fontFace: F.sans, fontSize: 12, color: C.brown, breakLine: true } },
    { text: "Minimum size: ", options: { fontFace: F.sans, fontSize: 12, color: C.brown } },
    { text: "120px", options: { fontFace: F.sans, fontSize: 12, color: C.ink, bold: true } },
    { text: " on screen · ", options: { fontFace: F.sans, fontSize: 12, color: C.brown } },
    { text: "1.0″", options: { fontFace: F.sans, fontSize: 12, color: C.ink, bold: true } },
    { text: " in print.", options: { fontFace: F.sans, fontSize: 12, color: C.brown } },
  ], { x: 7.0, y: 5.7, w: 5.7, h: 1.0, margin: 0, lineSpacing: 18 });

  pageNum(slide, n, TOTAL);
}

// ===== 06. The seal — secondary ==========================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "04 · Logo / the seal");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText("The seal.", {
    x: 0.6, y: 1.2, w: 12, h: 0.7,
    fontFace: F.sans, fontSize: 32, color: C.ink, charSpacing: -1, margin: 0,
  });
  slide.addText("Same italic serif voice as the wordmark. Used where the wordmark won't fit.", {
    x: 0.6, y: 1.95, w: 12, h: 0.4,
    fontFace: F.serif, italic: true, fontSize: 15, color: C.brown, margin: 0,
  });

  // Four variants in cards
  const labels = [
    { mode: "outline",  bg: C.white, name: "Default", note: "The everyday seal.", textColor: C.ink },
    { mode: "ink",      bg: C.ink,   name: "Inverted", note: "Dark surfaces.", textColor: C.cream },
    { mode: "stamp",    bg: C.red,   name: "Stamp", note: "Photo corners, CTAs.", textColor: C.cream },
    { mode: "outline",  bg: C.white, name: "Uppercase", note: "Embossed, formal.", textColor: C.ink, glyph: "BF" },
  ];

  const cardW = 2.85;
  const cardH = 3.6;
  const gap = 0.2;
  const startX = 0.6;
  const startY = 2.6;

  labels.forEach((v, i) => {
    const x = startX + i * (cardW + gap);
    slide.addShape("rect", { x, y: startY, w: cardW, h: cardH, fill: { color: v.bg }, line: { color: v.bg === C.white ? C.line : v.bg, width: v.bg === C.white ? 0.5 : 0 } });
    seal(slide, { x: x + (cardW - 1.6) / 2, y: startY + 0.5, d: 1.6, mode: v.mode, glyph: v.glyph || "bf" });
    slide.addText(v.name, {
      x: x + 0.2, y: startY + 2.4, w: cardW - 0.4, h: 0.3,
      fontFace: F.sans, fontSize: 13, bold: true, color: v.textColor, align: "center", margin: 0,
    });
    slide.addText(v.note, {
      x: x + 0.2, y: startY + 2.75, w: cardW - 0.4, h: 0.6,
      fontFace: F.serif, italic: true, fontSize: 11, color: v.textColor, align: "center", lineSpacing: 14, margin: 0,
      transparency: v.bg === C.white ? 0 : 30,
    });
  });

  // Below, application notes
  hairline(slide, 0.6, 6.4, 12.1);
  slide.addText([
    { text: "USAGE  ", options: { fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 3, bold: true } },
    { text: "Wordmark won't fit (favicons, avatars, watermarks). Or a stamp moment is needed (digital photo corners, email signatures, business cards). Or the wordmark would be redundant (back of card, hardware nameplates).", options: { fontFace: F.sans, fontSize: 12, color: C.brown } },
  ], { x: 0.6, y: 6.6, w: 12.1, h: 0.6, margin: 0, valign: "top" });

  pageNum(slide, n, TOTAL);
}

// ===== 07. The lockup ====================================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "05 · Logo / lockup");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText("The lockup.", {
    x: 0.6, y: 1.2, w: 12, h: 0.7,
    fontFace: F.sans, fontSize: 32, color: C.ink, charSpacing: -1, margin: 0,
  });
  slide.addText("Seal and wordmark together — the most formal expression of the brand.", {
    x: 0.6, y: 1.95, w: 12, h: 0.4,
    fontFace: F.serif, italic: true, fontSize: 15, color: C.brown, margin: 0,
  });

  // Big lockup on white
  slide.addShape("rect", { x: 0.6, y: 2.6, w: 12.1, h: 3.4, fill: { color: C.white }, line: { color: C.line, width: 0.5 } });
  // Seal
  seal(slide, { x: 3.3, y: 3.4, d: 1.7, mode: "outline" });
  // Vertical separator
  slide.addShape("line", {
    x: 5.4, y: 3.6, w: 0, h: 1.3, line: { color: C.brass, width: 0.75 },
  });
  // Wordmark
  wordmark(slide, 5.7, 3.85, 90);
  slide.addText("LOCKUP · LANDSCAPE", {
    x: 0.6, y: 5.65, w: 12.1, h: 0.25,
    fontFace: F.sans, fontSize: 9, color: C.rust, align: "center", charSpacing: 3, margin: 0,
  });

  // When to use
  hairline(slide, 0.6, 6.2, 12.1);
  slide.addText([
    { text: "USE THE LOCKUP FOR  ", options: { fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 3, bold: true } },
    { text: "the homepage hero, the cover of legal documents, signage, the title slide of any deck. Use the wordmark alone elsewhere.", options: { fontFace: F.sans, fontSize: 12, color: C.brown } },
  ], { x: 0.6, y: 6.4, w: 12.1, h: 0.6, margin: 0, valign: "top" });

  pageNum(slide, n, TOTAL);
}

// ===== 08. Section: Color ================================================
{
  n++;
  const slide = pres.addSlide();
  sectionTitle(slide, "Color", "Cream is the canvas. Ink is the voice. Red is the moment.");
}

// ===== 09. Primary palette ===============================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "06 · Color / primary");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText("Primary palette.", {
    x: 0.6, y: 1.2, w: 12, h: 0.7,
    fontFace: F.sans, fontSize: 32, color: C.ink, charSpacing: -1, margin: 0,
  });

  // Three big swatches
  const colors = [
    { hex: C.cream, name: "Cream",     role: "Canvas",   rgb: "242 234 216", cmyk: "0 3 11 5",   light: false },
    { hex: C.ink,   name: "Ink",       role: "Voice",    rgb: "26 22 18",    cmyk: "0 15 31 90", light: true },
    { hex: C.red,   name: "Kodak red", role: "Moment",   rgb: "179 58 42",   cmyk: "0 68 77 30", light: true },
  ];

  const swW = 3.95;
  const swH = 4.6;
  const startX = 0.6;
  const startY = 2.1;
  const gap = 0.2;

  colors.forEach((c, i) => {
    const x = startX + i * (swW + gap);
    // Swatch
    slide.addShape("rect", {
      x, y: startY, w: swW, h: swH,
      fill: { color: c.hex }, line: { color: c.hex === C.cream ? C.line : c.hex, width: c.hex === C.cream ? 0.5 : 0 },
    });
    const txt = c.light ? C.cream : C.ink;
    const meta = c.light ? C.brass : C.rust;

    slide.addText(c.role.toUpperCase(), {
      x: x + 0.3, y: startY + 0.35, w: swW - 0.6, h: 0.25,
      fontFace: F.sans, fontSize: 9, color: meta, charSpacing: 3, bold: true, margin: 0,
    });
    slide.addText(c.name, {
      x: x + 0.3, y: startY + 0.7, w: swW - 0.6, h: 0.7,
      fontFace: F.sans, fontSize: 32, color: txt, charSpacing: -1, margin: 0,
    });
    slide.addText([
      { text: "HEX  ", options: { fontFace: "Courier New", fontSize: 9, color: meta, charSpacing: 1 } },
      { text: `#${c.hex}`,    options: { fontFace: "Courier New", fontSize: 11, color: txt, breakLine: true } },
      { text: "RGB  ", options: { fontFace: "Courier New", fontSize: 9, color: meta, charSpacing: 1 } },
      { text: c.rgb,    options: { fontFace: "Courier New", fontSize: 11, color: txt, breakLine: true } },
      { text: "CMYK ", options: { fontFace: "Courier New", fontSize: 9, color: meta, charSpacing: 1 } },
      { text: c.cmyk,   options: { fontFace: "Courier New", fontSize: 11, color: txt } },
    ], { x: x + 0.3, y: startY + swH - 1.4, w: swW - 0.6, h: 1.3, margin: 0, lineSpacing: 18 });
  });

  pageNum(slide, n, TOTAL);
}

// ===== 10. Supporting palette + usage ===================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "07 · Color / supporting");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText("Supporting + rules.", {
    x: 0.6, y: 1.2, w: 12, h: 0.7,
    fontFace: F.sans, fontSize: 32, color: C.ink, charSpacing: -1, margin: 0,
  });

  // Supporting swatches
  slide.addText("SUPPORTING", { x: 0.6, y: 2.1, w: 6, h: 0.25, fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 3, bold: true, margin: 0 });

  const supports = [
    { hex: C.brass, name: "Brass",       role: "Texture",     rgb: "201 160 99",  cmyk: "0 20 51 21", light: false },
    { hex: C.white, name: "Frame white", role: "Photo border", rgb: "255 255 255", cmyk: "0 0 0 0",   light: false, border: true },
    { hex: C.brown, name: "Mud",         role: "Body subdued", rgb: "90 74 56",    cmyk: "0 18 38 65", light: true },
    { hex: C.rust,  name: "Rust",        role: "Eyebrow / metadata", rgb: "140 81 66", cmyk: "0 42 53 45", light: true },
  ];

  const swW = 2.94;
  const swH = 2.4;
  supports.forEach((c, i) => {
    const x = 0.6 + i * (swW + 0.13);
    const y = 2.45;
    slide.addShape("rect", { x, y, w: swW, h: swH, fill: { color: c.hex }, line: { color: c.border ? C.line : c.hex, width: c.border ? 0.5 : 0 } });
    const txt = c.light ? C.cream : C.ink;
    const meta = c.light ? C.brass : C.rust;
    slide.addText(c.role.toUpperCase(), {
      x: x + 0.2, y: y + 0.2, w: swW - 0.4, h: 0.22,
      fontFace: F.sans, fontSize: 8, color: meta, charSpacing: 3, bold: true, margin: 0,
    });
    slide.addText(c.name, {
      x: x + 0.2, y: y + 0.42, w: swW - 0.4, h: 0.5,
      fontFace: F.sans, fontSize: 22, color: txt, charSpacing: -1, margin: 0,
    });
    slide.addText(`#${c.hex}`, {
      x: x + 0.2, y: y + swH - 0.45, w: swW - 0.4, h: 0.25,
      fontFace: "Courier New", fontSize: 10, color: txt, margin: 0,
    });
  });

  // Color usage rules
  hairline(slide, 0.6, 5.2, 12.1);
  slide.addText("USAGE RULES", { x: 0.6, y: 5.4, w: 6, h: 0.25, fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 3, bold: true, margin: 0 });

  const rules = [
    "60% Cream — backgrounds and surface treatments. Never stark white as page background.",
    "30% Ink — body type, headlines, primary surfaces and rules.",
    "8% Kodak red — accent words in headlines, primary CTAs, the seal stamp. Reserve.",
    "2% Brass + others — fine details, hairlines, metadata. Texture only.",
  ];
  rules.forEach((r, i) => {
    const y = 5.75 + i * 0.36;
    // Numbered marker
    slide.addText(`${String(i + 1).padStart(2, '0')}`, {
      x: 0.6, y, w: 0.5, h: 0.3,
      fontFace: "Courier New", fontSize: 11, color: C.red, bold: true, margin: 0,
    });
    slide.addText(r, {
      x: 1.15, y, w: 11.5, h: 0.3,
      fontFace: F.sans, fontSize: 12, color: C.ink, margin: 0,
    });
  });

  pageNum(slide, n, TOTAL);
}

// ===== 11. Section: Typography ===========================================
{
  n++;
  const slide = pres.addSlide();
  sectionTitle(slide, "Typography", "Modern grotesque does the work. Italic serif does the moment.");
}

// ===== 12. Type hierarchy ================================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "08 · Typography / hierarchy");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText("Hierarchy.", {
    x: 0.6, y: 1.2, w: 12, h: 0.7,
    fontFace: F.sans, fontSize: 32, color: C.ink, charSpacing: -1, margin: 0,
  });

  // Hierarchy table
  const rows = [
    { label: "DISPLAY",   sample: "Photobooths that pay for themselves.", spec: "Söhne · 64pt · −2 tracking",  size: 28, family: F.sans, italic: false, color: C.ink },
    { label: "H1",        sample: "From box to revenue.",                 spec: "Söhne · 44pt · −1.5 tracking", size: 24, family: F.sans, italic: false, color: C.ink },
    { label: "H2",        sample: "How it works.",                        spec: "Söhne · 28pt · −1 tracking",   size: 20, family: F.sans, italic: false, color: C.ink },
    { label: "H3",        sample: "Pick a plan, upload your brand.",      spec: "Söhne · 18pt · 0 tracking",    size: 15, family: F.sans, italic: false, color: C.ink },
    { label: "BODY",      sample: "Every Friday night, hundreds of phones come out.", spec: "Söhne · 14pt · 1.6 line height", size: 12, family: F.sans, italic: false, color: C.brown },
    { label: "CAPTION",   sample: "Brooklyn · 11.04 · 02:14am",           spec: "Söhne mono · 10pt · 0.8 ratio", size: 11, family: "Courier New", italic: false, color: C.rust },
    { label: "ITALIC",    sample: "pay for themselves",                   spec: "GT Sectra Italic · 1 phrase per page", size: 18, family: F.serif, italic: true, color: C.red },
  ];

  rows.forEach((r, i) => {
    const y = 2.2 + i * 0.62;
    slide.addText(r.label, {
      x: 0.6, y: y + 0.1, w: 1.4, h: 0.25,
      fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 3, bold: true, margin: 0,
    });
    slide.addText(r.sample, {
      x: 2.0, y: y + 0.05, w: 7.2, h: 0.55,
      fontFace: r.family, fontSize: r.size, italic: r.italic, color: r.color, margin: 0, charSpacing: -0.5, valign: "middle",
    });
    slide.addText(r.spec, {
      x: 9.3, y: y + 0.18, w: 3.4, h: 0.25,
      fontFace: F.sans, fontSize: 9, color: C.rust, italic: true, margin: 0,
    });
    if (i < rows.length - 1) hairline(slide, 0.6, y + 0.6, 12.1, C.line);
  });

  pageNum(slide, n, TOTAL);
}

// ===== 13. The italic moment =============================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "09 · Typography / the italic moment");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText([
    { text: "The italic ", options: { fontFace: F.sans, fontSize: 36, color: C.ink, charSpacing: -1 } },
    { text: "moment", options: { fontFace: F.serif, italic: true, fontSize: 36, color: C.red, charSpacing: -0.5 } },
    { text: ".", options: { fontFace: F.sans, fontSize: 36, color: C.ink } },
  ], { x: 0.6, y: 1.2, w: 12, h: 0.7, margin: 0 });

  slide.addText("The brand's signature gesture. One italic-serif phrase per page, in red. Used as a director uses a motif — recognizable, restrained, never repeated within the same scene.", {
    x: 0.6, y: 2.0, w: 11.5, h: 0.8,
    fontFace: F.serif, italic: true, fontSize: 16, color: C.brown, lineSpacing: 22, margin: 0,
  });

  // Three example headlines on white cards
  const examples = [
    { sans1: "Photobooths that ", italic: "pay for themselves", sans2: "." },
    { sans1: "From box to revenue ", italic: "in three moves", sans2: "." },
    { sans1: "Your customers already take photos. ", italic: "None of them are branded yours", sans2: "." },
  ];

  examples.forEach((e, i) => {
    const y = 3.0 + i * 1.3;
    slide.addShape("rect", { x: 0.6, y, w: 12.1, h: 1.1, fill: { color: C.white }, line: { color: C.line, width: 0.5 } });
    slide.addText([
      { text: e.sans1,  options: { fontFace: F.sans, fontSize: 26, color: C.ink, charSpacing: -1 } },
      { text: e.italic, options: { fontFace: F.serif, italic: true, fontSize: 26, color: C.red, charSpacing: -0.5 } },
      { text: e.sans2,  options: { fontFace: F.sans, fontSize: 26, color: C.ink } },
    ], { x: 0.85, y: y + 0.25, w: 11.6, h: 0.7, margin: 0, valign: "middle" });
    slide.addText(`EXAMPLE 0${i + 1}`, {
      x: 0.85, y: y + 0.85, w: 4, h: 0.2,
      fontFace: F.sans, fontSize: 8, color: C.rust, charSpacing: 3, bold: true, margin: 0,
    });
  });

  pageNum(slide, n, TOTAL);
}

// ===== 14. Photography & frame ===========================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "10 · Photography & the digital frame");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText("Photography direction.", {
    x: 0.6, y: 1.2, w: 12, h: 0.7,
    fontFace: F.sans, fontSize: 32, color: C.ink, charSpacing: -1, margin: 0,
  });

  // Three "print frames" with mock photos
  const frames = [
    { tone: C.ink,   tag: "Brooklyn · 11.04",     sub: "Documentary." },
    { tone: C.red,   tag: "Your venue · Sat 02:14am", sub: "Branded moment." },
    { tone: C.brass, tag: "Wedding · 09.21",       sub: "Unobtrusive." },
  ];

  frames.forEach((f, i) => {
    const x = 0.6 + i * 4.15;
    const y = 2.2;
    // Print frame (white border + photo + caption)
    slide.addShape("rect", { x, y, w: 4.0, h: 4.5, fill: { color: C.white }, line: { color: C.line, width: 0.5 }, shadow: newShadow() });
    slide.addShape("rect", { x: x + 0.25, y: y + 0.25, w: 3.5, h: 3.5, fill: { color: f.tone }, line: { color: f.tone, width: 0 } });
    slide.addText(`— ${f.tag}`, {
      x: x + 0.25, y: y + 3.85, w: 3.5, h: 0.4,
      fontFace: "Courier New", fontSize: 10, color: C.ink, charSpacing: 1, margin: 0,
    });
    // Sub label below frame
    slide.addText(f.sub, {
      x, y: y + 4.7, w: 4.0, h: 0.3,
      fontFace: F.serif, italic: true, fontSize: 12, color: C.brown, align: "center", margin: 0,
    });
  });

  // Do's and don'ts in 2 columns at bottom
  hairline(slide, 0.6, 7.0, 12.1);
  // can't fit much — keep on the next slide
  pageNum(slide, n, TOTAL);
}

// ===== 15. Voice =========================================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "11 · Voice & tone");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText("Voice.", {
    x: 0.6, y: 1.2, w: 12, h: 0.7,
    fontFace: F.sans, fontSize: 32, color: C.ink, charSpacing: -1, margin: 0,
  });
  slide.addText("Three principles. Hold them when in doubt.", {
    x: 0.6, y: 1.95, w: 12, h: 0.4,
    fontFace: F.serif, italic: true, fontSize: 15, color: C.brown, margin: 0,
  });

  const principles = [
    {
      n: "01",
      title: "Operator-first.",
      body: "We talk to the bar owner and the GM, not the customer. Words like \"floor,\" \"shift,\" \"cover,\" \"weekend.\" If a phrase wouldn't make sense to someone holding a clipboard at 11pm, cut it.",
      yes: "\"Get a booth on your floor before this weekend.\"",
      no:  "\"Unlock the power of social-driven engagement.\"",
    },
    {
      n: "02",
      title: "Quietly confident.",
      body: "We don't use exclamation points. We don't say \"revolutionary.\" The product is good — that should come through in specifics, not adjectives. Sophistication signals trust.",
      yes: "\"Most operators see ROI in week three.\"",
      no:  "\"The most amazing photobooth ever!\"",
    },
    {
      n: "03",
      title: "Specific, not abstract.",
      body: "Numbers, places, times of day. Brooklyn at 02:14am. Saturday past 100 captures. The italic moment lands when everything around it is concrete.",
      yes: "\"4,200 captures in 60 days. $1,400 of ads cancelled.\"",
      no:  "\"Boost your social presence with our innovative platform.\"",
    },
  ];

  principles.forEach((p, i) => {
    const y = 2.6 + i * 1.55;
    // Number column
    slide.addText(p.n, {
      x: 0.6, y, w: 1.0, h: 0.6,
      fontFace: F.serif, italic: true, fontSize: 36, color: C.red, margin: 0,
    });
    // Body column
    slide.addText(p.title, {
      x: 1.7, y, w: 8.5, h: 0.4,
      fontFace: F.sans, fontSize: 16, color: C.ink, bold: true, charSpacing: -0.5, margin: 0,
    });
    slide.addText(p.body, {
      x: 1.7, y: y + 0.4, w: 8.5, h: 0.8,
      fontFace: F.sans, fontSize: 12, color: C.brown, lineSpacing: 16, margin: 0,
    });
    // Yes/No examples
    slide.addText([
      { text: "YES  ", options: { fontFace: "Courier New", fontSize: 8, color: "1D9E75", bold: true } },
      { text: p.yes, options: { fontFace: F.serif, italic: true, fontSize: 11, color: C.brown } },
    ], { x: 10.4, y, w: 2.4, h: 0.6, margin: 0, lineSpacing: 14 });
    slide.addText([
      { text: "NO   ", options: { fontFace: "Courier New", fontSize: 8, color: C.red, bold: true } },
      { text: p.no, options: { fontFace: F.serif, italic: true, fontSize: 11, color: C.brown } },
    ], { x: 10.4, y: y + 0.7, w: 2.4, h: 0.6, margin: 0, lineSpacing: 14 });
    if (i < principles.length - 1) hairline(slide, 0.6, y + 1.45, 12.1, C.line);
  });

  pageNum(slide, n, TOTAL);
}

// ===== 16. Application — web + don'ts ===================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.cream };
  eyebrow(slide, 0.6, 0.6, "12 · Application / web hero");
  hairline(slide, 0.6, 0.95, 12.1);

  slide.addText("In the wild.", {
    x: 0.6, y: 1.2, w: 12, h: 0.7,
    fontFace: F.sans, fontSize: 32, color: C.ink, charSpacing: -1, margin: 0,
  });

  // Browser frame mockup
  slide.addShape("rect", { x: 0.6, y: 2.2, w: 12.1, h: 5.0, fill: { color: C.white }, line: { color: C.line, width: 0.5 }, shadow: newShadow() });
  // Chrome bar
  slide.addShape("rect", { x: 0.6, y: 2.2, w: 12.1, h: 0.4, fill: { color: "ECECEC" }, line: { color: "ECECEC", width: 0 } });
  slide.addShape("ellipse", { x: 0.85, y: 2.32, w: 0.15, h: 0.15, fill: { color: "C9C9C9" }, line: { color: "C9C9C9", width: 0 } });
  slide.addShape("ellipse", { x: 1.05, y: 2.32, w: 0.15, h: 0.15, fill: { color: "C9C9C9" }, line: { color: "C9C9C9", width: 0 } });
  slide.addShape("ellipse", { x: 1.25, y: 2.32, w: 0.15, h: 0.15, fill: { color: "C9C9C9" }, line: { color: "C9C9C9", width: 0 } });
  slide.addText("boothfunnel.com", {
    x: 5.5, y: 2.27, w: 3, h: 0.25,
    fontFace: "Courier New", fontSize: 10, color: "6B6B6B", align: "center", margin: 0,
  });

  // Site nav
  slide.addText([
    { text: "Booth", options: { fontFace: F.sans, fontSize: 16, color: C.ink, bold: false } },
    { text: "funnel", options: { fontFace: F.serif, italic: true, fontSize: 16, color: C.red } },
  ], { x: 1.0, y: 2.85, w: 2, h: 0.4, margin: 0, valign: "middle" });
  slide.addText("How it works  ·  Industries  ·  Pricing  ·  Case studies", {
    x: 4.5, y: 2.9, w: 5.5, h: 0.3,
    fontFace: F.sans, fontSize: 11, color: C.brown, align: "center", margin: 0,
  });
  slide.addShape("rect", { x: 11.0, y: 2.83, w: 1.4, h: 0.36, fill: { color: C.ink }, line: { color: C.ink, width: 0 } });
  slide.addText("Start your booth", {
    x: 11.0, y: 2.85, w: 1.4, h: 0.32,
    fontFace: F.sans, fontSize: 9, color: C.cream, align: "center", valign: "middle", margin: 0,
  });

  // Hero content
  slide.addShape("line", { x: 0.6, y: 3.4, w: 12.1, h: 0, line: { color: C.line, width: 0.5 } });

  // Hero: cream background
  slide.addShape("rect", { x: 0.6, y: 3.4, w: 12.1, h: 3.8, fill: { color: C.cream }, line: { color: C.cream, width: 0 } });

  // Eyebrow
  slide.addText("BRANDED PHOTOBOOTHS FOR VENUES", {
    x: 1.0, y: 3.7, w: 6, h: 0.3,
    fontFace: F.sans, fontSize: 9, color: C.rust, charSpacing: 4, bold: true, margin: 0,
  });
  // Headline with italic moment
  slide.addText([
    { text: "Photobooths that ", options: { fontFace: F.sans, fontSize: 38, color: C.ink, charSpacing: -1 } },
    { text: "pay for themselves", options: { fontFace: F.serif, italic: true, fontSize: 38, color: C.red, charSpacing: -0.5 } },
    { text: ".", options: { fontFace: F.sans, fontSize: 38, color: C.ink } },
  ], { x: 1.0, y: 4.0, w: 6.5, h: 1.4, margin: 0 });

  slide.addText("Branded social booths for bars, restaurants, and event venues — built so every guest becomes your next ad.", {
    x: 1.0, y: 5.55, w: 6.5, h: 0.8,
    fontFace: F.sans, fontSize: 13, color: C.brown, lineSpacing: 20, margin: 0,
  });

  // CTAs
  slide.addShape("rect", { x: 1.0, y: 6.6, w: 1.7, h: 0.4, fill: { color: C.red }, line: { color: C.red, width: 0 } });
  slide.addText("Start your booth", {
    x: 1.0, y: 6.62, w: 1.7, h: 0.36, fontFace: F.sans, fontSize: 11, color: C.cream, align: "center", valign: "middle", bold: true, margin: 0,
  });
  slide.addShape("rect", { x: 2.85, y: 6.6, w: 1.7, h: 0.4, fill: { type: "none" }, line: { color: C.ink, width: 1 } });
  slide.addText("See how it works", {
    x: 2.85, y: 6.62, w: 1.7, h: 0.36, fontFace: F.sans, fontSize: 11, color: C.ink, align: "center", valign: "middle", margin: 0,
  });

  // Right side: Polaroid prints stacked
  // Frame 1
  slide.addShape("rect", { x: 8.2, y: 3.7, w: 1.9, h: 2.3, fill: { color: C.white }, line: { color: C.line, width: 0.5 }, rotate: -6, shadow: newShadow() });
  slide.addShape("rect", { x: 8.35, y: 3.85, w: 1.6, h: 1.6, fill: { color: C.ink }, line: { color: C.ink, width: 0 }, rotate: -6 });
  slide.addText("— Brooklyn", { x: 8.35, y: 5.55, w: 1.6, h: 0.3, fontFace: "Courier New", fontSize: 8, color: C.ink, rotate: -6, margin: 0 });

  // Frame 2 (with red stamp)
  slide.addShape("rect", { x: 9.7, y: 3.5, w: 1.9, h: 2.3, fill: { color: C.white }, line: { color: C.line, width: 0.5 }, rotate: 4, shadow: newShadow() });
  slide.addShape("rect", { x: 9.85, y: 3.65, w: 1.6, h: 1.6, fill: { color: C.brass }, line: { color: C.brass, width: 0 }, rotate: 4 });
  // tiny red stamp
  slide.addShape("ellipse", { x: 11.05, y: 5.05, w: 0.35, h: 0.35, fill: { color: C.red }, line: { color: C.red, width: 0 }, rotate: 4 });
  slide.addText("bf", { x: 11.05, y: 5.07, w: 0.35, h: 0.32, fontFace: F.serif, italic: true, fontSize: 9, color: C.cream, align: "center", valign: "middle", rotate: 4, margin: 0 });

  // Frame 3
  slide.addShape("rect", { x: 11.0, y: 3.95, w: 1.9, h: 2.3, fill: { color: C.white }, line: { color: C.line, width: 0.5 }, rotate: -3, shadow: newShadow() });
  slide.addShape("rect", { x: 11.15, y: 4.1, w: 1.6, h: 1.6, fill: { color: C.red }, line: { color: C.red, width: 0 }, rotate: -3 });

  pageNum(slide, n, TOTAL);
}

// ===== 17. Closing / asset library =======================================
{
  n++;
  const slide = pres.addSlide();
  slide.background = { color: C.ink };

  slide.addText("·  ·  ·", {
    x: 0.6, y: 0.8, w: 6, h: 0.3,
    fontFace: F.sans, fontSize: 10, color: C.brass, charSpacing: 8, margin: 0,
  });

  slide.addText("Use it well.", {
    x: 0.6, y: 2.4, w: 12, h: 1.2,
    fontFace: F.sans, fontSize: 56, color: C.cream, charSpacing: -2, margin: 0,
  });

  slide.addText([
    { text: "The brand is a tool, not a constraint. ", options: { fontFace: F.serif, italic: true, fontSize: 18, color: C.brass } },
    { text: "When in doubt, default to restraint. The italic moment matters because it's rare. The red matters because most of the world is cream and ink.", options: { fontFace: F.sans, fontSize: 16, color: C.cream, lineSpacing: 24 } },
  ], { x: 0.6, y: 3.7, w: 8.5, h: 1.5, margin: 0 });

  hairline(slide, 0.6, 5.5, 12.1, C.brass);

  slide.addText("ASSET LIBRARY", { x: 0.6, y: 5.7, w: 6, h: 0.25, fontFace: F.sans, fontSize: 9, color: C.brass, charSpacing: 3, bold: true, margin: 0 });
  slide.addText([
    { text: "Logos · ", options: { fontFace: F.sans, fontSize: 12, color: C.brass } },
    { text: "boothfunnel.com/brand/logos", options: { fontFace: "Courier New", fontSize: 12, color: C.cream, breakLine: true } },
    { text: "Source files · ", options: { fontFace: F.sans, fontSize: 12, color: C.brass } },
    { text: "github.com/brainwashedtv/boothfunnel/brand", options: { fontFace: "Courier New", fontSize: 12, color: C.cream, breakLine: true } },
    { text: "Brand owner · ", options: { fontFace: F.sans, fontSize: 12, color: C.brass } },
    { text: "David Brain", options: { fontFace: F.sans, fontSize: 12, color: C.cream, italic: true } },
  ], { x: 0.6, y: 6.0, w: 12, h: 1.0, margin: 0, lineSpacing: 18 });

  // Big seal in the corner
  seal(slide, { x: SLIDE_W - 1.6, y: 1.0, d: 0.9, mode: "ink" });

  slide.addText("Boothfunnel · Brand Book v1.0 · Heritage Frame", {
    x: 0.6, y: SLIDE_H - 0.5, w: 6, h: 0.25,
    fontFace: F.sans, fontSize: 9, color: C.brass, charSpacing: 1, margin: 0,
  });
  slide.addText(`${TOTAL} / ${TOTAL}`, {
    x: SLIDE_W - 1.4, y: SLIDE_H - 0.5, w: 1, h: 0.25,
    fontFace: F.sans, fontSize: 9, color: C.brass, align: "right", margin: 0,
  });
}

// ----- Write the file ----------------------------------------------------
const outDir = path.dirname(__filename);
const outFile = path.join(outDir, "BoothFunnel-Brand-Book-v1.pptx");
pres.writeFile({ fileName: outFile }).then(() => {
  console.log(`Wrote: ${outFile}`);
}).catch(e => {
  console.error("Failed:", e);
  process.exit(1);
});
