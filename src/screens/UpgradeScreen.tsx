import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../constants';
import { useSubscription } from '../context/SubscriptionContext';
import { useAppStore } from '../store/useAppStore';
import { apiGet, apiPost } from '../lib/apiClient';

interface PlanData {
  plan: 'free' | 'pro' | 'business';
  name: string;
  description: string;
  price: string;
  features: {
    transactions: string;
    customers: string;
    aiFeatures: string;
    staff: string;
  };
  isCurrentPlan: boolean;
  canUpgrade: boolean;
}

export default function UpgradeScreen({ navigation }: any) {
  const { plan: currentPlan, updatePlan, syncSubscriptionStatus } = useSubscription();
  const { token, setToken } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<PlanData[]>([]);

  React.useEffect(() => {
    loadUpgradeOptions();
  }, []);

  const loadUpgradeOptions = async () => {
    if (!token) {
      console.log('No token, skipping upgrade options load');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiGet<any>('/subscription/upgrade');
      if (response.error) {
        throw new Error(response.error);
      }

      setAvailablePlans(response.data.availablePlans);
    } catch (error: any) {
      console.error('Error loading upgrade options:', error);
      Alert.alert('Error', 'Failed to load upgrade options');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (selectedPlan: 'free' | 'pro' | 'business') => {
    if (selectedPlan === currentPlan) {
      Alert.alert('Info', 'You are already on this plan');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiPost<any>('/subscription/upgrade', {
        plan: selectedPlan,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update token with new plan
      if (response.data.newToken) {
        setToken(response.data.newToken);
      }

      // Update local plan state
      await updatePlan(selectedPlan);
      
      // Sync subscription status to get updated usage
      await syncSubscriptionStatus();

      Alert.alert(
        'Success',
        `Successfully ${response.data.message}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      Alert.alert('Error', error.message || 'Failed to upgrade plan');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlanCard = (planData: PlanData) => {
    const isCurrentPlan = planData.isCurrentPlan;
    const canUpgrade = planData.canUpgrade;
    const isUpgrade = planData.plan !== currentPlan && canUpgrade;

    return (
      <View
        key={planData.plan}
        style={[
          styles.planCard,
          isCurrentPlan && styles.currentPlanCard,
          isUpgrade && styles.upgradeCard,
        ]}
      >
        <View style={styles.planHeader}>
          <Text style={[styles.planName, isCurrentPlan && styles.currentPlanName]}>
            {planData.name}
          </Text>
          {isCurrentPlan && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current Plan</Text>
            </View>
          )}
        </View>

        <Text style={styles.planDescription}>{planData.description}</Text>
        <Text style={[styles.planPrice, isCurrentPlan && styles.currentPlanPrice]}>
          {planData.price}
        </Text>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>Transactions: {planData.features.transactions}</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>Customers: {planData.features.customers}</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>AI Features: {planData.features.aiFeatures}</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>Staff Accounts: {planData.features.staff}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.upgradeButton,
            isCurrentPlan && styles.currentButton,
            isUpgrade && styles.upgradeButton,
          ]}
          onPress={() => handleUpgrade(planData.plan)}
          disabled={!canUpgrade || isLoading}
        >
          {isLoading && planData.plan !== currentPlan ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text
              style={[
                styles.upgradeButtonText,
                isCurrentPlan && styles.currentButtonText,
              ]}
            >
              {isCurrentPlan ? 'Current Plan' : canUpgrade ? 'Upgrade' : 'Not Available'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade Plan</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Choose your plan</Text>
          <Text style={styles.introDescription}>
          Upgrade to unlock more features and grow your business
        </Text>
        </View>

        {isLoading && availablePlans.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {availablePlans.map(renderPlanCard)}
          </View>
        )}

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            Plans can be changed at any time. Downgrades take effect at the next billing cycle.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  introDescription: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  currentPlanCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  upgradeCard: {
    borderColor: '#057A55',
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  currentPlanName: {
    color: '#057A55',
  },
  currentBadge: {
    backgroundColor: '#057A55',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 20,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  currentPlanPrice: {
    color: '#057A55',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  currentButton: {
    backgroundColor: '#057A55',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  currentButtonText: {
    color: 'white',
  },
  footerNote: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
