// IndexedDB Wrapper for offline storage

const DB_NAME = 'guelaguetza-offline';
const DB_VERSION = 1;

export interface OfflineAction {
  id: string;
  type: 'like' | 'comment' | 'story' | 'follow' | 'community_post';
  payload: unknown;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  lastAttempt?: number;
  error?: string;
}

export interface CachedStory {
  id: string;
  data: unknown;
  cachedAt: number;
}

let db: IDBDatabase | null = null;

// Initialize the database
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Action queue store
      if (!database.objectStoreNames.contains('actionQueue')) {
        const actionStore = database.createObjectStore('actionQueue', { keyPath: 'id' });
        actionStore.createIndex('by-status', 'status', { unique: false });
        actionStore.createIndex('by-createdAt', 'createdAt', { unique: false });
      }

      // Stories cache store
      if (!database.objectStoreNames.contains('stories')) {
        const storyStore = database.createObjectStore('stories', { keyPath: 'id' });
        storyStore.createIndex('by-cachedAt', 'cachedAt', { unique: false });
      }

      // Drafts store
      if (!database.objectStoreNames.contains('drafts')) {
        database.createObjectStore('drafts', { keyPath: 'id' });
      }
    };
  });
}

// Get database instance
async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    await initDB();
  }
  return db!;
}

// ========== Action Queue Operations ==========

// Add action to queue
export async function addAction(action: Omit<OfflineAction, 'id'>): Promise<string> {
  const database = await getDB();
  const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('actionQueue', 'readwrite');
    const store = transaction.objectStore('actionQueue');
    const request = store.add({ ...action, id });

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

// Get pending actions
export async function getPendingActions(): Promise<OfflineAction[]> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('actionQueue', 'readonly');
    const store = transaction.objectStore('actionQueue');
    const index = store.index('by-status');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Update action status
export async function updateActionStatus(
  id: string,
  status: OfflineAction['status'],
  error?: string
): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('actionQueue', 'readwrite');
    const store = transaction.objectStore('actionQueue');
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const action = getRequest.result;
      if (action) {
        action.status = status;
        action.lastAttempt = Date.now();
        if (error) action.error = error;
        if (status === 'failed') action.retryCount++;

        const putRequest = store.put(action);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Delete action
export async function deleteAction(id: string): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('actionQueue', 'readwrite');
    const store = transaction.objectStore('actionQueue');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get action count by status
export async function getActionCount(status?: OfflineAction['status']): Promise<number> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('actionQueue', 'readonly');
    const store = transaction.objectStore('actionQueue');

    if (status) {
      const index = store.index('by-status');
      const request = index.count(status);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } else {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }
  });
}

// ========== Stories Cache Operations ==========

// Cache a story
export async function cacheStory(id: string, data: unknown): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('stories', 'readwrite');
    const store = transaction.objectStore('stories');
    const request = store.put({
      id,
      data,
      cachedAt: Date.now(),
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get cached story
export async function getCachedStory(id: string): Promise<CachedStory | null> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('stories', 'readonly');
    const store = transaction.objectStore('stories');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Get all cached stories
export async function getAllCachedStories(): Promise<CachedStory[]> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('stories', 'readonly');
    const store = transaction.objectStore('stories');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Clean old cached stories (keep last N)
export async function cleanOldStories(keepCount: number = 100): Promise<void> {
  const database = await getDB();
  const stories = await getAllCachedStories();

  if (stories.length <= keepCount) return;

  // Sort by cachedAt descending and get IDs to delete
  const sorted = stories.sort((a, b) => b.cachedAt - a.cachedAt);
  const toDelete = sorted.slice(keepCount).map((s) => s.id);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('stories', 'readwrite');
    const store = transaction.objectStore('stories');

    let completed = 0;
    let hasError = false;

    for (const id of toDelete) {
      const request = store.delete(id);
      request.onsuccess = () => {
        completed++;
        if (completed === toDelete.length && !hasError) {
          resolve();
        }
      };
      request.onerror = () => {
        hasError = true;
        reject(request.error);
      };
    }

    if (toDelete.length === 0) {
      resolve();
    }
  });
}

// ========== Drafts Operations ==========

// Save draft
export async function saveDraft(id: string, content: unknown): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('drafts', 'readwrite');
    const store = transaction.objectStore('drafts');
    const request = store.put({ id, content, savedAt: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get draft
export async function getDraft(id: string): Promise<unknown | null> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('drafts', 'readonly');
    const store = transaction.objectStore('drafts');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result?.content || null);
    request.onerror = () => reject(request.error);
  });
}

// Delete draft
export async function deleteDraft(id: string): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction('drafts', 'readwrite');
    const store = transaction.objectStore('drafts');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      ['actionQueue', 'stories', 'drafts'],
      'readwrite'
    );

    transaction.objectStore('actionQueue').clear();
    transaction.objectStore('stories').clear();
    transaction.objectStore('drafts').clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
