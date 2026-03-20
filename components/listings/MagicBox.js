/**
 * MagicBox Component — AI-Powered Listing Auto-Fill
 *
 * The "Magic Fill" dropzone that sits prominently at the top of the
 * Add Listing page. Users drop a photo of their product or service,
 * and the AI analyzes it to pre-fill all form fields.
 *
 * The UX transforms listing creation from "data entry" into "data review" —
 * users just verify and correct what the AI extracted, then publish.
 *
 * Flow:
 *   1. User drops/selects a photo
 *   2. Photo uploads directly to Firebase Storage (Upload Rule)
 *   3. The download URL is passed to the parseMediaWithGemini Server Action
 *   4. AI returns structured JSON { type, title, description, basePrice, ... }
 *   5. MagicBox calls onParsed() with the data to hydrate the parent form
 *
 * @module components/listings/MagicBox
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { uploadMedia, buildMediaPath, IMAGE_TYPES } from '@/utils/uploadMedia';
import { parseMediaWithGemini } from '@/app/actions/ai-parser';

// ───────────────────────────────────────────────
// State machine for the Magic Box UX
// ───────────────────────────────────────────────
const STATES = {
  IDLE: 'idle',          // Waiting for user input
  UPLOADING: 'uploading', // File uploading to Firebase Storage
  ANALYZING: 'analyzing', // Gemini processing the image
  SUCCESS: 'success',    // AI returned results
  ERROR: 'error',        // Something went wrong
};

/**
 * @param {Object}   props
 * @param {string}   props.tenantId      - Tenant ID for storage paths
 * @param {Function} props.onParsed      - Called with AI-extracted listing data
 * @param {Function} props.onMediaUrl    - Called with the uploaded media URL
 * @param {boolean}  [props.disabled]    - Disable the component
 */
export default function MagicBox({ tenantId, onParsed, onMediaUrl, disabled = false }) {
  const [state, setState] = useState(STATES.IDLE);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(null);       // Local blob URL for preview
  const [parsedData, setParsedData] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Handle a selected/dropped file through the full pipeline:
   * upload → analyze → hydrate.
   */
  const handleFile = useCallback(async (file) => {
    if (!file) return;

    // Validate file type
    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Please upload an image (JPEG, PNG, GIF, or WebP).');
      setState(STATES.ERROR);
      return;
    }

    // Show local preview immediately
    setPreview(URL.createObjectURL(file));
    setError(null);
    setWarnings([]);

    // ── Step 1: Upload to Firebase Storage ──────────────
    setState(STATES.UPLOADING);
    setUploadProgress(0);

    let downloadUrl;
    try {
      const storagePath = buildMediaPath(tenantId, file.name, 'staging');
      downloadUrl = await uploadMedia(file, storagePath, (progress) => {
        setUploadProgress(progress);
      });

      // Notify parent of the uploaded URL
      if (onMediaUrl) onMediaUrl(downloadUrl);
    } catch (uploadError) {
      console.error('[MagicBox] Upload failed:', uploadError);
      setError('Failed to upload image. Please try again.');
      setState(STATES.ERROR);
      return;
    }

    // ── Step 2: Analyze with Gemini ──────────────────────
    setState(STATES.ANALYZING);

    try {
      const result = await parseMediaWithGemini(downloadUrl, file.type);

      if (result.success && result.data) {
        setParsedData(result.data);
        setWarnings(result.warnings || []);
        setState(STATES.SUCCESS);

        // Hydrate the parent form
        onParsed(result.data, downloadUrl);
      } else {
        setError(result.error || 'AI analysis failed');
        setState(STATES.ERROR);
      }
    } catch (parseError) {
      console.error('[MagicBox] AI parse failed:', parseError);
      setError('AI analysis failed. You can still fill in the form manually.');
      setState(STATES.ERROR);
    }
  }, [tenantId, onParsed, onMediaUrl]);

  // ── Event Handlers ─────────────────────────────────────

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setState(STATES.IDLE);
    setParsedData(null);
    setPreview(null);
    setWarnings([]);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Render ─────────────────────────────────────────────

  // Confidence color
  const confidenceColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.5) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="relative" id="magic-box">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        id="magic-box-file-input"
      />

      {/* ── IDLE STATE ──────────────────────────── */}
      {state === STATES.IDLE && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={disabled}
          className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all text-center group ${
            isDragging
              ? 'border-violet-500 bg-violet-50 scale-[1.01]'
              : 'border-violet-300 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/80 hover:border-violet-400 hover:shadow-md'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl shadow-lg shadow-violet-200 group-hover:scale-110 transition-transform">
              ✨
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">
                Magic Fill — Drop a photo
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                AI will analyze your image and auto-fill the listing details.
                You review and edit before publishing.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-violet-500 font-medium">
              <span className="px-2.5 py-1 bg-violet-100 rounded-full">📸 Photos</span>
              <span className="text-violet-300">•</span>
              <span className="text-violet-400">Powered by Gemini AI</span>
            </div>
          </div>
        </button>
      )}

      {/* ── UPLOADING STATE ─────────────────────── */}
      {state === STATES.UPLOADING && (
        <div className="p-6 rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50">
          <div className="flex items-center gap-4">
            {preview && (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                <img src={preview} alt="Uploading" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Uploading image...
              </p>
              <div className="w-full h-2 bg-violet-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{uploadProgress}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYZING STATE ─────────────────────── */}
      {state === STATES.ANALYZING && (
        <div className="p-6 rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50">
          <div className="flex items-center gap-4">
            {preview && (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                <img src={preview} alt="Analyzing" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-gray-700">
                  AI is analyzing your image...
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Extracting title, description, pricing, and product details
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS STATE ───────────────────────── */}
      {state === STATES.SUCCESS && parsedData && (
        <div className="p-5 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50/80 to-emerald-50/80">
          <div className="flex items-start gap-4">
            {preview && (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                <img src={preview} alt="Analyzed" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-lg">✅</span>
                  <h4 className="text-sm font-bold text-gray-800">Magic Fill Complete</h4>
                </div>
                <div className="flex items-center gap-2">
                  {parsedData.confidence !== undefined && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${confidenceColor(parsedData.confidence)}`}>
                      {Math.round(parsedData.confidence * 100)}% confident
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={reset}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Try another
                  </button>
                </div>
              </div>

              {/* Summary of extracted data */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span className="text-gray-400">Type:</span>{' '}
                  <span className="font-medium text-gray-700 capitalize">{parsedData.type}</span>
                </div>
                <div>
                  <span className="text-gray-400">Price:</span>{' '}
                  <span className="font-medium text-gray-700">
                    ${(parsedData.basePrice / 100).toFixed(2)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Title:</span>{' '}
                  <span className="font-medium text-gray-700">{parsedData.title}</span>
                </div>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  <span className="font-medium">⚠️ Notes: </span>
                  {warnings.join(' • ')}
                </div>
              )}

              <p className="mt-2 text-xs text-gray-400 italic">
                Review the pre-filled fields below and edit as needed before publishing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR STATE ─────────────────────────── */}
      {state === STATES.ERROR && (
        <div className="p-5 rounded-2xl border-2 border-red-200 bg-red-50/80">
          <div className="flex items-start gap-4">
            {preview && (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm opacity-60">
                <img src={preview} alt="Error" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-lg">❌</span>
                  <h4 className="text-sm font-bold text-red-700">Magic Fill Failed</h4>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium"
                >
                  Try again
                </button>
              </div>
              <p className="text-sm text-red-600">{error}</p>
              <p className="mt-1.5 text-xs text-gray-500">
                You can still fill in the listing details manually below.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
