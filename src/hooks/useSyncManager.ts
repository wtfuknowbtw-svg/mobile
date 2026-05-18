import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineQueue } from '../store/useOfflineQueue';

export interface SyncManager {
    pendingCount: number;
    failedCount: number;
    isSyncing: boolean;
    hasFailed: boolean;
    retryFailed: () => void;
}

export function useSyncManager(): SyncManager {
    const { isOnline } = useNetworkStatus();
    const queue = useOfflineQueue((state) => state.queue);
    const isSyncing = useOfflineQueue((state) => state.isSyncing);

    const pendingCount = queue.filter((item) => item.status === 'pending' || item.status === 'syncing').length;
    const failedCount = queue.filter((item) => item.status === 'failed').length;
    const hasFailed = failedCount > 0;

    const prevIsOnlineRef = useRef<boolean>(isOnline);

    // Sync when transitioning from offline to online (stabilization delay of 1500ms)
    useEffect(() => {
        if (!prevIsOnlineRef.current && isOnline) {
            const timer = setTimeout(() => {
                useOfflineQueue.getState().syncQueue();
            }, 1500);
            return () => clearTimeout(timer);
        }
        prevIsOnlineRef.current = isOnline;
    }, [isOnline]);

    // Sync when app is brought to foreground
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                useOfflineQueue.getState().syncQueue();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, []);

    const retryFailed = () => {
        useOfflineQueue.getState().retryAllFailed();
    };

    return {
        pendingCount,
        failedCount,
        isSyncing,
        hasFailed,
        retryFailed,
    };
}
