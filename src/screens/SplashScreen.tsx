import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Animated,
    StatusBar,
    StyleSheet,
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';

interface SplashScreenProps {
    navigation: any;
}

export default function SplashScreen({ navigation }: SplashScreenProps) {
    const { token, isLoggedIn, businessId, hasHydrated } = useAppStore();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Check auth state after storage has hydrated
        const checkAuthAndNavigate = () => {
            if (token && isLoggedIn && businessId) {
                setTimeout(() => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'MainTabs' }],
                    });
                }, 2000);
            } else {
                // If not logged in, go to onboarding after splash
                setTimeout(() => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Onboarding' }],
                    });
                }, 2000);
            }
        };

        if (hasHydrated) {
            checkAuthAndNavigate();
        } else {
            const timer = setTimeout(() => {
                checkAuthAndNavigate();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [token, isLoggedIn, businessId, hasHydrated, navigation]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Logo Icon */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoEmoji}>📒</Text>
                </View>

                <Text style={styles.appName}>ApnaKhata</Text>
                <Text style={styles.tagline}>आपका भरोसेमंद हिसाब-किताब</Text>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>100% सुरक्षित | बैंक जैसी सुरक्षा</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 30,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    logoEmoji: {
        fontSize: 60,
    },
    appName: {
        fontSize: 42,
        fontWeight: '800',
        color: COLORS.white,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 8,
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        fontWeight: '600',
    },
});
