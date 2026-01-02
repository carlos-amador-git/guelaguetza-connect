import { useState, useEffect, useCallback } from 'react';
import {
  initSyncManager,
  cleanupSyncManager,
  onSyncUpdate,
  forceSync,
  getSyncStatus,
  setSyncToken,
  isNetworkOnline,
} from '../services/syncManager';
import { initDB, addAction, OfflineAction } from '../services/indexedDB';

interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}

export function useOffline(token: string | null) {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
  });

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      // Initialize IndexedDB
      await initDB();

      // Initialize sync manager
      initSyncManager();

      // Update initial status
      const status = await getSyncStatus();
      setState({
        isOnline: status.isOnline,
        isSyncing: status.isSyncing,
        pendingCount: status.pendingCount,
      });
    };

    init();

    return () => {
      cleanupSyncManager();
    };
  }, []);

  // Update token when it changes
  useEffect(() => {
    setSyncToken(token);
  }, [token]);

  // Listen for sync updates
  useEffect(() => {
    const unsubscribe = onSyncUpdate((pendingCount) => {
      setState((prev) => ({ ...prev, pendingCount }));
    });

    return unsubscribe;
  }, []);

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Queue an action for sync
  const queueAction = useCallback(
    async (
      type: OfflineAction['type'],
      payload: unknown
    ): Promise<string> => {
      const id = await addAction({
        type,
        payload,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
        createdAt: Date.now(),
      });

      // Update pending count
      const status = await getSyncStatus();
      setState((prev) => ({ ...prev, pendingCount: status.pendingCount }));

      // Try to sync immediately if online
      if (isNetworkOnline()) {
        forceSync();
      }

      return id;
    },
    []
  );

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    setState((prev) => ({ ...prev, isSyncing: true }));
    try {
      await forceSync();
    } finally {
      const status = await getSyncStatus();
      setState({
        isOnline: status.isOnline,
        isSyncing: status.isSyncing,
        pendingCount: status.pendingCount,
      });
    }
  }, []);

  return {
    ...state,
    queueAction,
    triggerSync,
  };
}

export default useOffline;
