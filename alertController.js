import Alert from "../models/Alert.js";
import { encrypt, decrypt } from "../utils/crypto.js";

function decryptAlert(alertDoc) {
  const obj = alertDoc.toObject ? alertDoc.toObject() : alertDoc;
  return {
    ...obj,
    text: obj.text_encrypted ? decrypt(obj.text_encrypted) : "",
  };
}

/* =========================================
   Create a New Alert
   FIX: text is now encrypted before saving. Previously this saved
   req.body.text as plain text into Alert.text - which broke the "all saved
   text must be encrypted till RED/ORANGE" rule for the official SOS-alert
   flow (analyze.js/gemini.js's automatic alerts WERE already being
   encrypted, just this manually-triggered path wasn't).
========================================= */
export const createAlert = async (req, res) => {
  try {
    const { text, emotion, riskLevel, score, phone, category, abuseType, abuseSource, reasons } = req.body;

    const alert = await Alert.create({
      userId: req.user.id,
      text_encrypted: encrypt(text || ""),
      emotion,
      riskLevel,
      score,
      phone,
      category: category || "general",
      abuseType: abuseType || "none",
      abuseSource: abuseSource || "none",
      triggers: reasons || [],
    });

    const populatedAlert = await Alert.findById(alert._id)
      .populate("userId", "name email age emergencyName emergencyPhone");

    res.status(201).json({
      success: true,
      message: "Alert created successfully",
      alert: decryptAlert(populatedAlert)
    });

  } catch (err) {
    console.error("Create Alert Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create alert"
    });
  }
};

/* =========================================
   Get Latest Active Alert
========================================= */
export const getRedAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({
      userId: req.user.id,
      status: "ACTIVE"
    })
    .populate("userId", "name email age emergencyName emergencyPhone")
    .sort({ createdAt: -1 });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "No active alert found"
      });
    }

    res.json({
      success: true,
      alert: decryptAlert(alert)
    });

  } catch (err) {
    console.error("Get Alert Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alert"
    });
  }
};

/* =========================================
   Call SOS
========================================= */
export const callSOS = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate("userId", "name email age emergencyName emergencyPhone");

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found"
      });
    }

    alert.status = "CALL_INITIATED";
    alert.calledAt = new Date();
    await alert.save();

    res.json({
      success: true,
      message: "SOS Call Initiated",
      alert: decryptAlert(alert)
    });

  } catch (err) {
    console.error("SOS Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to initiate SOS"
    });
  }
};

/* =========================================
   Clear Alert
========================================= */
export const clearAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate("userId", "name email");

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found"
      });
    }

    alert.status = "CLEARED";
    alert.clearedAt = new Date();
    await alert.save();

    res.json({
      success: true,
      message: "Alert cleared successfully",
      alert: decryptAlert(alert)
    });

  } catch (err) {
    console.error("Clear Alert Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to clear alert"
    });
  }
};

/* =========================================
   Get Alert History
========================================= */
export const getAlertHistory = async (req, res) => {
  try {
    const alerts = await Alert.find({
      userId: req.user.id
    })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: alerts.length,
      alerts: alerts.map(decryptAlert)
    });

  } catch (err) {
    console.error("History Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch history"
    });
  }
};
