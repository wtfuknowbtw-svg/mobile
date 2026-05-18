import React from 'react';
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
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { useOtpFlow } from '../hooks/useOtpFlow';
import { usePostLogin } from '../hooks/usePostLogin';

interface OTPLoginScreenProps {
    navigation: any;
}

export default function OTPLoginScreen({ navigation }: OTPLoginScreenProps) {
    const { language, setLanguage, setLoggedIn } = useAppStore();
    const { runPostLogin } = usePostLogin();

    // ── i18n strings ─────────────────────────────────────────────────────────
    const text = {
        welcome:    language === 'hi' ? 'स्वागत है!'            : 'Welcome!',
        subtitle:   language === 'hi' ? 'अपना मोबाइल नंबर डालें' : 'Enter your mobile number',
        button:     language === 'hi' ? 'OTP भेजें'             : 'Send OTP',
        secure:     language === 'hi' ? '100% सुरक्षित'          : '100% Secure',
        bankSecurity: language === 'hi' ? 'बैंक जैसी सुरक्षा'   : 'Bank-grade Security',
        enterOtp:   language === 'hi' ? 'OTP डालें'             : 'Enter OTP',
        otpSent:    language === 'hi' ? 'पर OTP भेजा गया'       : 'OTP sent to',
        verify:     language === 'hi' ? 'वेरिफाई करें'           : 'Verify',
        resendIn:   language === 'hi' ? 'फिर से भेजें'           : 'Resend in',
        resendOtp:  language === 'hi' ? 'OTP फिर से भेजें'      : 'Resend OTP',
        errorTitle: language === 'hi' ? 'त्रुटि'                 : 'Error',
        errorMsg:   language === 'hi' ? 'OTP भेजने में विफल'    : 'Failed to send OTP',
        loginFailed: language === 'hi' ? 'लॉगिन विफल'           : 'Login Failed',
        invalidOtp: language === 'hi' ? 'अमान्य OTP'            : 'Invalid OTP',
    } as const;

    // ── OTP flow hook ─────────────────────────────────────────────────────────
    const {
        phone,
        setPhone,
        otpSent,
        setOtpSent,
        otp,
        timer,
        isLoading,
        otpRefs,
        handleSendOtp,
        handleVerify,
        handleOtpChange,
        handleResend,
    } = useOtpFlow({
        text,
        onSuccess: async (userId, userPhone) => {
            setLoggedIn(true);
            await runPostLogin(userId, userPhone);
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        },
    });

    const toggleLanguage = () => setLanguage(language === 'hi' ? 'en' : 'hi');

    // ── Render ────────────────────────────────────────────────────────────────
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
                            /* ── Phone entry ──────────────────────────────── */
                            <View style={styles.formContainer}>
                                <Text style={styles.welcomeTitle}>{text.welcome}</Text>
                                <Text style={styles.subtext}>{text.subtitle}</Text>

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

                                {/* Trust indicators */}
                                <View style={styles.trustContainer}>
                                    <Text style={styles.trustItem}>🔒 {text.secure}</Text>
                                    <View style={styles.dot} />
                                    <Text style={styles.trustItem}>🏦 {text.bankSecurity}</Text>
                                </View>
                            </View>
                        ) : (
                            /* ── OTP entry ────────────────────────────────── */
                            <View style={styles.formContainer}>
                                <Text style={styles.welcomeTitle}>{text.enterOtp}</Text>
                                <Text style={styles.subtext}>+91 {phone} {text.otpSent}</Text>

                                {/* 6-box OTP input */}
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
                                                digit ? styles.otpInputActive : {},
                                            ]}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleVerify}
                                    disabled={isLoading || otp.join('').length !== 6}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.buttonText}>{text.verify}</Text>
                                    )}
                                </TouchableOpacity>

                                {/* Resend timer */}
                                <View style={styles.timerContainer}>
                                    {timer > 0 ? (
                                        <Text style={styles.timerText}>{text.resendIn} ({timer}s)</Text>
                                    ) : (
                                        <TouchableOpacity onPress={handleResend}>
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

// ─── Styles (unchanged from original) ────────────────────────────────────────

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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 12 : 12,
        height: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 64 : 64,
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
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
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
        marginTop: 10,
        marginBottom: 24,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    logoEmoji: {
        fontSize: 36,
    },
    appName: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.primary,
        marginTop: 8,
    },
    formContainer: {
        width: '100%',
    },
    welcomeTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 6,
    },
    subtext: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginBottom: 24,
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
        marginRight: 8,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: COLORS.border,
        marginHorizontal: 12,
    },
    phoneInput: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        letterSpacing: 1,
        paddingVertical: 0,
        textAlignVertical: 'center',
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
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
        marginTop: 24,
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
