import express from "express";
const router = express.Router();

router.post("/analyze", (req, res) => {
  const text = (req.body.text || "").toLowerCase();
  let result = { color: "GREEN", score: 88, label: "POSITIVE", emotion: "happy", triggers: "happy", risk: "low" };
  if (text.includes("sad") || text.includes("stressed") || text.includes("anxious")) {
    result = { color: "YELLOW", score: 40, label: "STRESSED", emotion: "stressed", triggers: "stress", risk: "medium" };
  }
  if (text.includes("suicide") || text.includes("kill") || text.includes("die")) {
    result = { color: "RED", score: 10, label: "CRITICAL", emotion: "critical", triggers: "critical", risk: "high" };
  }
  if (text.includes("happy")) {
    result = { color: "GREEN", score: 90, label: "POSITIVE", emotion: "happy", triggers: "happy", risk: "low" };
  }
  res.json({ success: true, ...result, isAI: false });
});

export default router;