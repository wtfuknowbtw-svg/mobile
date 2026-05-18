import { useState, useRef, useEffect, useCallback } from 'react';
import { Alert, TextInput } from 'react-native';
import { sendOtp, verifyOtp } from '../api/auth';
import { useAppStore } from '../store/useAppStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseOtpFlowOptions {
    /** Localised error strings forwarded to Alert dialogs */
    text: {
        errorTitle: string;
        errorMsg: string;
        loginFailed: string;
        invalidOtp: string;
    };
    /** Called with (userId, phone) after the backend session is created */
    onSuccess: (userId: string, phone: string, token: string) => void;
}

interface UseOtpFlowReturn {
    phone: string;
    setPhone: (v: string) => void;
    otpSent: boolean;
    setOtpSent: (v: boolean) => void;
    otp: string[];
    timer: number;
    isLoading: boolean;
    otpRefs: React.MutableRefObject<(TextInput | null)[]>;
    handleSendOtp: () => Promise<void>;
    handleVerify: () => Promise<void>;
    handleOtpChange: (value: string, index: number) => void;
    handleResend: () => Promise<void>;
}

// ─── useOtpFlow ───────────────────────────────────────────────────────────────

/**
 * Manages all OTP flow state and actions for the login screen.
 * Stores the TextBee `otpId` internally and passes it to verifyOtp.
 */
export function useOtpFlow({ text, onSuccess }: UseOtpFlowOptions): UseOtpFlowReturn {
    const { setPhone: storeSetPhone, setBusinessId, setToken } = useAppStore();

    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const [isLoading, setIsLoading] = useState(false);

    const otpIdRef = useRef<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const otpRefs = useRef<(TextInput | null)[]>([]);

    // ── Timer management ─────────────────────────────────────────────────────

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimer(30);
        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    timerRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // ── handleSendOtp ────────────────────────────────────────────────────────

    const handleSendOtp = useCallback(async () => {
        if (phone.length < 10) return;

        setIsLoading(true);
        const res = await sendOtp(phone);
        setIsLoading(false);

        if (res.success && res.otpId) {
            otpIdRef.current = res.otpId;
            storeSetPhone(phone);
            setOtpSent(true);
            startTimer();
        } else {
            Alert.alert(text.errorTitle, res.error ?? `${text.errorMsg}.`);
        }
    }, [phone, text, storeSetPhone, startTimer]);

    // ── handleResend ─────────────────────────────────────────────────────────

    const handleResend = useCallback(async () => {
        setOtp(['', '', '', '', '', '']);
        await handleSendOtp();
    }, [handleSendOtp]);

    // ── handleOtpChange ──────────────────────────────────────────────────────

    const handleOtpChange = useCallback((value: string, index: number) => {
        setOtp((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        } else if (!value && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    }, []);

    // ── handleVerify ─────────────────────────────────────────────────────────

    const handleVerify = useCallback(async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) return;

        const currentOtpId = otpIdRef.current;
        if (!currentOtpId) {
            Alert.alert(text.errorTitle, text.errorMsg);
            return;
        }

        setIsLoading(true);
        const res = await verifyOtp(phone, currentOtpId, otpCode);
        setIsLoading(false);

        if (res.success) {
            if (res.user?.id) setBusinessId(res.user.id);
            if (res.user?.phone) storeSetPhone(res.user.phone);
            if (res.token) setToken(res.token);

            onSuccess(res.user?.id ?? '', res.user?.phone ?? phone, res.token ?? '');
        } else {
            Alert.alert(text.loginFailed, res.error ?? text.invalidOtp);
        }
    }, [otp, phone, text, setBusinessId, storeSetPhone, setToken, onSuccess]);

    return {
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
    };
}
