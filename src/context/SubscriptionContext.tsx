import React, { createContext, useContext, ReactNode } from 'react';
import { usePlan } from '../hooks/usePlan';

export interface SubscriptionContextType {
  // Current plan and usage
  plan: 'free' | 'pro' | 'business';
  usage: {
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
  };
  features: {
    aiFeatures: boolean;
    multipleStaff: boolean;
    unlimitedTransactions: boolean;
    unlimitedCustomers: boolean;
  };
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  syncSubscriptionStatus: () => Promise<void>;
  updatePlan: (newPlan: 'free' | 'pro' | 'business') => Promise<void>;
  
  // Helper methods for plan checks
  canCreateTransaction: () => boolean;
  canCreateCustomer: () => boolean;
  hasAIFeatures: () => boolean;
  hasMultipleStaff: () => boolean;
  
  // UI helpers
  getTransactionProgress: () => number;
  getCustomerProgress: () => number;
  
  // Plan upgrade prompts
  getUpgradeMessage: (feature: string) => string;
  getUpgradeCTA: (feature: string) => string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const planHook = usePlan();

  /**
   * Get upgrade message for specific feature
   */
  const getUpgradeMessage = (feature: string): string => {
    const { plan } = planHook;
    
    if (plan === 'free') {
      switch (feature) {
        case 'ai':
          return 'AI OCR and voice features require Pro plan';
        case 'transactions':
          return 'You\'ve reached the free plan limit of 50 transactions';
        case 'customers':
          return 'You\'ve reached the free plan limit of 10 customers';
        case 'staff':
          return 'Multiple staff accounts require Business plan';
        default:
          return 'This feature requires a paid plan';
      }
    } else if (plan === 'pro') {
      switch (feature) {
        case 'staff':
          return 'Multiple staff accounts require Business plan';
        default:
          return 'This feature is not available on your current plan';
      }
    }
    
    return 'This feature is not available on your current plan';
  };

  /**
   * Get call-to-action text for upgrade
   */
  const getUpgradeCTA = (feature: string): string => {
    const { plan } = planHook;
    
    if (plan === 'free') {
      switch (feature) {
        case 'ai':
        case 'transactions':
        case 'customers':
          return 'Upgrade to Pro';
        case 'staff':
          return 'Upgrade to Business';
        default:
          return 'Upgrade Plan';
      }
    } else if (plan === 'pro') {
      if (feature === 'staff') {
        return 'Upgrade to Business';
      }
    }
    
    return 'Upgrade Plan';
  };

  const contextValue: SubscriptionContextType = {
    plan: planHook.plan || 'free',
    usage: planHook.usage || {
      transactions: { current: 0, limit: 50, remaining: 50, isLimitReached: false },
      customers: { current: 0, limit: 10, remaining: 10, isLimitReached: false },
    },
    features: planHook.features || {
      aiFeatures: false,
      multipleStaff: false,
      unlimitedTransactions: false,
      unlimitedCustomers: false,
    },
    isLoading: planHook.isLoading || false,
    error: planHook.error || null,
    syncSubscriptionStatus: planHook.syncSubscriptionStatus,
    updatePlan: planHook.updatePlan,
    canCreateTransaction: planHook.canCreateTransaction,
    canCreateCustomer: planHook.canCreateCustomer,
    hasAIFeatures: planHook.hasAIFeatures,
    hasMultipleStaff: planHook.hasMultipleStaff,
    getTransactionProgress: planHook.getTransactionProgress,
    getCustomerProgress: planHook.getCustomerProgress,
    getUpgradeMessage,
    getUpgradeCTA,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to use subscription context
 */
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

/**
 * HOC to wrap components with plan-based gating
 */
export function withPlanGate<T extends object>(
  Component: React.ComponentType<T>,
  requiredPlan: 'free' | 'pro' | 'business',
  fallbackComponent?: React.ComponentType<{ onUpgrade: () => void }>
) {
  return function PlanGateComponent(props: T) {
    const { plan, getUpgradeMessage, getUpgradeCTA } = useSubscription();
    
    const planHierarchy = { free: 0, pro: 1, business: 2 };
    const userLevel = planHierarchy[plan];
    const requiredLevel = planHierarchy[requiredPlan];
    
    if (userLevel < requiredLevel) {
      if (fallbackComponent) {
        const Fallback = fallbackComponent;
        return <Fallback onUpgrade={() => {}} />;
      }
      
      // Default fallback
      return (
        <div style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20 
        }}>
          <p style={{ 
            textAlign: 'center', 
            marginBottom: 16, 
            color: '#666' 
          }}>
            {getUpgradeMessage(requiredPlan)}
          </p>
          <button
            onClick={() => {
              // Navigate to upgrade screen
              console.log('Navigate to upgrade screen');
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#057A55',
              color: 'white',
              border: 'none',
              borderRadius: 8,
            }}
          >
            {getUpgradeCTA(requiredPlan)}
          </button>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}
