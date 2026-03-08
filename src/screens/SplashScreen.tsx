import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    StatusBar,
    Dimensions,
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
    navigation: any;
}

export default function SplashScreen({ navigation }: SplashScreenProps) {
    const { token, isLoggedIn, businessId, hasHydrated } = useAppStore();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animations
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(buttonAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        // Check auth state after storage has hydrated
        const checkAuthAndNavigate = () => {
            console.log('🔍 Splash - Checking auth state...');
            console.log('🔍 Splash - Token exists:', !!token);
            console.log('🔍 Splash - Is logged in:', isLoggedIn);
            console.log('🔍 Splash - Business ID:', businessId);
            console.log('🔍 Splash - Has hydrated:', hasHydrated);

            // If user has valid auth state, navigate to main app
            if (token && isLoggedIn && businessId) {
                console.log('✅ Splash - User authenticated, navigating to MainTabs');
                setTimeout(() => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'MainTabs' }],
                    });
                }, 1000);
            } else {
                console.log('❌ Splash - No valid auth, showing Get Started button');
            }
        };

        // Wait a bit for Zustand to hydrate from AsyncStorage
        if (hasHydrated) {
            checkAuthAndNavigate();
        } else {
            // If not hydrated yet, wait and check again
            const timer = setTimeout(() => {
                checkAuthAndNavigate();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [token, isLoggedIn, businessId, hasHydrated, navigation]);

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 32,
                }}
            >
                {/* Logo Icon */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: 20,
                            backgroundColor: COLORS.successLight,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 24,
                            borderWidth: 2,
                            borderColor: COLORS.success,
                        }}
                    >
                        <Text style={{ fontSize: 48 }}>📒</Text>
                    </View>

                    <Text
                        style={{
                            fontSize: 36,
                            fontWeight: '800',
                            color: COLORS.text,
                            marginBottom: 12,
                        }}
                    >
                        <Text style={{ color: COLORS.success }}>Khata</Text>
                        <Text style={{ color: COLORS.orange }}>AI</Text>
                    </Text>

                    <Text
                        style={{
                            fontSize: 15,
                            color: COLORS.textMuted,
                            textAlign: 'center',
                            lineHeight: 22,
                            marginBottom: 48,
                        }}
                    >
                        Paper se Digital — Bina typing ke{'\n'}
                        Paper to Digital — No Typing
                    </Text>
                </Animated.View>

                {/* CTA Button */}
                <Animated.View
                    style={{
                        opacity: buttonAnim,
                        width: '100%',
                    }}
                >
                    <TouchableOpacity
                        onPress={() => navigation.navigate('LanguageSelect')}
                        activeOpacity={0.85}
                        style={{
                            backgroundColor: COLORS.success,
                            paddingVertical: 16,
                            borderRadius: 12,
                            alignItems: 'center',
                            shadowColor: COLORS.success,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 6,
                        }}
                    >
                        <Text
                            style={{ color: COLORS.white, fontSize: 17, fontWeight: '700' }}
                        >
                            Get Started →
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                <Text
                    style={{
                        fontSize: 12,
                        color: COLORS.textMuted,
                        marginTop: 16,
                        textAlign: 'center',
                    }}
                >
                    63M+ businesses already trust paper. Let's change that!
                </Text>
            </View>
        </View>
    );
}
