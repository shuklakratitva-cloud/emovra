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
export function extractThemeFromImage(imgElement) {
  try {
    const size = 80; 
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgElement, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const buckets = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 200) continue; 
      const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
      if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
      buckets[key].r += r; buckets[key].g += g; buckets[key].b += b; buckets[key].count += 1;
    }
    const clusters = Object.values(buckets)
      .map((c) => ({ r: c.r / c.count, g: c.g / c.count, b: c.b / c.count, count: c.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12); 
    if (clusters.length === 0) return null;
    const withHsl = clusters.map((c) => {
      const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
      return { ...c, h, s, l };
    });
       const bgCandidate = [...withHsl].sort((a, b) => a.l - b.l)[0];
       const accentCandidate = [...withHsl]
      .filter((c) => c.l > 25 && c.l < 85)
      .sort((a, b) => b.s - a.s)[0] || withHsl[0];
        const cardCandidate = [...withHsl]
      .filter((c) => c !== bgCandidate)
      .sort((a, b) => Math.abs(a.l - 20) - Math.abs(b.l - 20))[0] || bgCandidate;
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
    return null; 
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
