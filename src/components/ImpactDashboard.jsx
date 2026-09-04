import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://emovra.onrender.com/api";

// Aggregate, anonymized usage numbers for the admin panel - no names,
// emails, or message content ever pass through here, just counts. Meant
// to answer "is this actually being used / helping" for funding pitches
// and competition reporting without exposing any individual student.
export default function ImpactDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API}/admin/impact-stats`, {
          headers: { Authorization: "Bearer " + token },
        });
        if (cancelled) return;
        if (res.data?.success) {
          setStats(res.data.stats);
          setNote(res.data.retentionNote || "");
        } else {
          setError("Could not load impact stats.");
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Could not load impact stats.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // This panel is a bonus on top of the alert queue below it - if it
  // fails to load, fail quietly rather than blocking the page admins
  // actually need (the RED/ORANGE alert list).
  if (error) return null;

  return (
    <div
      style={{
        background: "rgba(18,18,20,0.95)",
        border: "0.5px solid rgba(212,197,160,0.18)",
        borderRadius: 12,
        padding: 20,
        marginTop: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ color: "#d4c5a0", margin: 0, fontSize: 18 }}>📊 Impact Overview</h2>
        {note && <span style={{ fontSize: 11, color: "#666" }}>{note}</span>}
      </div>

      {loading ? (
        <p style={{ color: "#666", marginTop: 12, fontSize: 13 }}>Loading...</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
              marginTop: 16,
            }}
          >
            <StatTile label="Registered students" value={stats.totalUsers} />
            <StatTile label="Check-ins (30 days)" value={stats.checkIns30d} />
            <StatTile label="Check-ins (7 days)" value={stats.checkIns7d} />
            <StatTile label="Active students (30 days)" value={stats.activeUsers30d} />
            <StatTile label="Active students (7 days)" value={stats.activeUsers7d} />
            <StatTile label="RED alerts (30 days)" value={stats.redAlerts30d} accent="#ef4444" />
            <StatTile label="ORANGE alerts (30 days)" value={stats.orangeAlerts30d} accent="#fb923c" />
          </div>

          <DailyTrendChart data={stats.dailyTrend} />
        </>
      )}
    </div>
  );
}

function StatTile({ label, value, accent = "#d4c5a0" }) {
  return (
    <div
      style={{
        background: "#141416",
        border: "0.5px solid rgba(212,197,160,0.12)",
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums" }}>
        {value ?? 0}
      </div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function DailyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <p style={{ color: "#666", fontSize: 13, marginTop: 16 }}>
        No check-in activity in the last 30 days yet.
      </p>
    );
  }

  const width = Math.max(data.length * 24, 320);
  const height = 120;
  const padding = 20;
  const max = Math.max(...data.map((d) => d.count), 1);
  const barWidth = (width - padding * 2) / data.length - 4;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Daily check-ins, last 30 days</div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", minWidth: width, height, display: "block" }}>
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="rgba(255,255,255,0.12)"
          />
          {data.map((d, i) => {
            const barHeight = (d.count / max) * (height - padding * 2);
            const x = padding + i * ((width - padding * 2) / data.length) + 2;
            const y = height - padding - barHeight;
            return (
              <rect
                key={d.date}
                x={x}
                y={y}
                width={Math.max(barWidth, 2)}
                height={Math.max(barHeight, 1)}
                rx={2}
                fill="#d4c5a0"
              >
                <title>{`${d.date}: ${d.count} check-in${d.count === 1 ? "" : "s"}`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
