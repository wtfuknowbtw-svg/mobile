import { apiGet, apiPost } from '../lib/apiClient';

export interface SubscriptionData {
    id: string;
    plan: 'free' | 'basic' | 'pro';
    status: 'active' | 'pending' | 'cancelled' | 'expired';
    interval: 'month' | 'year';
    endsAt: string | null;
    razorpaySubscriptionId?: string;
    createdAt: string;
}

export interface CreateSubscriptionResponse {
    subscriptionId: string;
    shortUrl: string;
    plan: string;
    interval: string;
}

// Plan limits for soft-gating features
export const PLAN_LIMITS = {
    free: {
        maxTransactionsPerMonth: 50,
        maxCustomers: 10,
        aiScansPerDay: 3,
        reportsEnabled: false,
        exportEnabled: false,
    },
    basic: {
        maxTransactionsPerMonth: 500,
        maxCustomers: 100,
        aiScansPerDay: 25,
        reportsEnabled: true,
        exportEnabled: false,
    },
    pro: {
        maxTransactionsPerMonth: Infinity,
        maxCustomers: Infinity,
        aiScansPerDay: Infinity,
        reportsEnabled: true,
        exportEnabled: true,
    },
} as const;

export const getSubscription = async (): Promise<{ data?: SubscriptionData; error?: string }> => {
    const response = await apiGet<{ data: SubscriptionData }>('/subscription');

    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data };
};

export const createSubscription = async (
    plan: 'basic' | 'pro',
    interval: 'month' | 'year'
): Promise<{ data?: CreateSubscriptionResponse; error?: string }> => {
    const response = await apiPost<{ data: CreateSubscriptionResponse; message?: string }>(
        '/subscription/create',
        { plan, interval }
    );

    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data };
};

export const verifySubscription = async (
    razorpaySubscriptionId: string,
    razorpayPaymentId?: string,
    razorpaySignature?: string
): Promise<{ data?: SubscriptionData; error?: string }> => {
    const response = await apiPost<{ data: SubscriptionData; message?: string }>(
        '/subscription/verify',
        { razorpaySubscriptionId, razorpayPaymentId, razorpaySignature }
    );

    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data };
};

export const cancelSubscription = async (): Promise<{ data?: SubscriptionData; error?: string }> => {
    const response = await apiPost<{ data: SubscriptionData; message?: string }>(
        '/subscription/cancel',
        {}
    );

    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data };
};
