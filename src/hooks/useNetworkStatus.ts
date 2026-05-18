import { useEffect, useState, useRef } from 'react';
import NetInfo, { NetInfoState, NetInfoCellularGeneration } from '@react-native-community/netinfo';

export interface NetworkStatus {
    isOnline: boolean;
    isOffline: boolean;
    connectionType: string | null;
    lastOnlineAt: Date | null;
    getLastSeenText: () => string | null;
}

export function useNetworkStatus(): NetworkStatus {
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [connectionType, setConnectionType] = useState<string | null>(null);
    const lastOnlineAtRef = useRef<Date | null>(null);

    useEffect(() => {
        const handleStateChange = (state: NetInfoState) => {
            const online = !!state.isConnected;
            setIsOnline(online);
            setConnectionType(state.type);
            if (online) {
                lastOnlineAtRef.current = new Date();
            }
        };

        const unsubscribe = NetInfo.addEventListener(handleStateChange);

        // Fetch initial state
        NetInfo.fetch().then(handleStateChange);

        return () => {
            unsubscribe();
        };
    }, []);

    const isOffline = !isOnline;

    const getLastSeenText = (): string | null => {
        if (isOnline) {
            return null;
        }

        if (lastOnlineAtRef.current) {
            const diffMs = new Date().getTime() - lastOnlineAtRef.current.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));

            if (diffMins < 60) {
                return `Last synced ${diffMins} mins ago`;
            }
            
            const diffHours = Math.floor(diffMins / 60);
            return `Last synced ${diffHours}h ago`;
        }

        return "No internet connection";
    };

    return {
        isOnline,
        isOffline,
        connectionType,
        lastOnlineAt: lastOnlineAtRef.current,
        getLastSeenText,
    };
}
