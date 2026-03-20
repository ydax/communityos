/**
 * Voice Memo Component — Record audio for AI parsing
 *
 * Uses the browser MediaRecorder API to record an audio stream from the
 * user's microphone, then returns the blob for upload and AI processing.
 *
 * @module components/listings/VoiceMemo
 */

'use client';

import { useState, useRef, useEffect } from 'react';

const STATES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PROCESSING: 'processing',
};

/**
 * @param {Object} props
 * @param {Function} props.onRecordComplete - Called with the recorded audio Blob
 * @param {boolean} [props.disabled] - Disable the record button
 */
export default function VoiceMemo({ onRecordComplete, disabled = false }) {
  const [state, setState] = useState(STATES.IDLE);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        setState(STATES.PROCESSING);
        
        // Brief delay to allow UI to show processing state before upload starts
        setTimeout(() => {
          onRecordComplete(audioBlob);
          setState(STATES.IDLE);
          setRecordingTime(0);
        }, 500);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start();
      setState(STATES.RECORDING);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('[VoiceMemo] Error accessing microphone:', err);
      alert('Could not access microphone. Please ensure permissions are granted.');
      setState(STATES.IDLE);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === STATES.RECORDING) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {state === STATES.IDLE && (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-full transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-violet-300 hover:shadow-md'
          }`}
        >
          <span className="text-violet-500 text-lg">🎙️</span>
          <span className="text-sm font-medium text-gray-700">Dictate Voice Memo</span>
        </button>
      )}

      {state === STATES.RECORDING && (
        <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-200 rounded-full shadow-sm animate-pulse-soft">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-600 w-12 text-center">
              {formatTime(recordingTime)}
            </span>
          </div>
          <div className="w-px h-4 bg-red-200" />
          <button
            type="button"
            onClick={stopRecording}
            className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors uppercase tracking-wider px-1"
          >
            Stop
          </button>
        </div>
      )}

      {state === STATES.PROCESSING && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full shadow-sm">
          <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-600">Processing audio...</span>
        </div>
      )}
    </div>
  );
}
