import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are Emovra, a kind mental wellness companion. Breathe. Balance. Become. User says: ${message}. Respond empathetically, short, supportive. If user is in crisis, encourage help.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ reply: text });
  } catch (e) {
    console.error("GEMINI ERROR:", e.message);
    res.status(500).json({ error: e.message, reply: "I'm having trouble connecting right now, but I'm here for you. Try again?" });
  }
});

export default router;