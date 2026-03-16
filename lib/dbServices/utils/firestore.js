/**
 * Firestore Client Utilities
 * Helper functions for common Firestore operations
 */

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param {Object} timestamp - Firestore Timestamp object
 * @returns {Date|null} JavaScript Date object or null
 */
export function timestampToDate(timestamp) {
  if (!timestamp || !timestamp.toDate) {
    return null;
  }
  return timestamp.toDate();
}

/**
 * Serialize Firestore document data for JSON responses
 * Converts Timestamps to ISO strings and handles undefined values
 * @param {Object} data - Firestore document data
 * @returns {Object} Serialized data
 */
export function serializeDocumentData(data) {
  if (!data) return null;

  const serialized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue; // Skip undefined values
    }
    
    if (value && typeof value.toDate === 'function') {
      // Convert Firestore Timestamp to ISO string
      serialized[key] = value.toDate().toISOString();
    } else if (Array.isArray(value)) {
      // Recursively serialize arrays
      serialized[key] = value.map(item => 
        typeof item === 'object' ? serializeDocumentData(item) : item
      );
    } else if (value && typeof value === 'object') {
      // Recursively serialize nested objects
      serialized[key] = serializeDocumentData(value);
    } else {
      serialized[key] = value;
    }
  }
  
  return serialized;
}

/**
 * Batch write helper for multiple operations
 * @param {Object} db - Firestore instance
 * @param {Array} operations - Array of operation objects
 * @returns {Promise<void>}
 */
export async function batchWrite(db, operations) {
  const batch = db.batch();
  
  for (const op of operations) {
    const ref = db.collection(op.collection).doc(op.id);
    
    switch (op.type) {
      case 'set':
        batch.set(ref, op.data, op.options || {});
        break;
      case 'update':
        batch.update(ref, op.data);
        break;
      case 'delete':
        batch.delete(ref);
        break;
      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  }
  
  await batch.commit();
  console.log(`[batchWrite] Committed ${operations.length} operations`);
}

/**
 * Check if a document exists
 * @param {Object} db - Firestore instance
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<boolean>} True if document exists
 */
export async function documentExists(db, collection, docId) {
  try {
    const docRef = db.collection(collection).doc(docId);
    const doc = await docRef.get();
    return doc.exists;
  } catch (error) {
    console.error('[documentExists] Error checking document existence:', { collection, docId, error: error.message });
    return false;
  }
}
