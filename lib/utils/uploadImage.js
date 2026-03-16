import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Upload an image to Firebase Cloud Storage
 *
 * @param {File} file - Image file to upload
 * @param {string} path - Storage path (e.g., 'sites/abc123/hero.jpg')
 * @returns {Promise<string>} - Public download URL
 */
export async function uploadImage(file, path) {
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file type
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!validTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)",
    );
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error("File size exceeds 5MB limit");
  }

  try {
    const storage = getStorage();
    const storageRef = ref(storage, path);

    // Upload file
    console.log("[uploadImage] Uploading file to:", path);
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log("[uploadImage] Upload successful, URL:", downloadURL);

    return downloadURL;
  } catch (error) {
    console.error("[uploadImage] Upload failed:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Upload multiple images to Firebase Cloud Storage
 *
 * @param {FileList|Array<File>} files - Array of image files
 * @param {string} basePath - Base storage path (e.g., 'sites/abc123')
 * @returns {Promise<Array<string>>} - Array of public download URLs
 */
export async function uploadMultipleImages(files, basePath) {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }

  try {
    const uploadPromises = Array.from(files).map((file, index) => {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${index}_${file.name}`;
      const path = `${basePath}/${filename}`;

      return uploadImage(file, path);
    });

    const urls = await Promise.all(uploadPromises);
    console.log(
      `[uploadMultipleImages] Uploaded ${urls.length} images successfully`,
    );

    return urls;
  } catch (error) {
    console.error("[uploadMultipleImages] Batch upload failed:", error);
    throw error;
  }
}

/**
 * Generate a storage path for an image
 *
 * @param {string} context - Context for the image ('site', 'listing', 'variant')
 * @param {string} id - Entity ID
 * @param {string} filename - Original filename
 * @returns {string} - Storage path
 */
export function generateImagePath(context, id, filename) {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");

  switch (context) {
    case "site":
      return `sites/${id}/${timestamp}_${sanitizedFilename}`;
    case "listing":
      return `listings/${id}/${timestamp}_${sanitizedFilename}`;
    case "variant":
      return `variants/${id}/${timestamp}_${sanitizedFilename}`;
    default:
      return `uploads/${timestamp}_${sanitizedFilename}`;
  }
}

/**
 * Convert gs:// URL to public HTTP URL
 *
 * @param {string} gsUrl - Firebase Storage gs:// URL
 * @returns {Promise<string>} - Public download URL
 */
export async function convertGsUrlToHttp(gsUrl) {
  if (!gsUrl || !gsUrl.startsWith("gs://")) {
    return gsUrl; // Already an HTTP URL or invalid
  }

  try {
    const storage = getStorage();
    // Extract path from gs:// URL
    const path = gsUrl.replace(/^gs:\/\/[^/]+\//, "");
    const storageRef = ref(storage, path);

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("[convertGsUrlToHttp] Conversion failed:", error);
    return gsUrl; // Return original if conversion fails
  }
}

/**
 * React hook for image upload with progress tracking
 * Usage in components:
 *
 * import { useImageUpload } from '@/lib/utils/uploadImage';
 *
 * const { uploadImage, isUploading, progress, error } = useImageUpload();
 *
 * const handleUpload = async (file) => {
 *   const url = await uploadImage(file, 'sites/abc123/hero.jpg');
 *   console.log('Uploaded:', url);
 * };
 */
import { useState } from "react";

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const upload = async (file, path) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress (Firebase doesn't provide upload progress easily)
      setProgress(30);

      const url = await uploadImage(file, path);

      setProgress(100);
      return url;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage: upload,
    isUploading,
    progress,
    error,
  };
}
