import { useAppStore } from '../store/useAppStore';
import { apiGet } from '../lib/apiClient';
import {
    registerForPushNotifications,
    scheduleDailySummary,
    scheduleWeeklyReminder,
    isNotificationEnabled,
} from '../utils/notifications';
import type { Business } from '../types';

// ─── usePostLogin ─────────────────────────────────────────────────────────────

/**
 * Provides a single `runPostLogin(userId, phone)` function that executes all
 * side effects after a successful OTP verification:
 *  - Fetches and stores the business profile
 *  - Registers push notifications
 *  - Schedules daily summary and weekly reminder (based on user preferences)
 *
 * All errors are caught and logged internally. This function never throws.
 */
export function usePostLogin() {
    const { setBusiness, language } = useAppStore();

    async function runPostLogin(userId: string, phone: string): Promise<void> {
        // 1. Fetch business profile
        try {
            const profileRes = await apiGet<{ data?: Business } | Business>('/business-profile');
            if (profileRes.data) {
                // Handle both { data: Business } and plain Business response shapes
                const payload = profileRes.data as { data?: Business } & Business;
                setBusiness(payload.data ?? payload);
            }
        } catch (err) {
            console.error('[usePostLogin] Failed to fetch business profile:', err);
        }

        // 2. Register for push notifications
        try {
            await registerForPushNotifications(userId, phone);
        } catch (err) {
            console.error('[usePostLogin] Failed to register push notifications:', err);
        }

        // 3. Schedule notifications based on user preferences
        try {
            const [dailySummaryEnabled, weeklyReminderEnabled] = await Promise.all([
                isNotificationEnabled('DAILY_SUMMARY'),
                isNotificationEnabled('WEEKLY_REMINDER'),
            ]);

            const lang = (language as 'hi' | 'en') ?? 'hi';

            if (dailySummaryEnabled) {
                await scheduleDailySummary(lang).catch((err) => {
                    console.error('[usePostLogin] Failed to schedule daily summary:', err);
                });
            }

            if (weeklyReminderEnabled) {
                await scheduleWeeklyReminder(lang).catch((err) => {
                    console.error('[usePostLogin] Failed to schedule weekly reminder:', err);
                });
            }
        } catch (err) {
            console.error('[usePostLogin] Failed to check/schedule notifications:', err);
        }
    }

    return { runPostLogin };
}
