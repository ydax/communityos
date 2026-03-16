/**
 * Vitest Setup File
 * Configures global test environment and mocks for Firebase Admin SDK
 */

import { vi } from 'vitest';

// Mock Firebase Admin SDK
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  cert: vi.fn((credentials) => credentials)
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => createMockFirestore())
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => createMockAuth())
}));

// Mock Firestore instance
function createMockFirestore() {
  return {
    collection: vi.fn((collectionName) => createMockCollectionReference(collectionName)),
    doc: vi.fn((docPath) => createMockDocumentReference(docPath)),
    batch: vi.fn(() => createMockBatch()),
    runTransaction: vi.fn()
  };
}

// Mock Collection Reference
function createMockCollectionReference(name) {
  return {
    name,
    doc: vi.fn((docId) => createMockDocumentReference(`${name}/${docId}`)),
    where: vi.fn(() => createMockQuery()),
    orderBy: vi.fn(() => createMockQuery()),
    limit: vi.fn(() => createMockQuery()),
    offset: vi.fn(() => createMockQuery()),
    startAfter: vi.fn(() => createMockQuery()),
    add: vi.fn(async (data) => ({
      id: `mock_${Date.now()}`,
      get: vi.fn(async () => ({
        exists: true,
        id: `mock_${Date.now()}`,
        data: () => data
      }))
    })),
    get: vi.fn(async () => ({
      empty: false,
      docs: [],
      size: 0
    }))
  };
}

// Mock Document Reference
function createMockDocumentReference(path) {
  return {
    path,
    id: path.split('/').pop(),
    get: vi.fn(async () => ({
      exists: true,
      id: path.split('/').pop(),
      data: () => ({}),
      ref: createMockDocumentReference(path)
    })),
    set: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
    collection: vi.fn((collectionName) => createMockCollectionReference(collectionName))
  };
}

// Mock Query
function createMockQuery() {
  return {
    where: vi.fn(() => createMockQuery()),
    orderBy: vi.fn(() => createMockQuery()),
    limit: vi.fn(() => createMockQuery()),
    offset: vi.fn(() => createMockQuery()),
    startAfter: vi.fn(() => createMockQuery()),
    get: vi.fn(async () => ({
      empty: false,
      docs: [],
      size: 0
    }))
  };
}

// Mock Batch
function createMockBatch() {
  return {
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(async () => [])
  };
}

// Mock Auth
function createMockAuth() {
  return {
    createUser: vi.fn(async (userData) => ({
      uid: `mock_user_${Date.now()}`,
      ...userData
    })),
    getUser: vi.fn(async (uid) => ({
      uid,
      email: 'test@example.com'
    })),
    verifyIdToken: vi.fn(async (token) => ({
      uid: 'mock_user_123',
      email: 'test@example.com'
    }))
  };
}

// Global test utilities
global.createMockDb = createMockFirestore;
global.createMockCollectionRef = createMockCollectionReference;
global.createMockDocRef = createMockDocumentReference;

// Console error suppression for expected errors in tests
const originalConsoleError = console.error;
global.console.error = (...args) => {
  // Suppress Firebase Admin warnings during tests
  if (args[0]?.includes?.('Firebase Admin')) {
    return;
  }
  originalConsoleError(...args);
};
