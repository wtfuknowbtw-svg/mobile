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
} from 'react-native';
import { COLORS } from '../constants';
import { useSubscription } from '../hooks/useSubscription';

const THEME = {
    primary: COLORS.primary,
    primaryLight: COLORS.primaryLight,
    secondary: COLORS.secondary,
    secondaryLight: COLORS.secondaryLight,
    bg: COLORS.background,
    cardBg: COLORS.card,
    textPrimary: COLORS.text,
    textSecondary: COLORS.textMuted,
    textMuted: COLORS.textMuted,
    border: COLORS.border,
    borderLight: '#F3F4F6',
};

// ─── Plan Configurations ────────────────────────────────
const PLANS = {
    basic: {
        name: 'Basic',
        monthlyPrice: 299,
        yearlyPrice: 2499,
        yearlySavings: 1089,
        features: [
            { text: '500 transactions/month', included: true },
            { text: '100 customers', included: true },
            { text: '25 AI scans/day', included: true },
            { text: 'Business reports', included: true },
            { text: 'WhatsApp reminders', included: false },
            { text: 'Data export (CSV)', included: false },
            { text: 'Priority support', included: false },
        ],
    },
    pro: {
        name: 'Pro',
        monthlyPrice: 499,
        yearlyPrice: 3999,
        yearlySavings: 1989,
        features: [
            { text: 'Unlimited transactions', included: true },
            { text: 'Unlimited customers', included: true },
            { text: 'Unlimited AI scans', included: true },
            { text: 'Advanced reports', included: true },
            { text: 'WhatsApp reminders', included: true },
            { text: 'Data export (CSV/PDF)', included: true },
            { text: 'Priority support', included: true },
        ],
    },
};

interface SubscriptionScreenProps {
    navigation: any;
}

