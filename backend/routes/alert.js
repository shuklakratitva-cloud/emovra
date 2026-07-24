const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");
const auth = require("../middleware/auth"); // your existing auth middleware

// POST /api/alerts/red - called automatically when RED detected
router.post("/red", auth, async (req,res)=>{
  try{
    const { text, score, reasons, riskLevel } = req.body;
    const user = req.user; // from your auth middleware
    const alert = await Alert.create({
      userId: user._id || user.id,
      name: user.name,
      age: user.age,
      emergencyPhone: user.emergencyPhone,
      text, score, reasons, riskLevel: riskLevel||"RED",
      ip: req.ip
    });
    console.log("🚨 RED ALERT SAVED:", alert.name, alert.text.slice(0,50));
    res.json({ ok:true, id: alert._id });
  }catch(e){ res.status(500).json({msg:e.message}) }
});

// GET /api/alerts/all - for admin to see
router.get("/all", auth, async (req,res)=>{
  const alerts = await Alert.find({cleared:false}).sort({timestamp:-1}).limit(100);
  res.json(alerts);
});

// DELETE /api/alerts/clear - clear all after you check
router.delete("/clear", auth, async (req,res)=>{
  await Alert.updateMany({cleared:false}, {cleared:true});
  res.json({ok:true, msg:"All cleared"});
});

router.delete("/:id", auth, async (req,res)=>{
  await Alert.findByIdAndUpdate(req.params.id, {cleared:true});
  res.json({ok:true});
});

module.exports = router;