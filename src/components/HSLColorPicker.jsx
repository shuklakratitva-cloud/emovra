import React, { useState, useEffect } from "react";

// Explicit Hue/Saturation/Lightness sliders, replacing the native
// <input type="color"> picker - the native one uses a single gradient
// square where brightness and saturation are mixed together (standard
// HSV picker behavior in every browser), which makes it hard to just dial
// in "bright red" directly. This gives Lightness its own dedicated slider.

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
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
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export default function HSLColorPicker({ value, onChange, label }) {
  const [hsl, setHsl] = useState(() => hexToHsl(value));

  // keep in sync if the value changes from outside (e.g. "use my mood as background")
  useEffect(() => { setHsl(hexToHsl(value)); }, [value]);

  function update(next) {
    const merged = { ...hsl, ...next };
    setHsl(merged);
    onChange(hslToHex(merged.h, merged.s, merged.l));
  }

  const hueGradient = "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)";
  const satGradient = `linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))`;
  const lightGradient = `linear-gradient(to right, #000, hsl(${hsl.h},${hsl.s}%,50%), #fff)`;

  return (
    <div style={{ minWidth: 180 }}>
      {label && <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: value, borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", flexShrink: 0 }} />
        <div style={{ fontSize: 11, opacity: 0.6, fontFamily: "monospace" }}>{value}</div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, opacity: 0.5 }}>Hue</div>
        <input type="range" min="0" max="360" value={hsl.h} onChange={(e) => update({ h: Number(e.target.value) })}
          style={{ width: "100%", height: 10, borderRadius: 999, background: hueGradient, appearance: "none", cursor: "pointer" }} />
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, opacity: 0.5 }}>Saturation</div>
        <input type="range" min="0" max="100" value={hsl.s} onChange={(e) => update({ s: Number(e.target.value) })}
          style={{ width: "100%", height: 10, borderRadius: 999, background: satGradient, appearance: "none", cursor: "pointer" }} />
      </div>
      <div>
        <div style={{ fontSize: 10, opacity: 0.5 }}>Brightness</div>
        <input type="range" min="0" max="100" value={hsl.l} onChange={(e) => update({ l: Number(e.target.value) })}
          style={{ width: "100%", height: 10, borderRadius: 999, background: lightGradient, appearance: "none", cursor: "pointer" }} />
      </div>
    </div>
  );
}
