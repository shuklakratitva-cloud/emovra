import mongoose from "mongoose";

// A gentle check-back a day after a student disclosed something at RED
// level.
//
// Why this exists: before it, the crisis path ended the moment the alert
// fired. A student wrote something serious, saw a risk card with helplines,
// an admin got notified - and then nothing, ever, from the app's side. The
// one question that actually matters for a wellbeing tool ("is this person
// okay now?") was the one it never asked.
//
// Deliberately stores NOTHING about what was written. Only that a follow-up
// is owed, when it came due, and the one word the student chose in reply.
// The card the student sees never quotes or references their disclosure -
// being reminded of your worst moment by a machine that logged it is its
// own harm, and re-showing the text would also mean decrypting it to render
// a check-in, which the rest of the app is careful never to do.
const followUpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // The entry that triggered this, kept only as a back-reference for
    // debugging and for account deletion to reason about. Never rendered.
    entryId: { type: mongoose.Schema.Types.ObjectId, ref: "Entry", default: null },

    // When the check-in becomes visible to the student. ~24h after the
    // disclosure, so it lands the next day rather than the same evening.
    dueAt: { type: Date, required: true, index: true },

    status: {
      type: String,
      enum: ["pending", "answered", "dismissed", "expired"],
      default: "pending",
      index: true,
    },

    // The student's own word for how they are now. Three options only -
    // a free-text box here would be a second disclosure surface with none
    // of the risk analysis the check-in flow has, and would quietly
    // collect crisis text through a path that doesn't alert anyone.
    response: {
      type: String,
      enum: ["better", "same", "worse", null],
      default: null,
    },
    respondedAt: { type: Date, default: null },

    // Set once a push notification has gone out, so the cron never
    // notifies the same follow-up twice.
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Same 30-day retention as Entry - a follow-up must not outlive the record
// it came from.
followUpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
followUpSchema.index({ userId: 1, status: 1, dueAt: -1 });

export default mongoose.model("FollowUp", followUpSchema);
