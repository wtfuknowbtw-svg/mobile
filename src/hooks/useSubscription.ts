import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
    getSubscription,
    createSubscription,
    cancelSubscription,
    PLAN_LIMITS,
    type SubscriptionData,
} from '../api/subscription';

/**
 * Hook to manage subscription state and check plan limits.
 * 
 * Usage:
 *   const { plan, isFreePlan, canUseAI, showUpgradePrompt } = useSubscription();
 */
export function useSubscription() {
    const queryClient = useQueryClient();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['subscription'],
        queryFn: getSubscription,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const subscription: SubscriptionData | undefined = data?.data;
    const plan = subscription?.plan || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    const cancelMutation = useMutation({
        mutationFn: cancelSubscription,
        onSuccess: (res) => {
            if (res.error) {
                Alert.alert('Error', res.error);
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
            Alert.alert('Done', 'Your subscription has been cancelled.');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to cancel subscription');
        },
    });

    // ─── Feature gate helpers ───────────────────────────────

    const isFreePlan = plan === 'free';
    const isBasicPlan = plan === 'basic';
    const isProPlan = plan === 'pro';
    const isPaidPlan = plan !== 'free';

    /**
     * Check if the user can perform an AI scan (OCR/Voice).
     * For now, always returns true (soft limit — just shows a banner).
     */
    const canUseAI = (dailyUsageCount: number): boolean => {
        return dailyUsageCount < limits.aiScansPerDay;
    };

    /**
     * Check if the user can add more transactions this month.
     */
    const canAddTransaction = (monthlyCount: number): boolean => {
        return monthlyCount < limits.maxTransactionsPerMonth;
    };

    /**
     * Check if the user can add more customers.
     */
    const canAddCustomer = (currentCount: number): boolean => {
        return currentCount < limits.maxCustomers;
    };

    /**
     * Show a "Coming Soon" alert for payment buttons.
     * This is the placeholder before Razorpay integration.
     */
    const showUpgradePrompt = () => {
        Alert.alert(
            '🚀 Payments Coming Soon!',
            'We\'re integrating Razorpay payments. Upgrade functionality will be available in the next update.\n\nFree plan users can continue using all features with soft limits.',
            [{ text: 'OK, Got it!' }]
        );
    };

    /**
     * Show a soft limit warning when user approaches or hits a limit.
     */
    const showLimitWarning = (featureName: string, navigation?: any) => {
        Alert.alert(
            `📊 ${featureName} Limit Reached`,
            `You've reached the ${plan} plan limit for ${featureName.toLowerCase()}. Upgrade to unlock more!`,
            [
                { text: 'Later', style: 'cancel' },
                {
                    text: 'View Plans',
                    onPress: () => navigation?.navigate('Subscription'),
                },
            ]
        );
    };

    return {
        // State
        subscription,
        plan,
        limits,
        isLoading,
        isError,
        refetch,

        // Plan checks
        isFreePlan,
        isBasicPlan,
        isProPlan,
        isPaidPlan,

        // Feature gates
        canUseAI,
        canAddTransaction,
        canAddCustomer,

        // Actions
        showUpgradePrompt,
        showLimitWarning,
        cancelMutation,
    };
}
