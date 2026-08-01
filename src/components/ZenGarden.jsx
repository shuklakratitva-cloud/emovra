import React, { useRef, useEffect, useState } from "react";

export default function ZenGarden() {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPoint = useRef(null);
  const [rakeWidth, setRakeWidth] = useState(5);

  function getSandGradient(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#e8dcc0");
    grad.addColorStop(1, "#d8c8a0");
    return grad;
  }

  function resetSand() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = getSandGradient(ctx, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(() => { resetSand(); }, []);

  function pointFromEvent(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
  }

  function rakeAt(from, to) {
    const ctx = canvasRef.current.getContext("2d");
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len; // perpendicular, for prong offsets

    ctx.strokeStyle = "rgba(120,100,60,0.35)";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    const prongs = 5;
    for (let p = -Math.floor(prongs / 2); p <= Math.floor(prongs / 2); p++) {
      const offset = p * rakeWidth;
      ctx.beginPath();
      ctx.moveTo(from.x + nx * offset, from.y + ny * offset);
      ctx.lineTo(to.x + nx * offset, to.y + ny * offset);
      ctx.stroke();
    }
  }

  function start(e) {
    drawing.current = true;
    lastPoint.current = pointFromEvent(e);
  }
  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const p = pointFromEvent(e);
    rakeAt(lastPoint.current, p);
    lastPoint.current = p;
  }
  function end() {
    drawing.current = false;
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🪨 Zen Garden</h2>
      <p style={{ fontSize: 12, opacity: 0.6 }}>Drag across the sand to rake it - no goal, just movement.</p>
      <canvas
        ref={canvasRef}
        width={560}
        height={320}
        style={{ width: "100%", maxWidth: 560, height: "auto", borderRadius: 12, marginTop: 12, cursor: "crosshair", touchAction: "none" }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
        <label style={{ fontSize: 11, opacity: 0.6 }}>Rake width</label>
        <input type="range" min={2} max={12} value={rakeWidth} onChange={(e) => setRakeWidth(Number(e.target.value))} />
        <button onClick={resetSand} style={{ padding: "6px 14px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 11 }}>
          Smooth the sand
        </button>
      </div>
    </div>
  );
}
