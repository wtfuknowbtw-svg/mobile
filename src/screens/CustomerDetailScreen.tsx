import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { COLORS } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { getCustomerTransactions } from '../api/customers';
import type { Transaction } from '../types';

interface CustomerDetailScreenProps {
    navigation: any;
    route: any;
}

export default function CustomerDetailScreen({ navigation, route }: CustomerDetailScreenProps) {
    const { customerId, customerName } = route.params || {};

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['customerTransactions', customerId],
        queryFn: () => getCustomerTransactions(customerId),
        enabled: !!customerId,
    });

    const transactions: Transaction[] = data?.data || [];

    const totalCredit = transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.price, 0);

    const totalCash = transactions
        .filter((t) => t.type === 'cash')
        .reduce((sum, t) => sum + t.price, 0);

    const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getTypeInfo = (type: string) => {
        switch (type) {
            case 'credit':
                return { label: 'UDHAR', color: COLORS.danger, bg: COLORS.dangerLight };
            case 'cash':
                return { label: 'SALE', color: COLORS.success, bg: COLORS.successLight };
            case 'expense':
                return { label: 'PURCHASE', color: COLORS.purchase, bg: COLORS.purchaseLight };
            default:
                return { label: 'OTHER', color: COLORS.textMuted, bg: COLORS.background };
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingTop: 52,
                    paddingHorizontal: 20,
                    paddingBottom: 16,
                }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <Text style={{ fontSize: 18, color: COLORS.text }}>←</Text>
                </TouchableOpacity>
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: COLORS.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                    }}
                >
                    <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700' }}>
                        {(customerName || 'C').charAt(0)}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
                        {customerName || 'Customer'}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                        {transactions.length} transactions
                    </Text>
                </View>
            </View>

            {/* Summary Cards */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 }}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: COLORS.successLight,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#D1FAE5',
                    }}
                >
                    <Text style={{ fontSize: 11, color: COLORS.success, fontWeight: '600' }}>Total Paid</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.success, marginTop: 4 }}>
                        {formatCurrency(totalCash)}
                    </Text>
                </View>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: COLORS.dangerLight,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#FECACA',
                    }}
                >
                    <Text style={{ fontSize: 11, color: COLORS.danger, fontWeight: '600' }}>Outstanding</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.danger, marginTop: 4 }}>
                        {formatCurrency(totalCredit)}
                    </Text>
                </View>
            </View>

            {/* Transaction History */}
            <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 }}>
                    TRANSACTION HISTORY
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            >
                {isLoading && (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLORS.success} />
                    </View>
                )}

                {!isLoading && transactions.length === 0 && (
                    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                        <Text style={{ fontSize: 36, marginBottom: 12 }}>📭</Text>
                        <Text style={{ fontSize: 14, color: COLORS.textMuted }}>
                            No transactions with this customer yet
                        </Text>
                    </View>
                )}

                {transactions.map((txn) => {
                    const typeInfo = getTypeInfo(txn.type);
                    return (
                        <View
                            key={txn.id}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                borderBottomWidth: 1,
                                borderBottomColor: COLORS.border,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>
                                    {txn.itemName || 'Items'}
                                </Text>
                                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                                    {formatDate(txn.date)}
                                    {txn.sourceType ? ` · ${txn.sourceType}` : ''}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
                                    {formatCurrency(txn.price)}
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: typeInfo.bg,
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                        marginTop: 4,
                                    }}
                                >
                                    <Text style={{ fontSize: 9, fontWeight: '700', color: typeInfo.color }}>
                                        {typeInfo.label}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}
