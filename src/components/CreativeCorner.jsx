import { useRef, useState, useEffect } from "react";

const PROMPTS = [
  "Draw or describe what calm feels like to you.",
  "Write a letter to yourself from a year in the future.",
  "If your mood today was a weather forecast, what would it say?",
  "Sketch or describe your happy place.",
  "Write three words that describe today, then explain one of them.",
  "Draw something that made you smile recently, even a small thing.",
  "Write a message you'd want to hear on a hard day.",
];

export default function CreativeCorner() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#d4b07a");
  const [prompt, setPrompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [writing, setWriting] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f0f11";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  function pos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function start(e) {
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
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  function end() { setDrawing(false); }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f0f11";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function download() {
    const link = document.createElement("a");
    link.download = "emovra-creative-corner.png";
    link.href = canvasRef.current.toDataURL();
    link.click();
  }

  function newPrompt() {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2 style={{ margin: 0 }}>🎨 Creative Corner</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 10, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, fontStyle: "italic", flex: 1, margin: 0 }}>"{prompt}"</p>
        <button onClick={newPrompt} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>New prompt</button>
      </div>

      <textarea rows={3} value={writing} onChange={(e) => setWriting(e.target.value)} placeholder="Write here, if that's more your thing..." style={{ width: "100%", marginTop: 12, padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }} />

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>...or doodle</div>
        <canvas
          ref={canvasRef}
          width={600} height={280}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
          style={{ width: "100%", height: 220, borderRadius: 12, border: "1px solid var(--border)", touchAction: "none", cursor: "crosshair" }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
          {["#d4b07a","#f87171","#4ade80","#60a5fa","#e8dcc6"].map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: color === c ? "2px solid #fff" : "1px solid var(--border)", cursor: "pointer" }} />
          ))}
          <button onClick={clearCanvas} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>Clear</button>
          <button onClick={download} style={{ fontSize: 11, background: "#d4b07a", border: "none", color: "#000", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontWeight: 700 }}>Save as image</button>
        </div>
      </div>
    </div>
  );
}
