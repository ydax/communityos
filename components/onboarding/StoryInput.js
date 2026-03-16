"use client";

import { useState, useEffect, useRef } from "react";

/**
 * StoryInput Component
 *
 * Captures business story via:
 * 1. Text area (default/fallback)
 * 2. Speech-to-text via Web Speech API (progressive enhancement)
 * 3. URL paste for social media scraping (future)
 *
 * @param {Object} props
 * @param {string} props.value - Current text value
 * @param {Function} props.onChange - Called with new text value
 * @param {boolean} [props.disabled] - Disable input
 */
export default function StoryInput({ value, onChange, disabled = false }) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [inputMode, setInputMode] = useState("text"); // 'text' | 'url'
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = value || "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += " " + transcript;
          onChange(finalTranscript.trim());
        } else {
          interim += transcript;
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn("[StoryInput] Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setInputMode("text")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            inputMode === "text"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          disabled={disabled}
        >
          ✍️ Type or Speak
        </button>
        <button
          type="button"
          onClick={() => setInputMode("url")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            inputMode === "url"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          disabled={disabled}
        >
          🔗 Paste a Link
        </button>
      </div>

      {inputMode === "text" ? (
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Tell us about your business... What do you do? What makes you special? What area do you serve?"
            className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-base"
            rows={5}
            disabled={disabled || isListening}
            maxLength={5000}
          />

          {/* Mic button */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={disabled}
              className={`absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isListening
                  ? "bg-red-500 text-white animate-pulse scale-110"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
              }`}
              title={isListening ? "Stop recording" : "Tap to speak"}
            >
              {isListening ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>
          )}

          {/* Character count */}
          <div className="text-right mt-1 text-xs text-gray-400">
            {value?.length || 0} / 5,000
          </div>

          {isListening && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Listening... Tap the mic to stop.
            </div>
          )}
        </div>
      ) : (
        <div>
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste your Facebook, Instagram, or Google Business link..."
            className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
            disabled={disabled}
          />
          <p className="text-sm text-gray-400 mt-2">
            We&apos;ll pull your business info and photos from your profile.
          </p>
        </div>
      )}
    </div>
  );
}
