/**
 * Query Helpers - Utility functions for building Firestore queries
 * Provides reusable patterns for pagination, filtering, and data serialization
 */

/**
 * Build pagination query with limit and offset
 * @param {Object} query - Firestore query object
 * @param {Object} options - Pagination options
 * @param {number} options.limit - Maximum number of documents to return
 * @param {number} options.offset - Number of documents to skip
 * @param {Object} options.startAfter - Document snapshot to start after (cursor-based pagination)
 * @returns {Object} Modified query with pagination applied
 */
export function buildPaginationQuery(query, options = {}) {
  let paginatedQuery = query;

  // Cursor-based pagination (preferred for large datasets)
  if (options.startAfter) {
    paginatedQuery = paginatedQuery.startAfter(options.startAfter);
  }

  // Offset-based pagination (simpler but less efficient)
  if (options.offset && !options.startAfter) {
    paginatedQuery = paginatedQuery.offset(options.offset);
  }

  // Apply limit
  if (options.limit) {
    paginatedQuery = paginatedQuery.limit(options.limit);
  }

  return paginatedQuery;
}

/**
 * Build filter query dynamically based on provided filters
 * @param {Object} query - Firestore query object
 * @param {Object} filters - Key-value pairs of filters to apply
 * @param {Object} options - Filter options
 * @param {Array<string>} options.allowedFields - Whitelist of fields that can be filtered
 * @returns {Object} Modified query with filters applied
 */
export function buildFilterQuery(query, filters = {}, options = {}) {
  let filteredQuery = query;

  // If allowedFields is specified, only apply filters for those fields
  const allowedFields = options.allowedFields || Object.keys(filters);

  Object.entries(filters).forEach(([field, value]) => {
    // Skip if field is not in allowed list
    if (!allowedFields.includes(field)) {
      console.warn(`[buildFilterQuery] Field "${field}" is not in allowed fields list, skipping`);
      return;
    }

    // Skip null or undefined values
    if (value === null || value === undefined) {
      return;
    }

    // Handle array values (use "in" operator)
    if (Array.isArray(value)) {
      if (value.length > 0 && value.length <= 10) { // Firestore "in" limit is 10
        filteredQuery = filteredQuery.where(field, 'in', value);
      } else if (value.length > 10) {
        console.warn(`[buildFilterQuery] Array filter for "${field}" exceeds Firestore "in" limit of 10, using first 10 values`);
        filteredQuery = filteredQuery.where(field, 'in', value.slice(0, 10));
      }
      return;
    }

    // Handle range queries (objects with gt/gte/lt/lte)
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value.gt !== undefined) {
        filteredQuery = filteredQuery.where(field, '>', value.gt);
      }
      if (value.gte !== undefined) {
        filteredQuery = filteredQuery.where(field, '>=', value.gte);
      }
      if (value.lt !== undefined) {
        filteredQuery = filteredQuery.where(field, '<', value.lt);
      }
      if (value.lte !== undefined) {
        filteredQuery = filteredQuery.where(field, '<=', value.lte);
      }
      return;
    }

    // Standard equality filter
    filteredQuery = filteredQuery.where(field, '==', value);
  });

  return filteredQuery;
}

/**
 * Serialize Firestore document data for client consumption
 * Converts Firestore-specific types (Timestamps, GeoPoints) to plain JavaScript objects
 * @param {Object} doc - Firestore document snapshot
 * @returns {Object} Serialized document data
 */
export function serializeFirestoreData(doc) {
  if (!doc || !doc.exists) {
    return null;
  }

  const data = doc.data();
  const serialized = { id: doc.id };

  Object.entries(data).forEach(([key, value]) => {
    serialized[key] = serializeValue(value);
  });

  return serialized;
}

/**
 * Serialize a single value (recursive for nested objects/arrays)
 * @param {*} value - Value to serialize
 * @returns {*} Serialized value
 */
