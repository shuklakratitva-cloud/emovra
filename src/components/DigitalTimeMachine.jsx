import React, { useState, useEffect } from "react";

// Uses the SAME local mood history the Mood Tracker already writes to -
// no new storage, no AI, just a simple this-period-vs-last-period count
// comparison. Purely a heuristic tally, not a prediction of anything.
export default function DigitalTimeMachine() {
  const [thisMonth, setThisMonth] = useState({});
  const [lastMonth, setLastMonth] = useState({});
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem("mental_health_mood_history") || "[]");
      if (!history.length) return;
      setHasData(true);

      const now = new Date();
      const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthKey = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`;

      const thisCounts = {}, lastCounts = {};
      history.forEach((h) => {
        const d = new Date(h.timestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key === thisMonthKey) thisCounts[h.mood] = (thisCounts[h.mood] || 0) + 1;
        else if (key === lastMonthKey) lastCounts[h.mood] = (lastCounts[h.mood] || 0) + 1;
      });
      setThisMonth(thisCounts);
      setLastMonth(lastCounts);
    } catch {}
  }, []);

  const topMood = (counts) => {
    const entries = Object.entries(counts);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };

  if (!hasData) {
    return (
      <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
        <h2>⏳ Digital Time Machine</h2>
        <p style={{ fontSize: 12, opacity: 0.6 }}>Log a few moods in the Mood Tracker, then come back to see how things shift over time.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>⏳ Digital Time Machine</h2>
      <p style={{ fontSize: 12, opacity: 0.6 }}>This month vs. last month, based on your Mood Tracker entries (saved on this device).</p>
      <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 150, padding: 14, borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, opacity: 0.6 }}>Last month</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{topMood(lastMonth) || "No data"}</div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{Object.values(lastMonth).reduce((a, b) => a + b, 0)} mood entries</div>
        </div>
        <div style={{ flex: 1, minWidth: 150, padding: 14, borderRadius: 12, border: "1px solid var(--accent)" }}>
          <div style={{ fontSize: 11, opacity: 0.6 }}>This month</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: "var(--text-h)" }}>{topMood(thisMonth) || "No data"}</div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{Object.values(thisMonth).reduce((a, b) => a + b, 0)} mood entries</div>
        </div>
      </div>
    </div>
  );
}
