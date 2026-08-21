import express from "express";
import { protect as auth } from "../middleware/auth.js";

const router = express.Router();

const HF_MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_PROVIDER = "hf-inference";

router.post("/generate", auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: "Describe what you want first." });
    }
    if (prompt.length > 300) {
      return res.status(400).json({ success: false, message: "Keep the description under 300 characters." });
    }

    const blockedPatterns = /\b(nude|naked|nsfw|sex|porn|gore|gory|blood\w*|self.?harm|suicide|weapon|gun|knife|kill\w*)\b/i;
    if (blockedPatterns.test(prompt)) {
      return res.status(400).json({ success: false, message: "That description isn't something this can generate - try a different scene or vibe." });
    }
    if (!process.env.HF_API_KEY) {
      return res.status(503).json({ success: false, message: "Image generation isn't configured on the server yet." });
    }

    const response = await fetch(`https://router.huggingface.co/${HF_PROVIDER}/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: `A background image, no text or words in the image: ${prompt.trim()}` }),
    });

    const contentType = response.headers.get("content-type") || "";

    // HF models cold-start on the free tier - the first request after a
    // period of inactivity gets a JSON "still loading" response instead

    if (contentType.includes("application/json")) {
      const errJson = await response.json();
      if (errJson.error?.includes("loading")) {
        return res.status(503).json({ success: false, message: "The image model is warming up - try again in about 20 seconds." });
      }
      if (response.status === 429 || errJson.error?.includes("rate")) {
        return res.status(429).json({ success: false, message: "Too many image requests right now - try again in a bit." });
      }
      return res.status(502).json({ success: false, message: "Couldn't generate that - try describing it differently." });
    }

    if (!response.ok) {
      return res.status(502).json({ success: false, message: "Couldn't generate that - try describing it differently." });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const dataUri = `data:image/png;base64,${buffer.toString("base64")}`;
    res.json({ success: true, image: dataUri });
  } catch (err) {
    console.error("Background generation error:", err.message);
    res.status(500).json({ success: false, message: "Something went wrong generating that image." });
  }
});

export default router;