function serializeValue(value) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle Firestore Timestamp
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  // Handle Firestore GeoPoint
  if (value && value.latitude !== undefined && value.longitude !== undefined) {
    return {
      latitude: value.latitude,
      longitude: value.longitude
    };
  }

  // Handle arrays (recursively serialize each element)
  if (Array.isArray(value)) {
    return value.map(item => serializeValue(item));
  }

  // Handle nested objects (recursively serialize each property)
  if (typeof value === 'object') {
    const serializedObj = {};
    Object.entries(value).forEach(([key, val]) => {
      serializedObj[key] = serializeValue(val);
    });
    return serializedObj;
  }

  // Return primitive values as-is
  return value;
}

/**
 * Build ordering query with multiple order-by fields
 * @param {Object} query - Firestore query object
 * @param {Array<Object>} orderBy - Array of order-by configurations
 * @param {string} orderBy[].field - Field to order by
 * @param {string} orderBy[].direction - Sort direction ('asc' or 'desc')
 * @returns {Object} Modified query with ordering applied
 */
export function buildOrderQuery(query, orderBy = []) {
  let orderedQuery = query;

  if (!Array.isArray(orderBy)) {
    console.warn('[buildOrderQuery] orderBy must be an array');
    return orderedQuery;
  }

  orderBy.forEach(({ field, direction = 'asc' }) => {
    if (!field) {
      console.warn('[buildOrderQuery] Order-by field is missing, skipping');
      return;
    }

    const validDirection = direction === 'desc' ? 'desc' : 'asc';
    orderedQuery = orderedQuery.orderBy(field, validDirection);
  });

  return orderedQuery;
}

/**
 * Execute query and return serialized results with pagination metadata
 * @param {Object} query - Firestore query object
 * @param {Object} options - Query options
 * @param {boolean} options.serialize - Whether to serialize results (default: true)
 * @returns {Promise<Object>} Results with pagination metadata
 */
export async function executeQuery(query, options = {}) {
  try {
    const snapshot = await query.get();

    const documents = snapshot.docs.map(doc => {
      if (options.serialize !== false) {
        return serializeFirestoreData(doc);
      }
      return { id: doc.id, ...doc.data() };
    });

    return {
      documents,
      count: documents.length,
      lastDocument: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: documents.length === query._queryOptions?.limit
    };
  } catch (error) {
    console.error('[executeQuery] Error executing query:', error);
    throw new Error('Failed to execute query');
  }
}

/**
 * Build a text search query (client-side filtering for simple text matching)
 * Note: Firestore doesn't support full-text search natively
 * For production, consider using Algolia or ElasticSearch
 * @param {Array} documents - Array of documents to search
 * @param {string} searchText - Text to search for
 * @param {Array<string>} fields - Fields to search in
 * @returns {Array} Filtered documents
 */
export function clientSideTextSearch(documents, searchText, fields = []) {
  if (!searchText || searchText.trim() === '') {
    return documents;
  }

  const lowerSearchText = searchText.toLowerCase();

  return documents.filter(doc => {
    return fields.some(field => {
      const fieldValue = getNestedValue(doc, field);
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(lowerSearchText);
      }
      return false;
    });
  });
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot-notation path (e.g., 'user.profile.name')
 * @returns {*} Value at path or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Validate pagination options
 * @param {Object} options - Pagination options
 * @throws {Error} If options are invalid
 */
export function validatePaginationOptions(options = {}) {
  if (options.limit !== undefined) {
    if (typeof options.limit !== 'number' || options.limit <= 0) {
      throw new Error('Pagination limit must be a positive number');
    }
    if (options.limit > 1000) {
      throw new Error('Pagination limit cannot exceed 1000');
    }
  }

  if (options.offset !== undefined) {
    if (typeof options.offset !== 'number' || options.offset < 0) {
      throw new Error('Pagination offset must be a non-negative number');
    }
  }

  return true;
}
