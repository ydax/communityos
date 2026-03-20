/**
 * MediaDropzone Component
 *
 * Drag-and-drop + file picker for listing media uploads.
 * Uploads directly to Firebase Storage (bypasses Vercel payload limits),
 * then returns download URLs to the parent.
 *
 * This is the UI foundation for the Phase 3 "Magic Box" AI dropzone.
 *
 * @module components/listings/MediaDropzone
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { uploadMedia, buildMediaPath, IMAGE_TYPES } from '@/utils/uploadMedia';

/**
 * @param {Object}   props
 * @param {string}   props.tenantId    - Tenant ID for storage path
 * @param {string[]} props.urls        - Current array of uploaded URLs
 * @param {Function} props.onUrlsChange - Called with updated URL array
 * @param {number}   [props.maxFiles]   - Max number of files (default 5)
 * @param {boolean}  [props.disabled]   - Disable uploads
 */
export default function MediaDropzone({
  tenantId,
  urls = [],
  onUrlsChange,
  maxFiles = 5,
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;

      const remaining = maxFiles - urls.length;
      if (remaining <= 0) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remaining);
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      try {
        const newUrls = [];
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          const path = buildMediaPath(tenantId, file.name, 'listing');
          const url = await uploadMedia(file, path, (progress) => {
            const aggregate = Math.round(
              ((i * 100 + progress) / filesToUpload.length)
            );
            setUploadProgress(aggregate);
          });
          newUrls.push(url);
        }
        onUrlsChange([...urls, ...newUrls]);
      } catch (err) {
        console.error('[MediaDropzone] Upload failed:', err);
        setError(err.message);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [tenantId, urls, onUrlsChange, maxFiles]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeUrl = (index) => {
    onUrlsChange(urls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Preview Grid */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {urls.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeUrl(index)}
                disabled={disabled}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {urls.length < maxFiles && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_TYPES.join(',')}
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            disabled={disabled || uploading}
            className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : uploading
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'
            }`}
          >
            {uploading ? (
              <>
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500">
                  Uploading... {uploadProgress}%
                </span>
              </>
            ) : (
              <>
                <div className="text-3xl">📸</div>
                <span className="text-sm font-medium text-gray-600">
                  {urls.length === 0 ? 'Add photos' : 'Add more photos'}
                </span>
                <span className="text-xs text-gray-400">
                  Drag \u0026 drop or tap to browse • {urls.length}/{maxFiles} uploaded
                </span>
              </>
            )}
          </button>
        </>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
