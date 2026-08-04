// backend/utils/istDate.js
//
// FIX: "today" was being computed as new Date().toISOString().slice(0,10)
// in 9 different files across the backend - that's UTC, not IST. Since
// India is UTC+5:30, there's a ~5.5 hour window every night (midnight to
// 5:30 AM IST) where the UTC calendar date is still "yesterday" even
// though the person's own calendar has already moved to a new day. This
// affected: today's 3 challenges, streak calculations, push notification
// "already checked in today" logic, weekly digest scheduling, scheduled
// letter delivery dates, insights day-bucketing, personality quiz
// once-per-day gating, habit "yesterday" lookback, and chatbot XP gating.
//
// This is the single shared source of truth for "what day is it, in IST"
// - every file that needs a calendar date should use these instead of
// rolling its own UTC-based one.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Today's date, as a "YYYY-MM-DD" string, in IST calendar terms.
export function todayIST() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// Converts any Date (or timestamp string) to its IST calendar date string -
// use this instead of new Date(x).toISOString().slice(0,10) when comparing
// a stored timestamp against todayIST().
export function toISTDateStr(date) {
  return new Date(new Date(date).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// Start/end of a given IST calendar date, as real UTC Date objects - use
// this instead of `${date}T00:00:00.000Z` (which is midnight UTC, not
// midnight IST) when querying "all records created on this IST day".
export function istDayBounds(dateStr) {
  return {
    start: new Date(`${dateStr}T00:00:00.000+05:30`),
    end: new Date(`${dateStr}T23:59:59.999+05:30`),
  };
}
