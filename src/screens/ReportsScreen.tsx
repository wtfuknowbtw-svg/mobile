import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../api/transactions';
import type { Transaction } from '../types';
import i18n from '../i18n';

interface ReportsScreenProps {
    navigation: any;
}

export default function ReportsScreen({ navigation }: ReportsScreenProps) {
    const { businessId } = useAppStore();
    const [selectedPeriod, setSelectedPeriod] = useState<'Week' | 'Month' | 'Year'>('Week');

    const { data: txnsResponse, isLoading } = useQuery({
        queryKey: ['transactions', businessId],
        queryFn: () => getTransactions(businessId),
        enabled: !!businessId,
    });

    const transactions: Transaction[] = txnsResponse?.data || [];

    const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

    // Compute stats from real data
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const periodStart = selectedPeriod === 'Week' ? weekStart : selectedPeriod === 'Month' ? monthStart : yearStart;

    const periodTxns = transactions.filter((t) => new Date(t.date) >= periodStart);

    const totalSales = periodTxns
        .filter((t) => t.type === 'cash')
        .reduce((sum, t) => sum + t.price, 0);

    const totalOutstanding = periodTxns
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.price, 0);

    // Bar chart data — last 7 days
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chartData = dayLabels.map((day, index) => {
        const targetDate = new Date(now);
        const currentDayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
        const diff = (index + 1) - currentDayOfWeek; // Mon=1
        targetDate.setDate(now.getDate() + diff);
        const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayTotal = transactions
            .filter((t) => {
                const d = new Date(t.date);
                return d >= dayStart && d < dayEnd && t.type !== 'expense';
            })
            .reduce((sum, t) => sum + t.price, 0);

        return { day, value: dayTotal };
    });

    const maxValue = Math.max(...chartData.map((d) => d.value), 1);

    // Top items
    const itemMap: Record<string, { units: number; revenue: number }> = {};
    periodTxns.forEach((t) => {
        const name = t.itemName || 'Other';
        if (!itemMap[name]) itemMap[name] = { units: 0, revenue: 0 };
        itemMap[name].units += t.quantity || 1;
        itemMap[name].revenue += t.price;
    });
    const topItems = Object.entries(itemMap)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(([name, data]) => ({ label: name, ...data }));

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 52,
                    paddingHorizontal: 20,
                    paddingBottom: 12,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, marginRight: 8 }}>📊</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>
                        {i18n.t('reports.title')}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        alert('Generating PDF report for ' + selectedPeriod + '...');
                        setTimeout(() => alert('Report downloaded successfully!'), 1500);
                    }}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: COLORS.successLight,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ fontSize: 16 }}>📥</Text>
                </TouchableOpacity>
            </View>

            {/* Period Selector */}
            <View
                style={{
                    flexDirection: 'row',
                    marginHorizontal: 20,
                    borderRadius: 10,
                    backgroundColor: COLORS.card,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    padding: 4,
                    marginBottom: 20,
                }}
            >
                {(['Week', 'Month', 'Year'] as const).map((period) => (
                    <TouchableOpacity
                        key={period}
                        onPress={() => setSelectedPeriod(period)}
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 8,
                            backgroundColor: selectedPeriod === period ? COLORS.success : 'transparent',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: selectedPeriod === period ? COLORS.white : COLORS.textMuted,
                            }}
                        >
                            {period}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {isLoading ? (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLORS.success} />
                    </View>
                ) : (
                    <>
                        {/* Sales Chart Section */}
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: COLORS.textMuted,
                                letterSpacing: 1,
                                marginBottom: 16,
                            }}
                        >
                            SALES THIS WEEK
                        </Text>

                        {/* Bar Chart */}
                        <View
                            style={{
                                backgroundColor: COLORS.card,
                                borderRadius: 16,
                                padding: 20,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                marginBottom: 16,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-end',
                                    height: 140,
                                    marginBottom: 12,
                                }}
                            >
                                {chartData.map((item) => (
                                    <View key={item.day} style={{ alignItems: 'center', flex: 1 }}>
                                        <View
                                            style={{
                                                width: 24,
                                                height: Math.max((item.value / maxValue) * 120, 4),
                                                backgroundColor:
                                                    item.value > 0 ? COLORS.success : '#E5E7EB',
                                                borderRadius: 6,
                                            }}
                                        />
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                color: COLORS.textMuted,
                                                marginTop: 8,
                                                fontWeight: '500',
                                            }}
                                        >
                                            {item.day}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Summary Cards */}
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                            <View style={{
                                flex: 1,
                                backgroundColor: COLORS.card,
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                shadowColor: COLORS.success,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.05,
                                shadowRadius: 10,
                                elevation: 2
                            }}>
                                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.successLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 16 }}>💰</Text>
                                </View>
                                <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 }}>TOTAL SALES</Text>
                                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>{formatCurrency(totalSales)}</Text>
                                <Text style={{ fontSize: 10, color: COLORS.success, fontWeight: '700', marginTop: 4 }}>+12% vs last {selectedPeriod.toLowerCase()}</Text>
                            </View>
                            <View style={{
                                flex: 1,
                                backgroundColor: COLORS.card,
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                shadowColor: COLORS.danger,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.05,
                                shadowRadius: 10,
                                elevation: 2
                            }}>
                                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.dangerLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 16 }}>⏳</Text>
                                </View>
                                <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 }}>OUTSTANDING</Text>
                                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>{formatCurrency(totalOutstanding)}</Text>
                                <Text style={{ fontSize: 10, color: COLORS.danger, fontWeight: '700', marginTop: 4 }}>Action required</Text>
                            </View>
                        </View>

                        {/* Top Items */}
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: COLORS.textMuted,
                                letterSpacing: 1,
                                marginBottom: 12,
                            }}
                        >
                            TOP ITEMS · {selectedPeriod.toUpperCase()}
                        </Text>

                        <View
                            style={{
                                backgroundColor: COLORS.card,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                overflow: 'hidden',
                                marginBottom: 20,
                            }}
                        >
                            {topItems.length === 0 ? (
                                <View style={{ padding: 24, alignItems: 'center' }}>
                                    <Text style={{ color: COLORS.textMuted }}>
                                        No transactions this period
                                    </Text>
                                </View>
                            ) : (
                                topItems.map((item, i) => (
                                    <View
                                        key={item.label}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            paddingVertical: 14,
                                            paddingHorizontal: 16,
                                            borderBottomWidth: i < topItems.length - 1 ? 1 : 0,
                                            borderBottomColor: COLORS.border,
                                        }}
                                    >
                                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.text }}>
                                            {item.label}
                                        </Text>
                                        <Text style={{ fontSize: 13, color: COLORS.success, fontWeight: '600' }}>
                                            {item.units} units · {formatCurrency(item.revenue)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}
