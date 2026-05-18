import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
    const { isOffline, getLastSeenText } = useNetworkStatus();
    const slideAnim = useRef(new Animated.Value(-36)).current; // Start hidden above (height is 36)
    const [shouldRender, setShouldRender] = useState<boolean>(isOffline);

    useEffect(() => {
        if (isOffline) {
            setShouldRender(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -36,
                duration: 300,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    setShouldRender(false);
                }
            });
        }
    }, [isOffline]);

    if (!shouldRender) {
        return null;
    }

    const lastSeenText = getLastSeenText() || '';

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
                <Ionicons name="cloud-offline-outline" size={16} color="#856404" style={styles.icon} />
                <Text style={styles.text} numberOfLines={1}>
                    You're offline — {lastSeenText}
                </Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 36,
        overflow: 'hidden',
        backgroundColor: '#FFF3CD',
        width: '100%',
    },
    banner: {
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#FFF3CD',
        width: '100%',
    },
    icon: {
        marginRight: 8,
    },
    text: {
        color: '#856404',
        fontWeight: '700',
        fontSize: 12,
    },
});
