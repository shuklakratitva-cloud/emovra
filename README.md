# Emovra / MindGuard - AI Mental Health Check

> A privacy-first, client-side mental wellness companion that analyzes mood, tracks emotional patterns, and provides grounding support. **Not a medical diagnosis — for wellness and self-reflection only.**

🔗 **Live Demo:** https://emovra.netlify.app
📂 **Stack:** React + Vite, LocalStorage, Web Speech API

![Status](https://img.shields.io/badge/status-live-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

### ✨ Features

- **Instant Mood Analysis** - NLP-based risk detection (GREEN/YELLOW/ORANGE/RED) with score & signals
- **Personalized Advice** - Context-aware coping suggestions based on emotion + sentiment
- **Persistent Mood History** - Chart keeps last 20 entries even after refresh (localStorage)
- **Voice Input** - 🎙 Speak in English/Hindi (en-IN) with auto-transcription
- **Grounding Toolkit** - 5-4-3-2-1 exercise, Box Breathing, Journal & Mood Tracker
- **Crisis Support** - Tele-MANAS (14416), Kiran, AASRA helplines always visible
- **Resilient UX** - ErrorBoundary prevents white-screen crashes, Theme Toggle, Mobile responsive

### 🧠 How it Works

1. User types / speaks: `I am feeling anxious today`
2. `calculateRisk(text)` analyzes keywords, sentiment, emotion
3. Returns `{ riskLevel, emotion, sentiment, score, reasons }`
4. Advice generator + RiskCard + MoodChart update instantly
5. History saved to `localStorage` for chart persistence

All processing is **100% client-side** - no data leaves the browser.

### 🛠️ Tech Stack

- **Frontend:** React 18, Vite, CSS Variables (theming)
- **State:** useState, useEffect, Custom Hooks
- **APIs:** Web Speech API, LocalStorage API
- **Deployment:** Netlify (auto-deploy from `main`)

### 📁 Project Structure
```
src/
├── components/
│   ├── ErrorBoundary.jsx   # Prevents white-screen
│   ├── RiskCard.jsx
│   ├── MoodChart.jsx       # Persistent history
│   ├── MoodTracker.jsx
│   ├── Journal.jsx
│   ├── GroundingExercises.jsx
│   ├── TeleManas.jsx
│   ├── ThemeToggle.jsx
│   └── Footer.jsx          # Safety disclaimer
├── utils/
│   ├── risk.js             # Core NLP logic
│   └── storage.js
├── hooks/
│   └── useSpeechRecognition.js
├── App.jsx
└── App.css
```

### 🚀 Run Locally

```bash
git clone https://github.com/shuklakratitva-cloud/emovra.git
cd emovra
npm install
npm run dev
```

### 🔒 Safety & Ethics

This app does **not** provide medical diagnosis, therapy, or crisis intervention. If you feel unsafe:
**Tele-MANAS: 14416 | Kiran: 1800-599-0019 | AASRA: 1800-233-3330**
Please reach out to a trusted person or mental health professional.

### 📸 Demo Flow for Reviewers

1. Type `I am happy today` -> GREEN + positive advice
2. Type `I feel overwhelmed and lonely` -> YELLOW + breathing exercise
3. Speak 🎙 -> auto-fill -> Analyze
4. Refresh page -> chart still shows history
5. Check Journal & Grounding sections below

### 👩‍💻 Author

Built by Kratitva Shukla - Focused on accessible mental wellness tech.

---
*Made with care for well-being. Contributions welcome!*
