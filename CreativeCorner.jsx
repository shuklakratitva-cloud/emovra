import { useRef, useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const PROMPTS = [
  "Draw or describe what calm feels like to you.",
  "Write a letter to yourself from a year in the future.",
  "If your mood today was a weather forecast, what would it say?",
  "Sketch or describe your happy place.",
  "Write three words that describe today, then explain one of them.",
  "Draw something that made you smile recently, even a small thing.",
  "Write a message you'd want to hear on a hard day.",
];

const CANVAS_BG = "#0f0f11";
const SWATCHES = ["#d4b07a", "#f87171", "#4ade80", "#60a5fa", "#e8dcc6", "#ffffff"];
const BRUSH_SIZES = [{ label: "S", size: 2 }, { label: "M", size: 5 }, { label: "L", size: 10 }, { label: "XL", size: 18 }];

function ColorWheel({ onPick }) {
  const { t } = useLanguage();
  const wheelRef = useRef(null);
  function handleClick(e) {
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const radius = rect.width / 2;
    if (dist > radius) return;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    angle = (angle + 90 + 360) % 360;
    const sat = Math.min(100, Math.round((dist / radius) * 100));
    onPick(angle, sat);
  }
  return (
    <div
      ref={wheelRef}
      onClick={handleClick}
      title={t("creativeCorner.colorWheelTitle")}
      style={{
        width: 90, height: 90, borderRadius: "50%", cursor: "crosshair", flexShrink: 0,
        background: "conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)",
        border: "2px solid var(--border)",
      }}
    />
  );
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export default function CreativeCorner() {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#d4b07a");
  const [brushSize, setBrushSize] = useState(5);
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const [writing, setWriting] = useState("");

  // NEW: undo/redo - a stack of full canvas snapshots. Simple and robust
  // for a casual doodle pad (this canvas is small, so full-frame snapshots
  // are cheap) rather than trying to track individual stroke commands.
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  function snapshot() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  function pushUndo() {
    undoStack.current.push(snapshot());
    if (undoStack.current.length > 30) undoStack.current.shift();
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }

  function undo() {
    if (undoStack.current.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    redoStack.current.push(snapshot());
    const prev = undoStack.current.pop();
    ctx.putImageData(prev, 0, 0);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
  }

  function redo() {
    if (redoStack.current.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    undoStack.current.push(snapshot());
    const next = redoStack.current.pop();
    ctx.putImageData(next, 0, 0);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
  }

  function pos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function start(e) {
    pushUndo();
    setDrawing(true);
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e) {
    if (!drawing) return;
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  function end() { setDrawing(false); }

  function clearCanvas() {
    pushUndo();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function download() {
    const link = document.createElement("a");
    link.download = "emovra-creative-corner.png";
    link.href = canvasRef.current.toDataURL();
    link.click();
  }

  function newPrompt() {
    setPromptIndex(Math.floor(Math.random() * PROMPTS.length));
  }

  function pickFromWheel(hue, sat) {
    setColor(hslToHex(hue, sat, 50));
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>{t("creativeCorner.heading")}</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 10, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, fontStyle: "italic", flex: 1, margin: 0 }}>"{t(`creativeCorner.prompt.${promptIndex}`)}"</p>
        <button onClick={newPrompt} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>{t("creativeCorner.newPrompt")}</button>
      </div>

      <textarea rows={3} value={writing} onChange={(e) => setWriting(e.target.value)} placeholder={t("creativeCorner.writePlaceholder")} style={{ width: "100%", marginTop: 12, padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }} />

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>{t("creativeCorner.doodleLabel")}</div>
        <canvas
          ref={canvasRef}
          width={600} height={280}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
          style={{ width: "100%", height: 220, borderRadius: 12, border: "1px solid var(--border)", touchAction: "none", cursor: "crosshair", display: "block" }}
        />

        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <ColorWheel onPick={pickFromWheel} />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {SWATCHES.map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, borderWidth: color === c ? 2 : 1, borderStyle: "solid", borderColor: color === c ? "#fff" : "var(--border)", cursor: "pointer" }} />
              ))}
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: color, borderWidth: 2, borderStyle: "solid", borderColor: "#fff", marginLeft: 4 }} title={t("creativeCorner.currentColorTitle")} />
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 10, opacity: 0.5, marginRight: 4 }}>{t("creativeCorner.brushLabel")}</span>
              {BRUSH_SIZES.map((b) => (
                <button
                  key={b.label}
                  onClick={() => setBrushSize(b.size)}
                  title={`${b.size}px`}
                  style={{
                    width: 30, height: 26, borderRadius: 6, fontSize: 11, cursor: "pointer",
                    borderWidth: brushSize === b.size ? 2 : 1, borderStyle: "solid",
                    borderColor: brushSize === b.size ? "var(--accent)" : "var(--border)",
                    background: brushSize === b.size ? "rgba(212,176,122,0.15)" : "transparent",
                    color: "var(--text)",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={undo} disabled={!canUndo} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border)", color: canUndo ? "var(--text)" : "var(--muted)", borderRadius: 8, padding: "6px 10px", cursor: canUndo ? "pointer" : "not-allowed", opacity: canUndo ? 1 : 0.4 }}>{t("creativeCorner.undo")}</button>
              <button onClick={redo} disabled={!canRedo} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border)", color: canRedo ? "var(--text)" : "var(--muted)", borderRadius: 8, padding: "6px 10px", cursor: canRedo ? "pointer" : "not-allowed", opacity: canRedo ? 1 : 0.4 }}>{t("creativeCorner.redo")}</button>
              <button onClick={clearCanvas} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>{t("creativeCorner.clear")}</button>
              <button onClick={download} style={{ fontSize: 11, background: "#d4b07a", border: "none", color: "#000", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontWeight: 700 }}>{t("creativeCorner.saveImage")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
