import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
function rgbToHex(r, g, b) {
  const toHex = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function hueToRgb(h) {
  const c = 1, x = 1 - Math.abs(((h / 60) % 2) - 1);
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [r * 255, g * 255, b * 255];
}
function rgbToHwb(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const w = min, blk = 1 - max;
  let h;
  if (max === min) h = 0;
  else {
    const d = max - min;
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h: Math.round(h), w: Math.round(w * 100), b: Math.round(blk * 100) };
}
function hwbToHex(h, w, b) {
  w /= 100; b /= 100;
  if (w + b >= 1) {
    const gray = Math.round((w / (w + b)) * 255);
    return rgbToHex(gray, gray, gray);
  }
  const [pr, pg, pb] = hueToRgb(h);
  const mix = (c) => c * (1 - w - b) + w * 255;
  return rgbToHex(mix(pr), mix(pg), mix(pb));
}

export default function HSLColorPicker({ value, onChange, label }) {
  const [hwb, setHwb] = useState(() => { const [r, g, b] = hexToRgb(value); return rgbToHwb(r, g, b); });
  const { t } = useLanguage();

  useEffect(() => {
    const [r, g, b] = hexToRgb(value);
    setHwb(rgbToHwb(r, g, b));
  }, [value]);

  function update(next) {
    const merged = { ...hwb, ...next };
    if (merged.w + merged.b > 100) {
      if (next.w !== undefined) merged.b = 100 - merged.w;
      else merged.w = 100 - merged.b;
    }
    setHwb(merged);
    onChange(hwbToHex(merged.h, merged.w, merged.b));
  }

  const hueGradient = "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)";
  const pureHex = rgbToHex(...hueToRgb(hwb.h));
  const whiteGradient = `linear-gradient(to right, ${pureHex}, #fff)`;
  const blackGradient = `linear-gradient(to right, ${pureHex}, #000)`;

  return (
    <div style={{ minWidth: 180 }}>
      {label && <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: value, borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", flexShrink: 0 }} />
        <div style={{ fontSize: 11, opacity: 0.6, fontFamily: "monospace" }}>{value}</div>
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, opacity: 0.5 }}>{t("hslColorPicker.hue")}</div>
        <input type="range" min="0" max="360" value={hwb.h} onChange={(e) => update({ h: Number(e.target.value) })}
          style={{ width: "100%", height: 10, borderRadius: 999, background: hueGradient, appearance: "none", cursor: "pointer" }} />
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, opacity: 0.5 }}>{t("hslColorPicker.whiteness")}</div>
        <input type="range" min="0" max="100" value={hwb.w} onChange={(e) => update({ w: Number(e.target.value) })}
          style={{ width: "100%", height: 10, borderRadius: 999, background: whiteGradient, appearance: "none", cursor: "pointer" }} />
      </div>
      <div>
        <div style={{ fontSize: 10, opacity: 0.5 }}>{t("hslColorPicker.blackness")}</div>
        <input type="range" min="0" max="100" value={hwb.b} onChange={(e) => update({ b: Number(e.target.value) })}
          style={{ width: "100%", height: 10, borderRadius: 999, background: blackGradient, appearance: "none", cursor: "pointer" }} />
      </div>
    </div>
  );
}
