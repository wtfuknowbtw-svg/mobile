import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Animated,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { sendOtp, verifyOtp } from '../api/auth';

interface OTPLoginScreenProps {
    navigation: any;
}

export default function OTPLoginScreen({ navigation }: OTPLoginScreenProps) {
    const { setLoggedIn, setPhone: storeSetPhone, setBusinessId, setToken } = useAppStore();
    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const [isLoading, setIsLoading] = useState(false);
    const otpRefs = useRef<(TextInput | null)[]>([]);

    const handleSendOtp = async () => {
        if (phone.length >= 10) {
            setIsLoading(true);
            const res = await sendOtp(phone);
            setIsLoading(false);

            if (res.success) {
                storeSetPhone(phone);
                setOtpSent(true);
                // Start countdown
                let t = 30;
                const interval = setInterval(() => {
                    t--;
                    setTimer(t);
                    if (t <= 0) clearInterval(interval);
                }, 1000);
            } else {
                Alert.alert('Error', 'Failed to send OTP. Please try again.');
            }
        }
    };

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) return;

        setIsLoading(true);
        const res = await verifyOtp(phone, otpCode);
        setIsLoading(false);

        if (res.success) {
            if (res.user?.id) {
                setBusinessId(res.user.id);
            }
            if (res.token) {
                setToken(res.token);
            }
            setLoggedIn(true);
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        } else {
            Alert.alert('Login Failed', res.error || 'Invalid OTP');
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: COLORS.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    paddingHorizontal: 24,
                }}
            >
                {/* Icon */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <View
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            backgroundColor: COLORS.primaryLight,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 32 }}>📱</Text>
                    </View>
                </View>

                {/* Title */}
                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: '700',
                        color: COLORS.text,
                        textAlign: 'center',
                        marginBottom: 8,
                    }}
                >
                    Enter your number
                </Text>
                <Text
                    style={{
                        fontSize: 14,
                        color: COLORS.textMuted,
                        textAlign: 'center',
                        marginBottom: 32,
                    }}
                >
                    We'll send an OTP to verify
                </Text>

                {!otpSent ? (
                    <>
                        {/* Phone Input */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: COLORS.card,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                paddingHorizontal: 16,
                                marginBottom: 24,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 16,
                                    color: COLORS.textMuted,
                                    marginRight: 8,
                                    fontWeight: '600',
                                }}
                            >
                                MOBILE NUMBER
                            </Text>
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: COLORS.card,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                paddingHorizontal: 16,
                                marginBottom: 24,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 16,
                                    color: COLORS.text,
                                    marginRight: 8,
                                    fontWeight: '600',
                                }}
                            >
                                +91
                            </Text>
                            <View
                                style={{
                                    width: 1,
                                    height: 24,
                                    backgroundColor: COLORS.border,
                                    marginRight: 12,
                                }}
                            />
                            <TextInput
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="98765 43210"
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="phone-pad"
                                maxLength={10}
                                style={{
                                    flex: 1,
                                    fontSize: 18,
                                    color: COLORS.text,
                                    paddingVertical: 16,
                                    fontWeight: '500',
                                    letterSpacing: 1,
                                }}
                            />
                        </View>

                        {/* Send OTP */}
                        <TouchableOpacity
                            onPress={handleSendOtp}
                            activeOpacity={0.85}
                            style={{
                                backgroundColor: COLORS.success,
                                paddingVertical: 16,
                                borderRadius: 12,
                                alignItems: 'center',
                                opacity: phone.length >= 10 && !isLoading ? 1 : 0.5,
                                shadowColor: COLORS.success,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 6,
                            }}
                            disabled={phone.length < 10 || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text
                                    style={{
                                        color: COLORS.white,
                                        fontSize: 17,
                                        fontWeight: '700',
                                    }}
                                >
                                    Send OTP →
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Bypass for testing */}
                        <TouchableOpacity
                            onPress={() => {
                                setPhone('9999999999');
                                setOtp(['0', '0', '0', '0', '0', '0']);
                                setOtpSent(true);
                            }}
                            style={{ marginTop: 20, alignItems: 'center' }}
                        >
                            <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: '500' }}>
                                🧪 Test Mode: Skip to OTP
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {/* OTP Display */}
                        <Text
                            style={{
                                fontSize: 14,
                                color: COLORS.textMuted,
                                textAlign: 'center',
                                marginBottom: 20,
                            }}
                        >
                            Enter OTP sent to +91 {phone}
                        </Text>

                        {/* OTP Input Boxes */}
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                gap: 12,
                                marginBottom: 32,
                            }}
                        >
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => { otpRefs.current[index] = ref; }}
                                    value={digit}
                                    onChangeText={(v) => handleOtpChange(v, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    style={{
                                        width: 48,
                                        height: 56,
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        borderColor: digit ? COLORS.success : COLORS.border,
                                        backgroundColor: digit
                                            ? COLORS.successLight
                                            : COLORS.card,
                                        fontSize: 22,
                                        fontWeight: '700',
                                        color: COLORS.text,
                                        textAlign: 'center',
                                    }}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={handleVerify}
                            activeOpacity={0.85}
                            style={{
                                backgroundColor: COLORS.success,
                                paddingVertical: 16,
                                borderRadius: 12,
                                alignItems: 'center',
                                opacity: isLoading ? 0.7 : 1,
                                shadowColor: COLORS.success,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 6,
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text
                                    style={{
                                        color: COLORS.white,
                                        fontSize: 17,
                                        fontWeight: '700',
                                    }}
                                >
                                    Verify & Login →
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend */}
                        {timer > 0 ? (
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: COLORS.textMuted,
                                    textAlign: 'center',
                                    marginTop: 16,
                                }}
                            >
                                Resend OTP in {timer}s
                            </Text>
                        ) : (
                            <TouchableOpacity
                                onPress={() => {
                                    handleSendOtp();
                                    setTimer(30);
                                }}
                                style={{ marginTop: 16, alignItems: 'center' }}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: COLORS.success,
                                        fontWeight: '600',
                                    }}
                                >
                                    Resend OTP
                                </Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}
