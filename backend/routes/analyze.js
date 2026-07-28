import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  const { text } = req.body;
  if(!text) return res.status(400).json({risk:"GREEN", score:10});

  const prompt = `
You are Emovra classifier. Classify into GREEN, ORANGE, RED.
RULES:
1. NEGATION: "i dont want to die", "mujhe nahi marna hai" = GREEN
2. HINGLISH: beizzati, tension, marna, jeena nahi, dar lag raha
3. ORANGE = stress, shame, anxiety, teacher scolding, embarrassment, failure
Return ONLY valid JSON like {"risk":"GREEN","score":10,"reason":"...","triggers":[]}
Text: "${text}"
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let txt = result.response.text().replace(/```json|```/g, '').trim();
    const json = JSON.parse(txt);
    res.json(json);
  } catch (e) {
    console.error("Gemini analyze error:", e.message);
    res.json({ risk: "GREEN", score: 20, reason: "AI fallback", triggers: [] });
  }
});

export default router;