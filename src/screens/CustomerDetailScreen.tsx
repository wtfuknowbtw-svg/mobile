import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    Alert,
    Linking,
    Platform,
} from 'react-native';
import { COLORS } from '../constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomerTransactions } from '../api/customers';
import { createTransaction } from '../api/transactions';
import { useAppStore } from '../store/useAppStore';
import type { Transaction } from '../types';
import { useSubscription } from '../context/SubscriptionContext';

interface CustomerDetailScreenProps {
    navigation: any;
    route: any;
}

export default function CustomerDetailScreen({ navigation, route }: CustomerDetailScreenProps) {
    const { customerId, customerName, customerPhone } = route.params || {};
    const { businessId, business } = useAppStore();
    const businessName = business?.name || 'Humari shop';
    const { syncSubscriptionStatus } = useSubscription();
    const queryClient = useQueryClient();

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');

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

    const totalUdhar = Math.max(0, totalCredit - totalCash);

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

    // Collect Payment mutation
    const paymentMutation = useMutation({
        mutationFn: createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customerTransactions', customerId] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            syncSubscriptionStatus(); // Refresh usage stats
            setShowPaymentModal(false);

            const paid = parseFloat(paymentAmount) || 0;
            const remaining = Math.max(0, totalUdhar - paid);

            Alert.alert(
                '✅ Payment Received',
                `Received ${formatCurrency(paid)} from ${customerName}.\n\nRemaining balance: ${formatCurrency(remaining)}`,
            );
            setPaymentAmount('');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to record payment');
        },
    });

    const handleCollectPayment = () => {
        setPaymentAmount(totalUdhar.toString());
        setShowPaymentModal(true);
    };

    const confirmPayment = () => {
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0) {
            Alert.alert('Invalid', 'Please enter a valid amount.');
            return;
        }
        if (amount > totalUdhar) {
            Alert.alert('Too Much', `Amount exceeds outstanding balance of ${formatCurrency(totalUdhar)}.`);
            return;
        }

        paymentMutation.mutate({
            customerId,
            customerName: customerName || 'Customer',
            itemName: 'Payment Received',
            price: amount,
            type: 'cash',
            date: new Date().toISOString(),
            isConfirmed: true,
            sourceType: 'manual',
        } as any);
    };

    // WhatsApp Reminder
    const sendWhatsAppReminder = async () => {
        if (!customerPhone) {
            Alert.alert(
                'No Phone Number',
                'Please add customer\'s phone number first.',
                [{ text: 'OK' }],
            );
            return;
        }

        const phone = customerPhone.replace(/\D/g, '');
        const phoneWithCountry = phone.startsWith('91') ? phone : `91${phone}`;
        
        const message = `Namasté ${customerName || 'Customer'} ji! 🙏\n${businessName || 'Humari shop'} ki taraf se yaad dila rahe hain.\n\nAapka baaki amount: ₹${totalUdhar.toLocaleString('en-IN')}\n\nJaldi payment kar dein. Shukriya! 🙏`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `whatsapp://send?phone=${phoneWithCountry}&text=${encodedMessage}`;
        const smsUrl = `sms:${phoneWithCountry}${Platform.OS === 'ios' ? '&' : '?'}body=${encodedMessage}`;

        try {
            const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
            if (canOpenWhatsApp) {
                await Linking.openURL(whatsappUrl);
            } else {
                // Fallback to SMS
                await Linking.openURL(smsUrl);
            }
        } catch (error) {
            // Last resort fallback to SMS if canOpenURL fails or errors
            Linking.openURL(smsUrl).catch(() => {
                Alert.alert('Error', 'Could not open WhatsApp or SMS app.');
            });
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

                {/* WhatsApp Reminder Button */}
                {customerPhone ? (
                    <TouchableOpacity
                        onPress={sendWhatsAppReminder}
                        style={{
                            backgroundColor: '#25D366' + '20',
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 16, marginRight: 4 }}>📲</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#25D366' }}>Remind</Text>
                    </TouchableOpacity>
                ) : null}
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
                        {formatCurrency(totalUdhar)}
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
                <View style={{ height: totalUdhar > 0 ? 100 : 40 }} />
            </ScrollView>

            {/* Collect Payment Button — Fixed at Bottom */}
            {totalUdhar > 0 && !isLoading && (
                <View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingHorizontal: 20,
                        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
                        paddingTop: 12,
                        backgroundColor: COLORS.background,
                        borderTopWidth: 1,
                        borderTopColor: COLORS.border,
                    }}
                >
                    <TouchableOpacity
                        onPress={handleCollectPayment}
                        activeOpacity={0.85}
                        style={{
                            backgroundColor: COLORS.success,
                            borderRadius: 14,
                            paddingVertical: 16,
                            alignItems: 'center',
                            shadowColor: COLORS.success,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 4,
                        }}
                    >
                        <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.white }}>
                            💰 Collect Payment {formatCurrency(totalUdhar)}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Payment Modal */}
            <Modal
                visible={showPaymentModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPaymentModal(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'flex-end',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: COLORS.background,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingTop: 8,
                            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                            paddingHorizontal: 24,
                        }}
                    >
                        {/* Handle bar */}
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <View
                                style={{
                                    width: 40,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: COLORS.border,
                                }}
                            />
                        </View>

                        {/* Title */}
                        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 }}>
                            Collect Payment
                        </Text>
                        <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 24 }}>
                            From {customerName || 'Customer'} · Outstanding: {formatCurrency(totalUdhar)}
                        </Text>

                        {/* Amount Input */}
                        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
                            PAYMENT AMOUNT
                        </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: COLORS.card,
                                borderRadius: 12,
                                borderWidth: 2,
                                borderColor: COLORS.success,
                                paddingHorizontal: 16,
                                marginBottom: 8,
                            }}
                        >
                            <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.success, marginRight: 4 }}>₹</Text>
                            <TextInput
                                value={paymentAmount}
                                onChangeText={setPaymentAmount}
                                keyboardType="numeric"
                                autoFocus
                                style={{
                                    flex: 1,
                                    fontSize: 28,
                                    fontWeight: '800',
                                    color: COLORS.text,
                                    paddingVertical: 16,
                                }}
                                placeholder="0"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 24 }}>
                            You can collect a partial payment too
                        </Text>

                        {/* Buttons */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowPaymentModal(false);
                                    setPaymentAmount('');
                                }}
                                style={{
                                    flex: 1,
                                    backgroundColor: COLORS.card,
                                    borderRadius: 12,
                                    paddingVertical: 14,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                }}
                            >
                                <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmPayment}
                                disabled={paymentMutation.isPending}
                                style={{
                                    flex: 2,
                                    backgroundColor: COLORS.success,
                                    borderRadius: 12,
                                    paddingVertical: 14,
                                    alignItems: 'center',
                                    opacity: paymentMutation.isPending ? 0.7 : 1,
                                }}
                            >
                                {paymentMutation.isPending ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.white }}>
                                        ✅ Confirm Payment
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
