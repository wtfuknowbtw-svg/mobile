import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';
import { useAppStore } from '../store/useAppStore';

// AsyncStorage keys used by the auth system
const AUTH_STORAGE_KEYS = ['pushToken', 'notificationPreferences'] as const;

// ─── getAuthHeaders ───────────────────────────────────────────────────────────

/**
 * Returns standard Authorization + Content-Type headers for authenticated requests.
 */
export function getAuthHeaders(token: string): Record<string, string> {
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

// ─── validateStoredToken ──────────────────────────────────────────────────────

/**
 * Validates a JWT token against the backend's /auth/validate endpoint.
 * Returns true if the token is valid, false otherwise.
 */
export async function validateStoredToken(token: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/validate`, {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        return response.ok;
    } catch {
        return false;
    }
}

// ─── clearAuthData ────────────────────────────────────────────────────────────

/**
 * Fully clears all authentication state:
 * - Resets Zustand store via logout()
 * - Removes all auth-related AsyncStorage keys
 */
export async function clearAuthData(): Promise<void> {
    // Reset Zustand store (clears isLoggedIn, token, businessId, phone, business)
    useAppStore.getState().logout();

    // Remove persisted AsyncStorage keys used by auth features
    await AsyncStorage.multiRemove([...AUTH_STORAGE_KEYS]);
}
