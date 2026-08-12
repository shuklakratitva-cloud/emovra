// src/utils/extractColors.js
//
// Pure client-side dominant-color extraction - no API call, no cost, works
// on any uploaded or generated image. Draws the image to a small offscreen
// canvas, samples pixels, buckets them into rough color clusters, and picks
// three that make sense as bg/card/accent based on lightness and
// saturation - not just "the 3 most common colors" (which tends to pick
// near-duplicates), but one dark, one vivid, and one mid-tone.

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function rgbToHex(r, g, b) {
  const toHex = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Returns { bg, card, accent } hex colors extracted from the given image,
// or null if extraction fails (e.g. a CORS-tainted canvas).
export function extractThemeFromImage(imgElement) {
  try {
    const size = 80; // small sample size is plenty and keeps this fast
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgElement, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    // Bucket pixels into coarse color groups (16 levels per channel) so
    // near-identical shades count as the same color instead of hundreds
    // of near-duplicate single-pixel "clusters".
    const buckets = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 200) continue; // skip transparent pixels
      const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
      if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
      buckets[key].r += r; buckets[key].g += g; buckets[key].b += b; buckets[key].count += 1;
    }

    const clusters = Object.values(buckets)
      .map((c) => ({ r: c.r / c.count, g: c.g / c.count, b: c.b / c.count, count: c.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12); // work with the 12 most common clusters

    if (clusters.length === 0) return null;

    const withHsl = clusters.map((c) => {
      const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
      return { ...c, h, s, l };
    });

    // bg: darkest cluster with reasonable frequency (dark theme feel)
    const bgCandidate = [...withHsl].sort((a, b) => a.l - b.l)[0];
    // accent: most saturated, reasonably lit cluster (a color that pops)
    const accentCandidate = [...withHsl]
      .filter((c) => c.l > 25 && c.l < 85)
      .sort((a, b) => b.s - a.s)[0] || withHsl[0];
    // card: a mid-lightness cluster, distinct from bg
    const cardCandidate = [...withHsl]
      .filter((c) => c !== bgCandidate)
      .sort((a, b) => Math.abs(a.l - 20) - Math.abs(b.l - 20))[0] || bgCandidate;

    // Darken bg/card if the image is naturally bright, so the app stays
    // readable with light text - this is a wellness app, not a poster.
    const darken = (c, targetL) => {
      const [h, s] = rgbToHsl(c.r, c.g, c.b);
      return hslToHex(h, Math.min(s, 55), Math.min(targetL, c.l));
    };

    return {
      bg: darken(bgCandidate, 10),
      card: darken(cardCandidate, 16),
      accent: rgbToHex(accentCandidate.r, accentCandidate.g, accentCandidate.b),
    };
  } catch {
    return null; // CORS-tainted canvas or unreadable image - caller shows an error
  }
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
