import { API_BASE_URL } from '../constants';

const BACKEND_URL = API_BASE_URL; // http://...:3000/api

export const sendOtp = async (phone: string) => {
    try {
        const response = await fetch(`${BACKEND_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });

        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.error || 'Failed to send OTP' };
        }

        return { success: true };
    } catch (error: any) {
        console.error('sendOtp error:', error);
        return { success: false, error: 'Network error. Check backend.' };
    }
};

export const verifyOtp = async (phone: string, otp: string) => {
    try {
        const response = await fetch(`${BACKEND_URL}/mobile-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp }),
        });

        // Capture raw response to see what's coming
        const text = await response.text();
        console.log('RAW RESPONSE:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.log('Backend returned HTML, not JSON!');
            console.log('FULL RESPONSE:', text);
            return { success: false, error: 'Server error' };
        }

        if (!response.ok) {
            return { success: false, error: data.error || 'Verification failed' };
        }

        return {
            success: true,
            user: data.user,
            token: data.token
        };
    } catch (error: any) {
        console.error('verifyOtp error:', error);
        return { success: false, error: 'Network error. Check backend.' };
    }
};
