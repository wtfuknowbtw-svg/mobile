// OTP Provider: MSG91 | https://docs.msg91.com/otp
import { API_BASE_URL } from '../constants';

const MSG91_AUTH_KEY = process.env.EXPO_PUBLIC_MSG91_AUTH_KEY ?? '';
const MSG91_TEMPLATE_ID = process.env.EXPO_PUBLIC_MSG91_TEMPLATE_ID ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SendOtpResult {
    success: boolean;
    otpId?: string;
    error?: string;
}

interface VerifyOtpResult {
    success: boolean;
    verified?: boolean;
    user?: { id: string; phone: string };
    token?: string;
    error?: string;
}

interface Msg91Response {
    request_id?: string;
    type?: string;
    message?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function parseJsonSafe<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
        throw new Error(`Unexpected content-type: ${contentType} (status ${response.status})`);
    }
    return response.json() as Promise<T>;
}

// ─── sendOtp ─────────────────────────────────────────────────────────────────

/**
 * Sends an OTP to the given 10-digit phone number via MSG91.
 * Returns { success, otpId } on success, or { success: false, error } on failure.
 */
export async function sendOtp(phone: string): Promise<SendOtpResult> {
    try {
        const response = await fetch('https://api.msg91.com/api/v5/otp', {
            method: 'POST',
            headers: {
                'authkey': MSG91_AUTH_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                template_id: MSG91_TEMPLATE_ID,
                mobile: `91${phone}`,
                otp_length: 6,
                otp_expiry: 5,
            }),
        });

        const data = await parseJsonSafe<Msg91Response>(response);

        if (!response.ok || data.type === 'error' || !data.request_id) {
            return {
                success: false,
                error: data.message ?? 'Failed to send OTP via MSG91',
            };
        }

        return { success: true, otpId: data.request_id };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Network error. Please try again.';
        return { success: false, error: message };
    }
}

// ─── verifyOtp ───────────────────────────────────────────────────────────────

/**
 * 1. Verifies the OTP with MSG91 using the request_id returned by sendOtp.
 * 2. On success, calls the backend /auth/session to create a session.
 * Returns { success, user, token } from the session response or { success: false, error } on failure.
 */
export async function verifyOtp(
    phone: string,
    otpId: string,
    otp: string,
): Promise<VerifyOtpResult> {
    try {
        // Step 1: Verify with MSG91 (Robustly passing as both URL parameters and JSON body)
        const verifyUrl = `https://api.msg91.com/api/v5/otp/verify?otp=${otp}&request_id=${otpId}`;
        const msg91Response = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
                'authkey': MSG91_AUTH_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                request_id: otpId,
                otp: otp,
            }),
        });

        const msg91Data = await parseJsonSafe<Msg91Response>(msg91Response);

        if (!msg91Response.ok || msg91Data.type !== 'success') {
            return {
                success: false,
                error: msg91Data.message ?? 'OTP verification failed',
            };
        }

        // Step 2: Create session on our backend
        const sessionResponse = await fetch(`${API_BASE_URL}/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });

        const sessionData = await parseJsonSafe<{
            success?: boolean;
            user?: { id: string; phone: string };
            token?: string;
            error?: string;
            message?: string;
        }>(sessionResponse);

        if (!sessionResponse.ok || !sessionData.success) {
            return {
                success: false,
                error: sessionData.error ?? sessionData.message ?? 'Session creation failed',
            };
        }

        return {
            success: true,
            user: sessionData.user,
            token: sessionData.token,
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Network error. Please try again.';
        return { success: false, error: message };
    }
}
