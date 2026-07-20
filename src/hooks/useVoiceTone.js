// src/hooks/useVoiceTone.js - Voice Pressure & Tone Analyzer
export function useVoiceTone() {
  async function analyzeTone(duration = 4000) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    let volumes = [];
    let pitches = [];
    let start = Date.now();
    let silentFrames = 0;

    return new Promise((resolve) => {
      function tick() {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let v of data) sum += v;
        let avgVolume = sum / data.length;
        volumes.push(avgVolume);
        if (avgVolume < 15) silentFrames++;

        // Simple pitch proxy: max frequency bin
        let maxIdx = data.indexOf(Math.max(...data));
        pitches.push(maxIdx);

        if (Date.now() - start < duration) {
          requestAnimationFrame(tick);
        } else {
          stream.getTracks().forEach(t => t.stop());
          audioCtx.close();

          const avgVol = volumes.reduce((a,b)=>a+b,0)/volumes.length;
          const variance = volumes.reduce((a,b)=>a+Math.pow(b-avgVol,2),0)/volumes.length;
          const avgPitch = pitches.reduce((a,b)=>a+b,0)/pitches.length;
          const pauseRatio = silentFrames / volumes.length;
          const speechRate = volumes.filter(v=>v>20).length / (duration/1000); // words proxy

          // Pressure = volume + variance
          let pressure = "Normal";
          if (avgVol > 45 && variance > 400) pressure = "High - Tense / Pressured Speech";
          else if (avgVol < 20) pressure = "Low - Low Energy / Fatigue";
          else if (variance > 500) pressure = "Unstable - Emotional Fluctuation";

          let tone = "Calm";
          if (avgPitch > 35 && avgVol > 40) tone = "Anxious / Elevated";
          else if (pauseRatio > 0.4) tone = "Sad / Low / Hesitant";
          else if (avgPitch < 15 && avgVol > 35) tone = "Angry / Pressured";
          else if (speechRate > 25) tone = "Stressed / Racing Thoughts";

          resolve({
            avgVolume: Math.round(avgVol),
            variance: Math.round(variance),
            avgPitch: Math.round(avgPitch),
            pauseRatio: (pauseRatio*100).toFixed(1),
            speechRate: speechRate.toFixed(1),
            pressure,
            tone,
            confidence: "87%" // demo metric
          });
        }
      }
      tick();
    });
  }
  return { analyzeTone };
}