export default function SubscriptionScreen({ navigation }: SubscriptionScreenProps) {
    const { subscription, plan: currentPlan, isLoading, showUpgradePrompt } = useSubscription();
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

    const handleSelectPlan = (planKey: 'basic' | 'pro') => {
        showUpgradePrompt();
    };

    const handleRestore = () => {
        Alert.alert(
            'Restore Purchases',
            'Purchase restoration will be available once Razorpay integration is complete.',
            [{ text: 'OK' }]
        );
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: THEME.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: THEME.bg }}>
            <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

            {/* ─── Header ─────────────────────────────────────── */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingTop: Platform.OS === 'ios' ? 56 : 42,
                    paddingHorizontal: 20,
                    paddingBottom: 16,
                    backgroundColor: THEME.cardBg,
                    borderBottomWidth: 1,
                    borderBottomColor: THEME.borderLight,
                }}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: THEME.borderLight,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 14,
                    }}
                >
                    <Text style={{ fontSize: 18, color: THEME.textPrimary, marginTop: -1 }}>{'‹'}</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '700', color: THEME.textPrimary }}>
                    Plans & Pricing
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* ─── Billing Toggle ─────────────────────────── */}
                <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 20 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            backgroundColor: '#F3F4F6',
                            borderRadius: 20,
                            padding: 3,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setBillingInterval('month')}
                            activeOpacity={0.7}
                            style={{
                                paddingHorizontal: 20,
                                paddingVertical: 8,
                                borderRadius: 17,
                                backgroundColor: billingInterval === 'month' ? THEME.cardBg : 'transparent',
                                ...(billingInterval === 'month'
                                    ? {
                                          shadowColor: '#000',
                                          shadowOffset: { width: 0, height: 1 },
                                          shadowOpacity: 0.08,
                                          shadowRadius: 3,
                                          elevation: 2,
                                      }
                                    : {}),
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: '600',
                                    color: billingInterval === 'month' ? THEME.textPrimary : THEME.textMuted,
                                }}
                            >
                                Monthly
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setBillingInterval('year')}
                            activeOpacity={0.7}
                            style={{
                                paddingHorizontal: 20,
                                paddingVertical: 8,
                                borderRadius: 17,
                                backgroundColor: billingInterval === 'year' ? THEME.cardBg : 'transparent',
                                flexDirection: 'row',
                                alignItems: 'center',
                                ...(billingInterval === 'year'
                                    ? {
                                          shadowColor: '#000',
                                          shadowOffset: { width: 0, height: 1 },
                                          shadowOpacity: 0.08,
                                          shadowRadius: 3,
                                          elevation: 2,
                                      }
                                    : {}),
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: '600',
                                    color: billingInterval === 'year' ? THEME.textPrimary : THEME.textMuted,
                                }}
                            >
                                Yearly
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── Current Plan Indicator ─────────────────── */}
                {currentPlan !== 'free' && (
                    <View
                        style={{
                            alignSelf: 'center',
                            backgroundColor: THEME.secondaryLight,
                            paddingHorizontal: 14,
                            paddingVertical: 5,
                            borderRadius: 14,
                            marginBottom: 12,
                        }}
                    >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: THEME.secondary }}>
                            Currently on {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan
                        </Text>
                    </View>
                )}

                {/* ─── Free Plan Row ─────────────────────────── */}
                <View
                    style={{
                        marginHorizontal: 20,
                        backgroundColor: THEME.cardBg,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: currentPlan === 'free' ? THEME.primary : THEME.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        elevation: 1,
                    }}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: THEME.textPrimary }}>Free</Text>
                            <Text style={{ fontSize: 12, color: THEME.textSecondary, marginTop: 2 }}>
                                50 txns/mo  ·  10 customers  ·  3 AI scans/day
                            </Text>
                        </View>
                        {currentPlan === 'free' && (
                            <View
                                style={{
                                    backgroundColor: THEME.secondaryLight,
                                    paddingHorizontal: 10,
                                    paddingVertical: 3,
                                    borderRadius: 10,
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '600', color: THEME.secondary }}>Current</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ─── Plan Cards ─────────────────────────────── */}
                {(['basic', 'pro'] as const).map((planKey) => {
                    const planConfig = PLANS[planKey];
                    const isCurrentPlan = currentPlan === planKey;
                    const isRecommended = planKey === 'pro';
                    const price =
                        billingInterval === 'month' ? planConfig.monthlyPrice : planConfig.yearlyPrice;
                    const includedFeatures = planConfig.features.filter((f) => f.included);

                    return (
                        <View
                            key={planKey}
                            style={{
                                marginHorizontal: 20,
                                marginBottom: 12,
                                borderRadius: 14,
                                backgroundColor: THEME.cardBg,
                                borderWidth: isRecommended ? 1.5 : 1,
                                borderColor: isRecommended ? THEME.primary : THEME.border,
                                overflow: 'hidden',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: isRecommended ? 0.08 : 0.04,
                                shadowRadius: isRecommended ? 8 : 4,
                                elevation: isRecommended ? 3 : 1,
                            }}
                        >
                            <View style={{ padding: 20 }}>
                                {/* Plan header row */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: 16,
                                    }}
                                >
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: '700',
                                                    color: THEME.textPrimary,
                                                }}
                                            >
                                                {planConfig.name}
                                            </Text>
                                            {isRecommended && (
                                                <View
                                                    style={{
                                                        backgroundColor: THEME.secondaryLight,
                                                        borderWidth: 1,
                                                        borderColor: THEME.secondary,
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 2,
                                                        borderRadius: 10,
                                                        marginLeft: 8,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 10,
                                                            fontWeight: '700',
                                                            color: THEME.secondary,
                                                        }}
                                                    >
                                                        Recommended
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        {isCurrentPlan && (
                                            <View
                                                style={{
                                                    backgroundColor: THEME.secondaryLight,
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 2,
                                                    borderRadius: 8,
                                                    marginTop: 4,
                                                    alignSelf: 'flex-start',
                                                }}
                                            >
                                                <Text style={{ fontSize: 10, fontWeight: '600', color: THEME.secondary }}>
                                                    Active
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                            <Text
                                                style={{
                                                    fontSize: 26,
                                                    fontWeight: '800',
                                                    color: THEME.textPrimary,
                                                }}
                                            >
                                                {'\u20B9'}{price}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    color: THEME.textMuted,
                                                    marginLeft: 2,
                                                    fontWeight: '400',
                                                }}
                                            >
                                                /{billingInterval === 'month' ? 'mo' : 'yr'}
                                            </Text>
                                        </View>
                                        {billingInterval === 'year' && (
                                            <View
                                                style={{
                                                    backgroundColor: THEME.secondaryLight,
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 2,
                                                    borderRadius: 8,
                                                    marginTop: 4,
                                                }}
                                            >
                                                <Text style={{ fontSize: 11, fontWeight: '600', color: THEME.secondary }}>
                                                    Save {'\u20B9'}{planConfig.yearlySavings.toLocaleString('en-IN')}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Divider */}
                                <View
                                    style={{
                                        height: 1,
                                        backgroundColor: THEME.borderLight,
                                        marginBottom: 14,
                                    }}
                                />

                                {/* Features List — only show included features */}
                                <View style={{ marginBottom: 18 }}>
                                    {includedFeatures.map((feature, i) => (
                                        <View
                                            key={i}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginBottom: 10,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: THEME.primary,
                                                    fontWeight: '600',
                                                    marginRight: 10,
                                                    width: 18,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {'\u2713'}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    color: THEME.textSecondary,
                                                    fontWeight: '400',
                                                }}
                                            >
                                                {feature.text}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* CTA Button */}
                                <TouchableOpacity
                                    onPress={() => handleSelectPlan(planKey)}
                                    disabled={isCurrentPlan}
                                    activeOpacity={0.85}
                                    style={{
                                        backgroundColor: isCurrentPlan ? THEME.borderLight : THEME.primary,
                                        borderRadius: 10,
                                        paddingVertical: 13,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontWeight: '700',
                                            color: isCurrentPlan ? THEME.textMuted : '#FFFFFF',
                                        }}
                                    >
                                        {isCurrentPlan ? 'Current Plan' : `Get ${planConfig.name}`}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}

                {/* ─── Restore Link ───────────────────────────── */}
                <TouchableOpacity
                    onPress={handleRestore}
                    style={{ alignSelf: 'center', paddingVertical: 12 }}
                >
                    <Text style={{ fontSize: 13, color: THEME.textSecondary, fontWeight: '500' }}>
                        Restore Purchases
                    </Text>
                </TouchableOpacity>

                {/* ─── Trust Bar ──────────────────────────────── */}
                <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 8 }}>
                    <Text style={{ fontSize: 11, color: THEME.textMuted, textAlign: 'center' }}>
                        Secured by Razorpay  ·  Cancel anytime
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
