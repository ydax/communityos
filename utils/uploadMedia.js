/**
 * Media Upload Utility (Client-Side)
 *
 * Handles direct uploads to Firebase Cloud Storage from the browser.
 * This follows the Upload Rule: NEVER pass File/Blob objects to Server Actions
 * or API Routes. Upload directly to Storage, get the downloadURL, then pass
 * only that URL string to the server.
 *
 * Supports:
 *  - Images (JPEG, PNG, GIF, WebP)
 *  - Future: Video and audio for AI Magic Box
 *
 * @module utils/uploadMedia
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';

// ───────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const AUDIO_TYPES = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav'];
const ALL_MEDIA_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES, ...AUDIO_TYPES];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50 MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;  // 10 MB

// ───────────────────────────────────────────────
// Validation Helpers
// ───────────────────────────────────────────────

/**
 * Determine the media category from a MIME type.
 * @param {string} mimeType
 * @returns {'image'|'video'|'audio'|null}
 */
function getMediaCategory(mimeType) {
  if (IMAGE_TYPES.includes(mimeType)) return 'image';
  if (VIDEO_TYPES.includes(mimeType)) return 'video';
  if (AUDIO_TYPES.includes(mimeType)) return 'audio';
  return null;
}

/**
 * Validate a file before upload.
 * @param {File} file
 * @throws {Error} If the file fails validation
 */
function validateFile(file) {
  if (!file) {
    throw new Error('No file provided');
  }

  const category = getMediaCategory(file.type);
  if (!category) {
    throw new Error(
      `Unsupported file type: ${file.type}. Accepted: images (JPEG, PNG, GIF, WebP), videos (MP4, WebM, MOV), audio (WebM, MP4, MP3, WAV).`
    );
  }

  // Size limits by category
  const limits = { image: MAX_IMAGE_SIZE, video: MAX_VIDEO_SIZE, audio: MAX_AUDIO_SIZE };
  const maxSize = limits[category];
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    throw new Error(`${category} file size exceeds ${maxMB}MB limit (got ${Math.round(file.size / (1024 * 1024))}MB)`);
  }
}

// ───────────────────────────────────────────────
// Upload Functions
// ───────────────────────────────────────────────

/**
 * Upload a single media file to Firebase Cloud Storage with progress tracking.
 *
 * WHY this exists instead of using the API route:
 *   Vercel has a 4.5MB request body limit. Uploading directly to Firebase
 *   Storage from the browser bypasses this limit entirely.
 *
 * @param {File} file              - The file to upload
 * @param {string} storagePath     - Full path in Storage (e.g. 'listings/tenant_abc/1234_hero.jpg')
 * @param {Function} [onProgress]  - Optional progress callback (0-100)
 * @returns {Promise<string>}      - The public download URL
 */
export async function uploadMedia(file, storagePath, onProgress) {
  validateFile(file);

  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('[uploadMedia] Upload failed:', error);
        reject(new Error(`Upload failed: ${error.message}`));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('[uploadMedia] ✅ Upload complete:', storagePath);
          resolve(downloadURL);
        } catch (error) {
          reject(new Error(`Failed to get download URL: ${error.message}`));
        }
      }
    );
  });
}

/**
 * Upload multiple media files in parallel.
 *
 * @param {File[]} files           - Array of files to upload
 * @param {string} basePath        - Base storage path (e.g. 'listings/tenant_abc')
 * @param {Function} [onProgress]  - Aggregate progress callback (0-100)
 * @returns {Promise<string[]>}    - Array of download URLs
 */
export async function uploadMultipleMedia(files, basePath, onProgress) {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }
  if (files.length > 5) {
    throw new Error('Maximum 5 files per upload batch');
  }

  const fileProgress = new Array(files.length).fill(0);

  const promises = Array.from(files).map((file, index) => {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${basePath}/${timestamp}_${index}_${sanitizedName}`;

    return uploadMedia(file, path, (progress) => {
      fileProgress[index] = progress;
      if (onProgress) {
        const aggregate = Math.round(
          fileProgress.reduce((sum, p) => sum + p, 0) / files.length
        );
        onProgress(aggregate);
      }
    });
  });

  const urls = await Promise.all(promises);
  console.log(`[uploadMultipleMedia] ✅ ${urls.length} files uploaded`);
  return urls;
}

/**
 * Generate a structured storage path for listing media.
 *
 * @param {string} tenantId   - Tenant identifier
 * @param {string} filename   - Original file name
 * @param {'listing'|'variant'|'staging'} context - Upload context
 * @returns {string} Storage path
 */
export function buildMediaPath(tenantId, filename, context = 'listing') {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${context}s/${tenantId}/${timestamp}_${sanitized}`;
}

// ───────────────────────────────────────────────
// Exports for convenience
// ───────────────────────────────────────────────

export { IMAGE_TYPES, VIDEO_TYPES, AUDIO_TYPES, ALL_MEDIA_TYPES, getMediaCategory };
