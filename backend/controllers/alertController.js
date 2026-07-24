import Alert from "../models/Alert.js";

/* =========================================
   Create a New Alert
========================================= */

export const createAlert = async (req, res) => {
  try {
    const {
      text,
      emotion,
      riskLevel,
      score,
      phone
    } = req.body;

    const alert = await Alert.create({
      user: req.user.id,
      text,
      emotion,
      riskLevel,
      score,
      phone
    });

    res.status(201).json({
      success: true,
      message: "Alert created successfully",
      alert
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
      user: req.user.id,
      status: "ACTIVE"
    }).sort({ createdAt: -1 });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "No active alert found"
      });
    }

    res.json({
      success: true,
      alert
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

    const alert = await Alert.findById(req.params.id);

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
      alert
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

    const alert = await Alert.findById(req.params.id);

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
      alert
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
      user: req.user.id
    }).sort({
      createdAt: -1
    });

    res.json({
      success: true,
      count: alerts.length,
      alerts
    });

  } catch (err) {

    console.error("History Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch history"
    });

  }

};