import express from "express";
import { protect as auth } from "../middleware/auth.js";
import { imageGenLimiter } from "../utils/rateLimiters.js";
import { InferenceClient } from "@huggingface/inference";

const router = express.Router();

const HF_MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_PROVIDER = "fal-ai";

router.post("/generate", auth, imageGenLimiter, async (req, res) => {
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

      const client = new InferenceClient(process.env.HF_API_KEY);

      let dataUri;
          try {
                  dataUri = await client.textToImage(
                    {
                                model: HF_MODEL,
                                provider: HF_PROVIDER,
                                inputs: `A background image, no text or words in the image: ${prompt.trim()}`,
                    },
                    { outputType: "dataUrl" }
                          );
          } catch (hfErr) {
                  const msg = hfErr?.message || "";
                  console.error("Background generation - HF error:", msg);
                  if (/loading|warm/i.test(msg)) {
                            return res.status(503).json({ success: false, message: "The image model is warming up - try again in about 20 seconds." });
                  }
                  if (/rate|429|quota/i.test(msg)) {
                            return res.status(429).json({ success: false, message: "Too many image requests right now - try again in a bit." });
                  }
                  return res.status(502).json({ success: false, message: "Couldn't generate that - try describing it differently." });
          }

      res.json({ success: true, image: dataUri });
    } catch (err) {
          console.error("Background generation error:", err.message);
          res.status(500).json({ success: false, message: "Something went wrong generating that image." });
    }
});

export default router;
