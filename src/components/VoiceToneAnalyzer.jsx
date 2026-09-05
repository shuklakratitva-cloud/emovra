import { useState, useRef, useEffect } from "react";
import { analyzeRisk } from "../utils/analyzeRisk.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { getMicErrorKey } from "../utils/micError.js";

import { API_BASE as API } from "../config/api.js";

const LEVEL_LABEL_KEY = {
  RED: "voiceToneAnalyzer.levelRed",
  ORANGE: "voiceToneAnalyzer.levelOrange",
  GREEN: "voiceToneAnalyzer.levelGreen",
};
function levelLabel(t, level) {
  return t(LEVEL_LABEL_KEY[level] || level);
}

const EMOTION_LABEL_KEY = {
  calm: "voiceToneAnalyzer.emotionCalm",
  "sad / low energy": "voiceToneAnalyzer.emotionSadLowEnergy",
};
function emotionLabel(t, emotion) {
  return t(EMOTION_LABEL_KEY[emotion] || emotion);
}

export default function VoiceToneAnalyzer({ onResult, token }) {
  const { t } = useLanguage();
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const dataRef = useRef({ vols: [], silent: 0 });
  const rafRef = useRef(null);
  const intervalRef = useRef(null);
  const startRef = useRef(0);
  const recogRef = useRef(null);
  // FIX: the 5-minute auto-stop below never actually fired. start()'s
  // setInterval closed over the `stop` from the render in which start()
  // ran - a render where `recording` was still false - and stop()'s first
  // line is `if (!recording) return;`. So at 300s the interval called a
  // permanently no-op stop, once a second, forever: the mic stayed live,
  // the rAF loop kept pushing samples, and MediaRecorder kept accumulating
  // chunks until the user manually hit Stop or navigated away. Mirroring
  // `recording` into a ref lets stop() read the live value regardless of
  // which render's closure invoked it.
  const recordingRef = useRef(false);

  // FIX: start() opens the mic (getUserMedia), an AudioContext
  // analyser loop (requestAnimationFrame), a setInterval timer, and
  // speech recognition - but previously all of that was only torn down
  // inside stop(), never on unmount. This component is rendered
  // conditionally under a tab in MindGuardApp.jsx, so switching to a
  // different tab mid-recording unmounted it without ever calling
  // stop() - leaving the microphone live, the rAF loop running, and the
  // interval firing against refs of an unmounted component for up to 5
  // minutes, with no visual indication to the user that their mic was
  // still recording.
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      cancelAnimationFrame(rafRef.current);
      try {
        recogRef.current?.stop();
      } catch {}
      try {
        if (recorderRef.current?.state !== "inactive") recorderRef.current.stop();
      } catch {}
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setError("");
    setResult(null);
    setAudioURL(null);
    setTranscript("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      dataRef.current = { vols: [], silent: 0 };
      const buf = new Uint8Array(analyser.frequencyBinCount);
      function loop() {
        analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        const vol = sum / buf.length;
        dataRef.current.vols.push(vol);
        if (vol < 18) dataRef.current.silent++;
        rafRef.current = requestAnimationFrame(loop);
      }
      loop();

      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        recogRef.current = rec;
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        let finalText = "";
        rec.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalText += t + " ";
            else interim += t;
          }
          setTranscript((finalText + interim).trim());
        };
        rec.onerror = () => {};
        rec.start();
      } else {
        setTranscript(t("voiceToneAnalyzer.speechNotSupported"));
      }

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size > 0) {
          setAudioURL(URL.createObjectURL(blob));

          if (token) {
            try {
              setAiLoading(true);
              const form = new FormData();
              form.append("audio", blob, "voice.webm");
              const res = await fetch(`${API}/voice/analyze`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
              });
              const aiData = await res.json();
              if (aiData.success) {
                if (!transcript || transcript.length < 3) setTranscript(aiData.transcript);

                setResult((prev) =>
                  prev
                    ? {
                        ...prev,
                        transcript: aiData.transcript || prev.transcript,
                        riskLevel: aiData.riskLevel || prev.riskLevel,
                        level: aiData.riskLevel || prev.level,
                        score: aiData.score ?? prev.score,
                        isAI: true,
                        saved: true,
                      }
                    : null
                );
              }
            } catch (err) {
              console.error("Gemini voice save failed:", err);
            } finally {
              setAiLoading(false);
            }
          }
        }
      };
      recorder.start(1000);

      startRef.current = Date.now();
      recordingRef.current = true;
      setRecording(true);
      setTimer(0);
      intervalRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - startRef.current) / 1000);
        setTimer(s);
        if (s >= 300) stop();
      }, 1000);
    } catch (e) {
      setError(t(getMicErrorKey(e, "voiceToneAnalyzer")));
    }
  }

  function stop() {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    clearInterval(intervalRef.current);
    cancelAnimationFrame(rafRef.current);
    try {
      recogRef.current?.stop();
    } catch {}
    try {
      if (recorderRef.current?.state !== "inactive") recorderRef.current.stop();
    } catch {}
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    setRecording(false);

    const { vols, silent } = dataRef.current;
    const text = transcript || "";
    const wordAnalysis = analyzeRisk(text);

    let avg = 20,
      pause = 0,
      variance = 100;
    if (vols.length) {
      avg = vols.reduce((a, b) => a + b, 0) / vols.length;
      variance = vols.reduce((a, b) => a + (b - avg) * (b - avg), 0) / vols.length;
      pause = (silent / vols.length) * 100;
    }

    let level = wordAnalysis ? wordAnalysis.level : "GREEN";
    let score = wordAnalysis ? wordAnalysis.score : 0;
    let reasons = wordAnalysis ? [...wordAnalysis.reasons] : [];
    let emotion = wordAnalysis ? wordAnalysis.emotion : "calm";

    if (pause > 40 || (avg < 20 && variance < 200)) {
      score += 25;
      reasons.push(t("voiceToneAnalyzer.reasonLowEnergyPause", { pause: pause.toFixed(0) }));
      if (score >= 70) level = "RED";
      else if (score >= 35 && level === "GREEN") level = "ORANGE";
      emotion = emotion === "calm" ? "sad / low energy" : emotion;
    }
    if (variance > 500) {
      score += 15;
      reasons.push(t("voiceToneAnalyzer.reasonVoiceUnstable"));
      if (level === "GREEN") level = "ORANGE";
    }

    if (score >= 75) level = "RED";
    else if (score >= 40) level = "ORANGE";
    else level = "GREEN";

    const isCrisis = level === "RED";

    const out = {
      transcript: text || t("voiceToneAnalyzer.noWordsDetected"),
      duration: timer,
      riskLevel: level,
      level,
      score: Math.min(score, 100),
      emotion,
      sentiment: score > 35 ? "negative" : score < 15 ? "positive" : "neutral",
      reasons: [...new Set(reasons)].slice(0, 8),
      pauseRatio: pause.toFixed(1),
      avgVolume: Math.round(avg),
      isCrisis,
      helpline: isCrisis
        ? t("voiceToneAnalyzer.helplineText", { teleManas: "14416", kiran: "1800-599-0019" })
        : null,
      advice: isCrisis
        ? t("voiceToneAnalyzer.crisisAdvice", { number: "14416" })
        : wordAnalysis?.advice || t("voiceToneAnalyzer.adviceStable"),
      wordScore: wordAnalysis?.score || 0,
      toneScore: Math.round(pause),
      isAI: false,
    };
    setResult(out);
    if (onResult) onResult(out);
  }

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")} / 05:00`;
  const color =
    result?.level === "RED" ? "#dc2626" : result?.level === "ORANGE" ? "#ea580c" : "#16a34a";

  return (
    <div
      style={{
        maxWidth: 700,
        width: "100%",
        background: "var(--card-bg, #fff)",
        border: "1px solid var(--border, #ddd)",
        borderRadius: 12,
        padding: 16,
        textAlign: "left",
      }}
    >
      <h3 style={{ margin: 0 }}>{t("voiceToneAnalyzer.heading")}</h3>
      <p style={{ fontSize: 12, opacity: 0.7, margin: "6px 0" }}>
        {t("voiceToneAnalyzer.subtitle")}
      </p>
      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: 8,
            borderRadius: 8,
            fontSize: 12,
            marginTop: 8,
          }}
        >
          {error}
        </div>
      )}
      <div
        style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}
      >
        {!recording ? (
          <button
            onClick={start}
            className="primary-btn"
            style={{
              background: "#E7D3A3",
              padding: "10px 20px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {t("voiceToneAnalyzer.startButton")}
          </button>
        ) : (
          <button
            onClick={stop}
            className="primary-btn"
            style={{
              background: "#dc2626",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
            }}
          >
            {t("voiceToneAnalyzer.stopButton", { time: fmt(timer) })}
          </button>
        )}
        {recording && (
          <span style={{ fontWeight: 800, color: "#dc2626" }}>
            {t("voiceToneAnalyzer.recStatus", {
              time: fmt(timer),
              transcript: transcript.slice(-40),
            })}
          </span>
        )}
        {aiLoading && (
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {t("voiceToneAnalyzer.geminiAnalyzing")}
          </span>
        )}
      </div>
      {transcript && (
        <div
          style={{
            marginTop: 10,
            padding: 8,
            background: "#f3f4f6",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          <b>{t("voiceToneAnalyzer.heardLabel")}</b> {transcript}
        </div>
      )}
      {audioURL && <audio controls src={audioURL} style={{ width: "100%", marginTop: 10 }} />}
      {result && (
        <div
          style={{
            marginTop: 14,
            border: `2px solid ${color}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: color,
              color: "white",
              padding: "10px 14px",
              fontWeight: 800,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              {t("voiceToneAnalyzer.riskLabel", {
                level: levelLabel(t, result.level),
                aiTag: result.isAI ? t("voiceToneAnalyzer.geminiTag") : "",
              })}
            </span>
            <span>{t("voiceToneAnalyzer.scoreLabel", { score: result.score })}</span>
          </div>
          <div style={{ padding: 12, background: "#f9fafb", fontSize: 13, lineHeight: 1.7 }}>
            <div>
              <b>{t("voiceToneAnalyzer.wordsLabel")}</b> {result.transcript}
            </div>
            <div>
              <b>{t("voiceToneAnalyzer.emotionLabel")}</b> {emotionLabel(t, result.emotion)} |{" "}
              <b>{t("voiceToneAnalyzer.pauseLabel")}</b> {result.pauseRatio}% |{" "}
              <b>{t("voiceToneAnalyzer.wordScoreLabel")}</b> {result.wordScore}
            </div>
            <div>
              <b>{t("voiceToneAnalyzer.reasonsLabel")}</b> {result.reasons.join(" | ")}
            </div>
            {result.saved && (
              <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>
                {t("voiceToneAnalyzer.encryptedSaved")}
              </div>
            )}
            <div
              style={{
                marginTop: 8,
                padding: 10,
                background: "white",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            >
              <b>{t("voiceToneAnalyzer.adviceLabel")}</b> {result.advice}
              {result.isCrisis && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 8,
                    background: "#fee2e2",
                    borderRadius: 6,
                    color: "#991b1b",
                    fontWeight: 700,
                  }}
                >
                  {" "}
                  {result.helpline}
                  {t("voiceToneAnalyzer.safetyFirstSuffix")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
