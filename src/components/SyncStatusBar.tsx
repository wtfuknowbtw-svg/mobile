import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, Animated, View, Easing, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncManager } from '../hooks/useSyncManager';

export default function SyncStatusBar() {
    const { pendingCount, failedCount, isSyncing, hasFailed, retryFailed } = useSyncManager();
    const [showAllSynced, setShowAllSynced] = useState<boolean>(false);
    const spinValue = useRef(new Animated.Value(0)).current;

    const prevPendingRef = useRef<number>(pendingCount);
    const prevSyncingRef = useRef<boolean>(isSyncing);

    // Easing spin animation for the sync icon
    useEffect(() => {
        let animation: Animated.CompositeAnimation | null = null;
        if (isSyncing) {
            spinValue.setValue(0);
            animation = Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );
            animation.start();
        } else {
            spinValue.setValue(0);
        }
        return () => {
            animation?.stop();
        };
    }, [isSyncing]);

    // Handle flashing "All synced ✓" for 2 seconds
    useEffect(() => {
        const wasBusy = prevPendingRef.current > 0 || prevSyncingRef.current;
        const isNowSynced = pendingCount === 0 && !isSyncing;

        if (wasBusy && isNowSynced && !hasFailed) {
            setShowAllSynced(true);
            const timer = setTimeout(() => {
                setShowAllSynced(false);
            }, 2000);
            return () => clearTimeout(timer);
        }

        prevPendingRef.current = pendingCount;
        prevSyncingRef.current = isSyncing;
    }, [pendingCount, isSyncing, hasFailed]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Determine if we should show anything at all
    const shouldShow = pendingCount > 0 || isSyncing || hasFailed || showAllSynced;
    if (!shouldShow) return null;

    // Render Sync Success State
    if (showAllSynced && pendingCount === 0 && !isSyncing && !hasFailed) {
        return (
            <View style={[styles.container, styles.successBg]}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#03543F" style={styles.icon} />
                <Text style={[styles.text, styles.successText]}>All synced ✓</Text>
            </View>
        );
    }

    // Render Failed State
    if (hasFailed && !isSyncing) {
        return (
            <View style={[styles.container, styles.failedBg]}>
                <View style={styles.leftRow}>
                    <Ionicons name="warning-outline" size={14} color="#B91C1C" style={styles.icon} />
                    <Text style={[styles.text, styles.failedText]}>
                        {failedCount} transaction(s) failed to sync
                    </Text>
                </View>
                <TouchableOpacity onPress={retryFailed} style={styles.retryBtn} activeOpacity={0.7}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Render Syncing / Pending State
    return (
        <View style={[styles.container, styles.syncingBg]}>
            <Animated.View style={[styles.icon, isSyncing && { transform: [{ rotate: spin }] }]}>
                <Ionicons name="sync-outline" size={14} color="#0C63AE" />
            </Animated.View>
            <Text style={[styles.text, styles.syncingText]}>
                {isSyncing ? `Syncing ${pendingCount} transaction(s)...` : `Pending ${pendingCount} transaction(s) to sync...`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    icon: {
        marginRight: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 12,
        fontWeight: '700',
    },
    syncingBg: {
        backgroundColor: '#E8F4FD',
    },
    syncingText: {
        color: '#0C63AE',
    },
    failedBg: {
        backgroundColor: '#FDE8E8',
        justifyContent: 'space-between',
    },
    failedText: {
        color: '#B91C1C',
    },
    retryBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    retryBtnText: {
        color: '#B91C1C',
        fontWeight: '800',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    successBg: {
        backgroundColor: '#DEF7EC',
    },
    successText: {
        color: '#03543F',
    },
});
