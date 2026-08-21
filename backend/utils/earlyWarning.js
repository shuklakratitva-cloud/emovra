export function detectEarlyWarning(recentEntries) {

  if (!recentEntries || recentEntries.length < 3) return null;

  const last7 = recentEntries.filter((e) => isWithinDays(e.createdAt, 7));
  const prev7 = recentEntries.filter((e) => isWithinDays(e.createdAt, 14) && !isWithinDays(e.createdAt, 7));

  const concerningCount = (arr) => arr.filter((e) => e.riskLevel === "ORANGE" || e.riskLevel === "RED").length;

  const recentConcerning = concerningCount(last7);
  const priorConcerning = concerningCount(prev7);

  if (recentConcerning >= 3 && recentConcerning > priorConcerning) {
    return {
      triggered: true,
      recentConcerning,
      priorConcerning,
      message: "Things seem to have felt heavier than usual this week. That's worth paying attention to - you don't have to figure it out alone.",
    };
  }

  return null;
}

function isWithinDays(date, days) {
  const d = new Date(date);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return d.getTime() >= cutoff;
}
