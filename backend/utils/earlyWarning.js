// backend/utils/earlyWarning.js
//
// Looks at a person's own recent entries for a WORSENING TREND (not a
// single bad day) and surfaces a gentle, supportive nudge inside their own
// dashboard - never an automated notification to an emergency contact or
// admin. That would be a significant escalation of the alerting model
// (repeated false positives paging a family member is its own harm) and
// wasn't something explicitly asked for - if you want that, it's a real
// design decision worth discussing on its own, not something to bolt on
// silently here.
//
// This only ever ADDS a supportive nudge on top of - never replaces or
// delays - the existing real-time RED/ORANGE handling, which already
// surfaces the helpline immediately on the message itself.

export function detectEarlyWarning(recentEntries) {
  // recentEntries: array of { riskLevel, score, createdAt }, most recent first,
  // covering roughly the last 14 days.
  if (!recentEntries || recentEntries.length < 3) return null;

  const last7 = recentEntries.filter((e) => isWithinDays(e.createdAt, 7));
  const prev7 = recentEntries.filter((e) => isWithinDays(e.createdAt, 14) && !isWithinDays(e.createdAt, 7));

  const concerningCount = (arr) => arr.filter((e) => e.riskLevel === "ORANGE" || e.riskLevel === "RED").length;

  const recentConcerning = concerningCount(last7);
  const priorConcerning = concerningCount(prev7);

  // Trigger: at least 3 concerning entries in the last 7 days, AND that's
  // a real increase vs the week before (not just "still bad but stable" -
  // stable-bad already gets the full RED/ORANGE treatment every time on
  // its own, this is specifically about an escalating pattern).
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
