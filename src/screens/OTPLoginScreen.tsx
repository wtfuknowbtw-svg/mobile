import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { sendOtp, verifyOtp } from '../api/auth';
import { apiGet } from '../lib/apiClient';
import { registerForPushNotifications, scheduleDailySummary, scheduleWeeklyReminder, isNotificationEnabled } from '../utils/notifications';

interface OTPLoginScreenProps {
    navigation: any;
}

export default function OTPLoginScreen({ navigation }: OTPLoginScreenProps) {
    const { setLoggedIn, setPhone: storeSetPhone, setBusinessId, setToken, language, setLanguage, setBusiness } = useAppStore();
    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const [isLoading, setIsLoading] = useState(false);
    const otpRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        let interval: any;
        if (otpSent && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [otpSent, timer]);

    const handleSendOtp = async () => {
        if (phone.length >= 10) {
            setIsLoading(true);
            const res = await sendOtp(phone);
            setIsLoading(false);

            if (res.success) {
                storeSetPhone(phone);
                setOtpSent(true);
                setTimer(30);
            } else {
                Alert.alert(text.errorTitle, text.errorMsg + '.');
            }
        }
    };

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        } else if (!value && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) return;

        setIsLoading(true);
        const res = await verifyOtp(phone, otpCode);
        setIsLoading(false);

        if (res.success) {
            if (res.user?.id) setBusinessId(res.user.id);
            if (res.user?.phone) storeSetPhone(res.user.phone);
            if (res.token) setToken(res.token);

            // Fetch business profile and save to store
            try {
                const profileRes = await apiGet('/business-profile');
                if (profileRes.data && profileRes.data.data) {
                    setBusiness(profileRes.data.data);
                } else if (profileRes.data) {
                    setBusiness(profileRes.data);
                }
            } catch (err) {
                console.error('Failed to fetch business profile:', err);
            }

            setLoggedIn(true);

            // Register for push notifications after successful login
            if (res.user?.id) {
                registerForPushNotifications(res.user.id, res.user.phone || phone).catch(err => {
                    console.error('Failed to register push notifications:', err);
                });
            }

            // Schedule daily summary and weekly reminder notifications
            const dailySummaryEnabled = await isNotificationEnabled('DAILY_SUMMARY');
            const weeklyReminderEnabled = await isNotificationEnabled('WEEKLY_REMINDER');

            if (dailySummaryEnabled) {
                scheduleDailySummary(language as 'hi' | 'en').catch(err => {
                    console.error('Failed to schedule daily summary:', err);
                });
            }

            if (weeklyReminderEnabled) {
                scheduleWeeklyReminder(language as 'hi' | 'en').catch(err => {
                    console.error('Failed to schedule weekly reminder:', err);
                });
            }

            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        } else {
            Alert.alert(text.loginFailed, res.error || text.invalidOtp);
        }
    };

    const toggleLanguage = () => {
        setLanguage(language === 'hi' ? 'en' : 'hi');
    };

    const text = {
        welcome: language === 'hi' ? 'स्वागत है!' : 'Welcome!',
        subtitle: language === 'hi' ? 'अपना मोबाइल नंबर डालें' : 'Enter your mobile number',
        button: language === 'hi' ? 'OTP भेजें' : 'Send OTP',
        secure: language === 'hi' ? '100% सुरक्षित' : '100% Secure',
        bankSecurity: language === 'hi' ? 'बैंक जैसी सुरक्षा' : 'Bank-grade Security',
        enterOtp: language === 'hi' ? 'OTP डालें' : 'Enter OTP',
        otpSent: language === 'hi' ? 'पर OTP भेजा गया' : 'OTP sent to',
        verify: language === 'hi' ? 'वेरिफाई करें' : 'Verify',
        resendIn: language === 'hi' ? 'फिर से भेजें' : 'Resend in',
        resendOtp: language === 'hi' ? 'OTP फिर से भेजें' : 'Resend OTP',
        errorTitle: language === 'hi' ? 'त्रुटि' : 'Error',
        errorMsg: language === 'hi' ? 'OTP भेजने में विफल' : 'Failed to send OTP',
        loginFailed: language === 'hi' ? 'लॉगिन विफल' : 'Login Failed',
        invalidOtp: language === 'hi' ? 'अमान्य OTP' : 'Invalid OTP'
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    {otpSent ? (
                        <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.backButton}>
                            <Text style={styles.backButtonText}>←</Text>
                        </TouchableOpacity>
                    ) : <View />}
                    
                    <TouchableOpacity onPress={toggleLanguage} style={styles.langSelector}>
                        <Text style={styles.langText}>{language === 'hi' ? 'English' : 'हिंदी'}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>📒</Text>
                        </View>
                        <Text style={styles.appName}>ApnaKhata</Text>
                    </View>

                    {!otpSent ? (
                        <View style={styles.formContainer}>
                            <Text style={styles.welcomeTitle}>{text.welcome}</Text>
                            <Text style={styles.subtext}>{text.subtitle}</Text>

                            {/* Phone Input */}
                            <View style={styles.phoneInputContainer}>
                                <Text style={styles.countryCode}>🇮🇳 +91</Text>
                                <View style={styles.divider} />
                                <TextInput
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="00000 00000"
                                    placeholderTextColor={COLORS.textMuted}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    style={styles.phoneInput}
                                    autoFocus
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryButton, phone.length < 10 && styles.disabledButton]}
                                onPress={handleSendOtp}
                                disabled={phone.length < 10 || isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.buttonText}>{text.button}</Text>
                                )}
                            </TouchableOpacity>

                            {/* Trust Indicators */}
                            <View style={styles.trustContainer}>
                                <Text style={styles.trustItem}>🔒 {text.secure}</Text>
                                <View style={styles.dot} />
                                <Text style={styles.trustItem}>🏦 {text.bankSecurity}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.formContainer}>
                            <Text style={styles.welcomeTitle}>{text.enterOtp}</Text>
                            <Text style={styles.subtext}>+91 {phone} {text.otpSent}</Text>

                            {/* OTP Inputs */}
                            <View style={styles.otpContainer}>
                                {otp.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(ref) => { otpRefs.current[index] = ref; }}
                                        value={digit}
                                        onChangeText={(v) => handleOtpChange(v, index)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        style={[
                                            styles.otpInput,
                                            digit ? styles.otpInputActive : {}
                                        ]}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleVerify}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.buttonText}>{text.verify}</Text>
                                )}
                            </TouchableOpacity>

                            {/* Resend Timer */}
                            <View style={styles.timerContainer}>
                                {timer > 0 ? (
                                    <Text style={styles.timerText}>{text.resendIn} ({timer}s)</Text>
                                ) : (
                                    <TouchableOpacity onPress={handleSendOtp}>
                                        <Text style={styles.resendText}>{text.resendOtp}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        height: 60,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 24,
        color: COLORS.text,
        fontWeight: 'bold',
    },
    langSelector: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    langText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    logoEmoji: {
        fontSize: 40,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.primary,
        marginTop: 12,
    },
    formContainer: {
        width: '100%',
    },
    welcomeTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtext: {
        fontSize: 18,
        color: COLORS.textMuted,
        marginBottom: 32,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        height: 64,
        marginBottom: 24,
    },
    countryCode: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginRight: 12,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.border,
        marginRight: 16,
    },
    phoneInput: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        letterSpacing: 1,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
    },
    trustContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    trustItem: {
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.border,
        marginHorizontal: 10,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    otpInput: {
        width: 48,
        height: 60,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
    },
    otpInputActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    timerContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    timerText: {
        fontSize: 16,
        color: COLORS.textMuted,
    },
    resendText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '700',
    },
});
