import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/useAppStore';
import { apiGet } from '../lib/apiClient';

export interface PlanUsage {
  transactions: {
    current: number;
    limit: number;
    remaining: number;
    isLimitReached: boolean;
  };
  customers: {
    current: number;
    limit: number;
    remaining: number;
    isLimitReached: boolean;
  };
}

export interface PlanFeatures {
  aiFeatures: boolean;
  multipleStaff: boolean;
  unlimitedTransactions: boolean;
  unlimitedCustomers: boolean;
}

export interface SubscriptionStatus {
  plan: 'free' | 'pro' | 'business';
  usage: PlanUsage;
  features: PlanFeatures;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEYS = {
  PLAN: 'apna-khata-plan',
  USAGE_STATS: 'apna-khata-usage-stats',
  LAST_SYNC: 'apna-khata-last-sync',
} as const;

/**
 * Hook to manage subscription plan state
 * Reads from AsyncStorage and syncs with backend
 */
export function usePlan() {
  const { token, businessId } = useAppStore();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    plan: 'free',
    usage: {
      transactions: { current: 0, limit: 50, remaining: 50, isLimitReached: false },
      customers: { current: 0, limit: 10, remaining: 10, isLimitReached: false },
    },
    features: {
      aiFeatures: false,
      multipleStaff: false,
      unlimitedTransactions: false,
      unlimitedCustomers: false,
    },
    isLoading: false,
    error: null,
  });

  /**
   * Load plan from AsyncStorage
   */
  const loadPlanFromStorage = async (): Promise<SubscriptionStatus | null> => {
    try {
      const [planData, usageData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PLAN),
        AsyncStorage.getItem(STORAGE_KEYS.USAGE_STATS),
      ]);

      if (planData && usageData) {
        const plan = JSON.parse(planData) as 'free' | 'pro' | 'business';
        const usage = JSON.parse(usageData) as PlanUsage;
        
        return {
          plan,
          usage,
          features: getPlanFeatures(plan),
          isLoading: false,
          error: null,
        };
      }
    } catch (error) {
      console.error('Error loading plan from storage:', error);
    }
    return null;
  };

  /**
   * Save plan to AsyncStorage
   */
  const savePlanToStorage = async (status: SubscriptionStatus) => {
    try {
      // Guard against undefined/null values — AsyncStorage throws if value is null/undefined
      const plan = status.plan ?? 'free';
      const usage = status.usage ?? {
        transactions: { current: 0, limit: 50, remaining: 50, isLimitReached: false },
        customers: { current: 0, limit: 10, remaining: 10, isLimitReached: false },
      };

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan)),
        AsyncStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(usage)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString()),
      ]);
    } catch (error) {
      console.error('Error saving plan to storage:', error);
    }
  };

  /**
   * Sync subscription status with backend
   */
  const syncSubscriptionStatus = async () => {
    if (!token || !businessId) {
      console.log('No token or businessId, skipping sync');
      return;
    }

    setSubscriptionStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Syncing subscription status...');
      const response = await apiGet<any>('/subscription/status');
      
      if (response.error) {
        throw new Error(response.error);
      }

      // The backend returns { data: { plan, usage, features, ... } }
      // and apiGet wraps the whole JSON as { data: <json> }
      // So the actual fields are at response.data.data
      const payload = response.data?.data ?? response.data;

      const fullStatus: SubscriptionStatus = {
        plan: payload?.plan ?? 'free',
        usage: payload?.usage ?? {
          transactions: { current: 0, limit: 50, remaining: 50, isLimitReached: false },
          customers: { current: 0, limit: 10, remaining: 10, isLimitReached: false },
        },
        features: payload?.features ?? getPlanFeatures(payload?.plan ?? 'free'),
        isLoading: false,
        error: null,
      };

      setSubscriptionStatus(fullStatus);
      await savePlanToStorage(fullStatus);
      
      console.log('Subscription status synced:', newStatus);
    } catch (error: any) {
      console.error('Error syncing subscription status:', error);
      
      // Fallback to mock data for various error scenarios
      const needsFallback = 
        error.message?.includes('404') || 
        error.message?.includes('non-JSON response') ||
        error.message?.includes('Invalid or expired token') ||
        error.message?.includes('Failed to fetch subscription status') ||
        error.message?.includes('500');
      
      if (needsFallback) {
        console.log('Using mock subscription data due to API error:', error.message);
        const mockStatus: SubscriptionStatus = {
          plan: 'free',
          usage: {
            transactions: { current: 25, limit: 50, remaining: 25, isLimitReached: false },
            customers: { current: 5, limit: 10, remaining: 5, isLimitReached: false },
          },
          features: {
            aiFeatures: false,
            multipleStaff: false,
            unlimitedTransactions: false,
            unlimitedCustomers: false,
          },
          isLoading: false,
          error: null,
        };
        
        setSubscriptionStatus(mockStatus);
        await savePlanToStorage(mockStatus);
        console.log('Mock subscription data set successfully');
        return;
      }
      
      setSubscriptionStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to sync subscription status',
      }));
    }
  };

  /**
   * Update plan (after upgrade/downgrade)
   */
  const updatePlan = async (newPlan: 'free' | 'pro' | 'business') => {
    const newStatus: SubscriptionStatus = {
      ...subscriptionStatus,
      plan: newPlan,
      features: getPlanFeatures(newPlan),
    };

    setSubscriptionStatus(newStatus);
    await savePlanToStorage(newStatus);
  };

  /**
   * Check if user can perform action based on plan
   */
  const canCreateTransaction = (): boolean => {
    const { usage, plan } = subscriptionStatus;
    return plan !== 'free' || !usage.transactions.isLimitReached;
  };

  const canCreateCustomer = (): boolean => {
    const { usage, plan } = subscriptionStatus;
    return plan !== 'free' || !usage.customers.isLimitReached;
  };

  const hasAIFeatures = (): boolean => {
    return subscriptionStatus.features.aiFeatures;
  };

  const hasMultipleStaff = (): boolean => {
    return subscriptionStatus.features.multipleStaff;
  };

  /**
   * Get progress percentage for UI
   */
  const getTransactionProgress = (): number => {
    const { usage } = subscriptionStatus;
    if (usage.transactions.limit === Infinity) return 100;
    return Math.min((usage.transactions.current / usage.transactions.limit) * 100, 100);
  };

  const getCustomerProgress = (): number => {
    const { usage } = subscriptionStatus;
    if (usage.customers.limit === Infinity) return 100;
    return Math.min((usage.customers.current / usage.customers.limit) * 100, 100);
  };

  // Load from storage on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const storedStatus = await loadPlanFromStorage();
      if (storedStatus) {
        setSubscriptionStatus(storedStatus);
      }
      
      // Sync with backend if we have token
      if (token && businessId) {
        await syncSubscriptionStatus();
      }
    };

    loadInitialData();
  }, [token, businessId]);

  return {
    ...subscriptionStatus,
    syncSubscriptionStatus,
    updatePlan,
    canCreateTransaction,
    canCreateCustomer,
    hasAIFeatures,
    hasMultipleStaff,
    getTransactionProgress,
    getCustomerProgress,
  };
}

/**
 * Helper function to get plan features
 */
function getPlanFeatures(plan: 'free' | 'pro' | 'business'): PlanFeatures {
  const features = {
    free: {
      aiFeatures: false,
      multipleStaff: false,
      unlimitedTransactions: false,
      unlimitedCustomers: false,
    },
    pro: {
      aiFeatures: true,
      multipleStaff: false,
      unlimitedTransactions: true,
      unlimitedCustomers: true,
    },
    business: {
      aiFeatures: true,
      multipleStaff: true,
      unlimitedTransactions: true,
      unlimitedCustomers: true,
    },
  };

  return features[plan];
}
