// src/hooks/useSpeechRecognition.js

import { useState, useRef, useEffect } from "react";

export default function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  function startListening(lang = "en-IN") {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setError("Speech Recognition is not supported in this browser.");
      return;
    }

    // Abort previous instance if any
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setError("");
    };
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };
    recognition.onerror = (event) => {
      setError(event.error || "Recognition error");
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  }

  function resetTranscript() {
    setTranscript("");
  }

  return {
    transcript,
    listening,
    supported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}