import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Share,
    Alert,
    Platform,
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

    const { data: txnsResponse, isLoading } = useQuery({
        queryKey: ['transactions', businessId],
        queryFn: () => getTransactions(businessId),
        enabled: !!businessId,
    });

    const transactions: Transaction[] = txnsResponse?.data || [];

    const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

    // Calculate stats from real data
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Today's total sales (cash transactions today)
    const todaySales = transactions
        .filter((t) => {
            const txnDate = new Date(t.date);
            return t.type === 'cash' && txnDate >= todayStart;
        })
        .reduce((sum, t) => sum + t.price, 0);

    // Total udhar outstanding
    const totalCredit = transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.price, 0);
    
    const totalPaymentsReceived = transactions
        .filter((t) => 
            (t.type === 'udhar_payment') || 
            (t.type === 'cash' && t.customerName && t.customerName !== 'Cash Sale')
        )
        .reduce((sum, t) => sum + t.price, 0);

    const totalUdharOutstanding = Math.max(0, totalCredit - totalPaymentsReceived);

    // This week's revenue (Cash + Credit, excluding expenses and payments)
    const weeklyRevenue = transactions
        .filter((t) => {
            const txnDate = new Date(t.date);
            return txnDate >= weekStart && (t.type === 'cash' || t.type === 'credit');
        })
        .reduce((sum, t) => sum + t.price, 0);

    // Top 5 customers by udhar amount
    const customerUdharMap: Record<string, number> = {};
    transactions.forEach((t) => {
        if (!t.customerName || t.customerName === 'Cash Sale') return;
        
        if (t.type === 'credit') {
            customerUdharMap[t.customerName] = (customerUdharMap[t.customerName] || 0) + t.price;
        } else if (t.type === 'cash' || t.type === 'udhar_payment') {
            customerUdharMap[t.customerName] = (customerUdharMap[t.customerName] || 0) - t.price;
        }
    });

    const topCustomersByUdhar = Object.entries(customerUdharMap)
        .filter(([, amount]) => amount > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount }));

    // Transaction count by type
    const transactionCounts = {
        cash: transactions.filter(t => t.type === 'cash').length,
        credit: transactions.filter(t => t.type === 'credit').length,
        expense: transactions.filter(t => t.type === 'expense').length,
        payment: transactions.filter(t => t.type === 'udhar_payment').length,
    };

    const totalTransactions = transactionCounts.cash + transactionCounts.credit + transactionCounts.expense + transactionCounts.payment;

    const getPercentage = (count: number) => {
        if (totalTransactions === 0) return 0;
        return Math.round((count / totalTransactions) * 100);
    };

    const handleShareKhata = async () => {
        if (isLoading) return;
        
        const dateStr = new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const topCustomersText = topCustomersByUdhar.length > 0
            ? topCustomersByUdhar.map((c, i) => `${i + 1}. ${c.name} — ${formatCurrency(c.amount)}`).join('\n')
            : i18n.t('reports.noOutstanding');

        const message = `📒 ApnaKhata Business Report\n📅 ${dateStr}\n\n` +
            `💰 Today's Sales: ${formatCurrency(todaySales)}\n` +
            `📈 This Week: ${formatCurrency(weeklyRevenue)}\n` +
            `⏳ Total Udhar: ${formatCurrency(totalUdharOutstanding)}\n\n` +
            `🏆 Top Customers (Udhar):\n${topCustomersText}\n\n` +
            `📊 Transaction Stats:\n` +
            `• Cash Sales: ${transactionCounts.cash}\n` +
            `• Udhar (Credit): ${transactionCounts.credit}\n` +
            `• Payments Recv: ${transactionCounts.payment}\n` +
            `• Expenses: ${transactionCounts.expense}\n\n` +
            `Shared via ApnaKhata App 🙏`;

        try {
            await Share.share({ 
                title: 'ApnaKhata Report',
                message 
            });
        } catch (error) {
            console.error('Error sharing khata:', error);
        }
    };

    const handleShareUdharList = async () => {
        if (isLoading) return;

        const dateStr = new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const allUdharCustomers = Object.entries(customerUdharMap)
            .filter(([, amount]) => amount > 0)
            .sort(([, a], [, b]) => b - a);

        if (allUdharCustomers.length === 0) {
            Alert.alert('Empty', 'No customers with outstanding udhar found.');
            return;
        }

        const listText = allUdharCustomers
            .map(([name, amount], i) => `${i + 1}. ${name} — ${formatCurrency(amount)}`)
            .join('\n');

        const message = `📋 Outstanding Udhar List\n📅 ${dateStr}\n\n${listText}\n\n` +
            `Total Outstanding: ${formatCurrency(totalUdharOutstanding)}\n` +
            `Total Customers: ${allUdharCustomers.length}\n\n` +
            `Shared via ApnaKhata App 🙏`;

        try {
            await Share.share({ 
                title: 'Udhar List',
                message 
            });
        } catch (error) {
            console.error('Error sharing udhar list:', error);
        }
    };

    // Empty state
    if (!isLoading && transactions.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
                
                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 52,
                    paddingHorizontal: 20,
                    paddingBottom: 12,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, marginRight: 8 }}>📊</Text>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>
                            {i18n.t('reports.title')}
                        </Text>
                    </View>
                </View>

                {/* Empty State */}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
                    <Text style={{ fontSize: 64, marginBottom: 16 }}>📈</Text>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, textAlign: 'center', marginBottom: 8 }}>
                        No transactions yet
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center' }}>
                        Start adding transactions to see your business reports here
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 52,
                paddingHorizontal: 20,
                paddingBottom: 16,
                backgroundColor: COLORS.background,
                zIndex: 10,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 22, marginRight: 10 }}>📊</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>
                        {i18n.t('reports.title')}
                    </Text>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                        onPress={handleShareUdharList}
                        disabled={isLoading}
                        activeOpacity={0.7}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: COLORS.card,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2,
                        }}
                    >
                        <Text style={{ fontSize: 18 }}>👥</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleShareKhata}
                        disabled={isLoading}
                        activeOpacity={0.7}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: COLORS.successLight,
                            borderWidth: 1,
                            borderColor: COLORS.success + '20',
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: COLORS.success,
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 2,
                            elevation: 2,
                        }}
                    >
                        <Text style={{ fontSize: 18 }}>📤</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                style={{ flex: 1, paddingHorizontal: 20 }} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {isLoading ? (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLORS.success} />
                        <Text style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 12 }}>
                            Loading reports...
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Premium Sharing Banner */}
                        <View style={{
                            backgroundColor: COLORS.primaryLight,
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 20,
                            borderWidth: 1,
                            borderColor: COLORS.primary + '20',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary }}>
                                    Export & Share Report
                                </Text>
                                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                                    Share a professionally formatted summary with anyone.
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleShareKhata}
                                style={{
                                    backgroundColor: COLORS.primary,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 10,
                                }}
                            >
                                <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 13 }}>Share Now</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Today's Sales */}
                        <View style={{
                            backgroundColor: COLORS.card,
                            borderRadius: 16,
                            padding: 20,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            marginBottom: 16,
                            shadowColor: COLORS.success,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 8,
                            elevation: 2,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    backgroundColor: COLORS.successLight,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12,
                                }}>
                                    <Text style={{ fontSize: 20 }}>💰</Text>
                                </View>
                                <View>
                                    <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600' }}>
                                        TODAY'S SALES
                                    </Text>
                                    <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text }}>
                                        {formatCurrency(todaySales)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Udhar Outstanding */}
                        <View style={{
                            backgroundColor: COLORS.card,
                            borderRadius: 16,
                            padding: 20,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            marginBottom: 16,
                            shadowColor: COLORS.danger,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 8,
                            elevation: 2,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    backgroundColor: COLORS.dangerLight,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12,
                                }}>
                                    <Text style={{ fontSize: 20 }}>⏳</Text>
                                </View>
                                <View>
                                    <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600' }}>
                                        TOTAL UDHAR OUTSTANDING
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                        <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.danger }}>
                                            {formatCurrency(totalUdharOutstanding)}
                                        </Text>
                                        <Text style={{ marginLeft: 8, fontSize: 12, color: COLORS.textMuted }}>
                                            ({topCustomersByUdhar.length} customers)
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* This Week's Revenue */}
                        <View style={{
                            backgroundColor: COLORS.card,
                            borderRadius: 16,
                            padding: 20,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            marginBottom: 16,
                            shadowColor: COLORS.primary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 8,
                            elevation: 2,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    backgroundColor: COLORS.primaryLight,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12,
                                }}>
                                    <Text style={{ fontSize: 20 }}>📈</Text>
                                </View>
                                <View>
                                    <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600' }}>
                                        THIS WEEK'S REVENUE
                                    </Text>
                                    <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text }}>
                                        {formatCurrency(weeklyRevenue)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Transaction Type Breakdown */}
                        <Text style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: COLORS.textMuted,
                            letterSpacing: 1,
                            marginBottom: 12,
                            marginTop: 8,
                        }}>
                            TRANSACTION BREAKDOWN
                        </Text>

                        <View style={{
                            backgroundColor: COLORS.card,
                            borderRadius: 16,
                            padding: 20,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            marginBottom: 16,
                        }}>
                            <View style={{ marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 16, marginRight: 8 }}>💵</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.text }}>
                                            Cash Sales
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>
                                        {transactionCounts.cash} ({getPercentage(transactionCounts.cash)}%)
                                    </Text>
                                </View>
                                <View style={{
                                    height: 8,
                                    backgroundColor: COLORS.border,
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                }}>
                                    <View style={{
                                        height: '100%',
                                        width: `${getPercentage(transactionCounts.cash)}%`,
                                        backgroundColor: COLORS.success,
                                        borderRadius: 4,
                                    }} />
                                </View>
                            </View>

                            <View style={{ marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 16, marginRight: 8 }}>🏦</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.text }}>
                                            Payments Received
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                                        {transactionCounts.payment} ({getPercentage(transactionCounts.payment)}%)
                                    </Text>
                                </View>
                                <View style={{
                                    height: 8,
                                    backgroundColor: COLORS.border,
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                }}>
                                    <View style={{
                                        height: '100%',
                                        width: `${getPercentage(transactionCounts.payment)}%`,
                                        backgroundColor: COLORS.primary,
                                        borderRadius: 4,
                                    }} />
                                </View>
                            </View>

                            <View style={{ marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 16, marginRight: 8 }}>🤝</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.text }}>
                                            Udhar (Credit)
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.warning }}>
                                        {transactionCounts.credit} ({getPercentage(transactionCounts.credit)}%)
                                    </Text>
                                </View>
                                <View style={{
                                    height: 8,
                                    backgroundColor: COLORS.border,
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                }}>
                                    <View style={{
                                        height: '100%',
                                        width: `${getPercentage(transactionCounts.credit)}%`,
                                        backgroundColor: COLORS.warning,
                                        borderRadius: 4,
                                    }} />
                                </View>
                            </View>

                            <View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 16, marginRight: 8 }}>💸</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.text }}>
                                            Expenses
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.danger }}>
                                        {transactionCounts.expense} ({getPercentage(transactionCounts.expense)}%)
                                    </Text>
                                </View>
                                <View style={{
                                    height: 8,
                                    backgroundColor: COLORS.border,
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                }}>
                                    <View style={{
                                        height: '100%',
                                        width: `${getPercentage(transactionCounts.expense)}%`,
                                        backgroundColor: COLORS.danger,
                                        borderRadius: 4,
                                    }} />
                                </View>
                            </View>
                        </View>

                        {/* Top 5 Customers by Udhar */}
                        <Text style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: COLORS.textMuted,
                            letterSpacing: 1,
                            marginBottom: 12,
                            marginTop: 8,
                        }}>
                            TOP 5 CUSTOMERS BY UDHAR
                        </Text>

                        <View style={{
                            backgroundColor: COLORS.card,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            overflow: 'hidden',
                            marginBottom: 20,
                        }}>
                            {topCustomersByUdhar.length === 0 ? (
                                <View style={{ padding: 24, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 16, marginBottom: 8 }}>🎉</Text>
                                    <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>
                                        No outstanding udhar amounts
                                    </Text>
                                </View>
                            ) : (
                                topCustomersByUdhar.map((customer, i) => (
                                    <View
                                        key={customer.name}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            paddingVertical: 16,
                                            paddingHorizontal: 20,
                                            borderBottomWidth: i < topCustomersByUdhar.length - 1 ? 1 : 0,
                                            borderBottomColor: COLORS.border,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 16, marginRight: 12 }}>
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤'}
                                            </Text>
                                            <View>
                                                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>
                                                    {customer.name}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                                                    Outstanding balance
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.danger }}>
                                            {formatCurrency(customer.amount)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}
