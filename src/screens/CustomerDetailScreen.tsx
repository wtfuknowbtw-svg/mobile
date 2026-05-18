import React, { useState, useMemo, useEffect } from 'react';
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
    StyleSheet,
} from 'react-native';
import { COLORS } from '../constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomerTransactions, updateCustomer } from '../api/customers';
import { Ionicons } from '@expo/vector-icons';
import { createTransaction } from '../api/transactions';
import { useAppStore } from '../store/useAppStore';
import type { Transaction } from '../types';
import { useSubscription } from '../context/SubscriptionContext';
import { formatCurrency } from '../utils/currency';
import { getInitialColor } from '../utils/ui';
import { openWhatsAppReminder } from '../utils/whatsappHelper';
import OfflineBanner from '../components/OfflineBanner';

interface CustomerDetailScreenProps {
    navigation: any;
    route: any;
}

type FilterType = 'all' | 'credit' | 'cash';

export default function CustomerDetailScreen({ navigation, route }: CustomerDetailScreenProps) {
    const { customerId, customerName, customerPhone } = route.params || {};
    const { business, language } = useAppStore();
    const businessName = business?.name || 'Humari shop';
    const { syncSubscriptionStatus } = useSubscription();
    const queryClient = useQueryClient();

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(customerName || '');
    const [editPhone, setEditPhone] = useState(customerPhone || '');

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['customerTransactions', customerId],
        queryFn: () => getCustomerTransactions(customerId),
        enabled: !!customerId,
    });

    const transactions: Transaction[] = data?.data || [];

    const { totalCredit, totalCash, totalUdhar } = useMemo(() => {
        const credit = transactions
            .filter((t) => t.type === 'credit')
            .reduce((sum, t) => sum + t.price, 0);
        const cash = transactions
            .filter((t) => t.type === 'cash')
            .reduce((sum, t) => sum + t.price, 0);
        return {
            totalCredit: credit,
            totalCash: cash,
            totalUdhar: Math.max(0, credit - cash)
        };
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        if (filter === 'all') return transactions;
        return transactions.filter(t => t.type === filter);
    }, [transactions, filter]);

    const text = {
        transactions: language === 'hi' ? 'लेन-देन' : 'transactions',
        remind: language === 'hi' ? 'याद दिलाएं' : 'Remind',
        call: language === 'hi' ? 'कॉल करें' : 'Call',
        totalPaid: language === 'hi' ? 'कुल जमा' : 'Total Paid',
        outstanding: language === 'hi' ? 'कुल बकाया' : 'Outstanding',
        history: language === 'hi' ? 'लेन-देन का इतिहास' : 'TRANSACTION HISTORY',
        noTxns: language === 'hi' ? 'अभी कोई लेन-देन नहीं है' : 'No transactions yet',
        collectBtn: language === 'hi' ? 'पेमेंट प्राप्त करें' : 'Collect Payment',
        collectTitle: language === 'hi' ? 'पेमेंट जमा करें' : 'Collect Payment',
        from: language === 'hi' ? 'से' : 'From',
        amount: language === 'hi' ? 'पेमेंट राशि' : 'PAYMENT AMOUNT',
        partialHint: language === 'hi' ? 'आप कम राशि भी डाल सकते हैं' : 'You can collect a partial payment too',
        cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
        confirm: language === 'hi' ? 'पेमेंट पक्का करें' : 'Confirm Payment',
        filterAll: language === 'hi' ? 'सब' : 'All',
        filterUdhar: language === 'hi' ? 'बकाया' : 'Udhar',
        filterPaid: language === 'hi' ? 'जमा' : 'Paid',
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getTypeInfo = (type: string) => {
        switch (type) {
            case 'credit':
                return { label: language === 'hi' ? 'बकाया' : 'UDHAR', color: COLORS.danger, bg: COLORS.dangerLight };
            case 'cash':
                return { label: language === 'hi' ? 'जमा' : 'PAID', color: COLORS.success, bg: COLORS.successLight };
            default:
                return { label: 'OTHER', color: COLORS.textMuted, bg: COLORS.background };
        }
    };

    const paymentMutation = useMutation({
        mutationFn: createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customerTransactions', customerId] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            syncSubscriptionStatus();
            setShowPaymentModal(false);
            Alert.alert(
                language === 'hi' ? '✅ पेमेंट मिल गया' : '✅ Payment Received',
                `${customerName} से ${formatCurrency(parseFloat(paymentAmount))} प्राप्त हुए।`
            );
            setPaymentAmount('');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to record payment');
        },
    });

    const editMutation = useMutation({
        mutationFn: updateCustomer,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['customerTransactions', customerId] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setShowEditModal(false);
            Alert.alert(
                language === 'hi' ? '✅ अपडेट हो गया' : '✅ Updated',
                language === 'hi' ? 'ग्राहक की जानकारी अपडेट हो गई।' : 'Customer details updated successfully.'
            );
            // Update route params so header reflects changes
            navigation.setParams({
                customerName: editName.trim(),
                customerPhone: editPhone.trim() || undefined,
            });
        },
        onError: () => {
            Alert.alert('Error', language === 'hi' ? 'अपडेट नहीं हो सका।' : 'Failed to update customer.');
        },
    });

    const handleSaveEdit = () => {
        if (!editName.trim()) return;
        editMutation.mutate({
            id: customerId,
            name: editName.trim(),
            phone: editPhone.trim() || null,
        });
    };

    const handleCall = () => {
        if (customerPhone) {
            Linking.openURL(`tel:${customerPhone}`);
        }
    };

    const handleCollectPayment = () => {
        setPaymentAmount(totalUdhar.toString());
        setShowPaymentModal(true);
    };

    const confirmPayment = () => {
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0) return;
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <OfflineBanner />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={[styles.avatar, { backgroundColor: getInitialColor(customerName || 'C') }]}>
                    <Text style={styles.avatarText}>{(customerName || 'C').charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.customerNameText}>{customerName || 'Customer'}</Text>
                    <Text style={styles.txnStatsText}>{transactions.length} {text.transactions}</Text>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => { setEditName(customerName || ''); setEditPhone(customerPhone || ''); setShowEditModal(true); }}
                        style={[styles.actionBtn, { backgroundColor: COLORS.primaryLight }]}
                    >
                        <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                    {customerPhone && (
                        <>
                            <TouchableOpacity onPress={handleCall} style={[styles.actionBtn, { backgroundColor: COLORS.primaryLight }]}>
                                <Ionicons name="call-outline" size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => openWhatsAppReminder(customerPhone, customerName || 'Customer', businessName, totalUdhar, language as any)} 
                                style={[styles.actionBtn, { backgroundColor: '#25D36620' }]}
                            >
                                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
                <View style={[styles.summaryCard, { backgroundColor: COLORS.successLight, borderColor: '#D1FAE5' }]}>
                    <Text style={[styles.summaryLabel, { color: COLORS.success }]}>{text.totalPaid}</Text>
                    <Text style={[styles.summaryValue, { color: COLORS.success }]}>{formatCurrency(totalCash)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: COLORS.dangerLight, borderColor: '#FECACA' }]}>
                    <Text style={[styles.summaryLabel, { color: COLORS.danger }]}>{text.outstanding}</Text>
                    <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{formatCurrency(totalUdhar)}</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity onPress={() => setFilter('all')} style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}>
                    <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>{text.filterAll}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilter('credit')} style={[styles.filterTab, filter === 'credit' && styles.filterTabActive]}>
                    <Text style={[styles.filterTabText, filter === 'credit' && styles.filterTabTextActive]}>{text.filterUdhar}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilter('cash')} style={[styles.filterTab, filter === 'cash' && styles.filterTabActive]}>
                    <Text style={[styles.filterTabText, filter === 'cash' && styles.filterTabTextActive]}>{text.filterPaid}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {isLoading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
                ) : filteredTransactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 40 }}>📭</Text>
                        <Text style={styles.emptyText}>{text.noTxns}</Text>
                    </View>
                ) : (
                    filteredTransactions.map((txn) => {
                        const typeInfo = getTypeInfo(txn.type);
                        return (
                            <View key={txn.id} style={styles.txnItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.txnItemTitle}>{txn.itemName || 'Items'}</Text>
                                    <Text style={styles.txnItemDate}>{formatDate(txn.date)}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 6 }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: typeInfo.color, marginTop: 5 }} />
                                    <Text style={[styles.txnItemPrice, { color: typeInfo.color }]}>{formatCurrency(txn.price)}</Text>
                                </View>
                            </View>
                        );
                    })
                )}
                <View style={{ height: totalUdhar > 0 ? 120 : 40 }} />
            </ScrollView>

            {/* Collect Payment Button */}
            {totalUdhar > 0 && !isLoading && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity onPress={handleCollectPayment} style={styles.collectButton}>
                        <Text style={styles.collectButtonText}>{text.collectBtn} {formatCurrency(totalUdhar)}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Payment Modal */}
            <Modal visible={showPaymentModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>{text.collectTitle}</Text>
                        <Text style={styles.modalSubTitle}>{text.from} {customerName} · {text.outstanding}: {formatCurrency(totalUdhar)}</Text>

                        <View style={styles.modalInputWrapper}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                                value={paymentAmount}
                                onChangeText={setPaymentAmount}
                                keyboardType="numeric"
                                style={styles.modalInput}
                                autoFocus
                            />
                        </View>

                        {/* Quick Amounts */}
                        <View style={styles.quickAmountContainer}>
                            {[500, 1000, 2000, 5000].map(amt => (
                                <TouchableOpacity 
                                    key={amt} 
                                    onPress={() => setPaymentAmount(amt.toString())}
                                    style={styles.quickAmountBtn}
                                >
                                    <Text style={styles.quickAmountText}>+₹{amt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>{text.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmPayment} style={styles.confirmBtn} disabled={paymentMutation.isPending}>
                                {paymentMutation.isPending ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.confirmBtnText}>{text.confirm}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Customer Modal */}
            <Modal visible={showEditModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity activeOpacity={1} onPress={() => setShowEditModal(false)} style={{ flex: 1 }} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Text style={styles.modalTitle}>
                                {language === 'hi' ? 'ग्राहक संपादित करें' : 'Edit Customer'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close-circle" size={28} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
                            {language === 'hi' ? 'नाम *' : 'NAME *'}
                        </Text>
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            placeholder={language === 'hi' ? 'ग्राहक का नाम' : 'Customer name'}
                            placeholderTextColor={COLORS.textMuted}
                            autoFocus
                            style={styles.editInput}
                        />

                        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
                            {language === 'hi' ? 'फोन नंबर' : 'PHONE NUMBER'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 28 }}>
                            <View style={{ paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: 1, borderRightColor: COLORS.border }}>
                                <Text style={{ fontSize: 16, color: COLORS.textMuted, fontWeight: '600' }}>+91</Text>
                            </View>
                            <TextInput
                                value={editPhone}
                                onChangeText={setEditPhone}
                                placeholder={language === 'hi' ? '10 अंकों का नंबर' : '10-digit number'}
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="phone-pad"
                                maxLength={10}
                                style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: COLORS.text }}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSaveEdit}
                            disabled={!editName.trim() || editMutation.isPending}
                            activeOpacity={0.8}
                            style={{
                                paddingVertical: 16, borderRadius: 14, alignItems: 'center',
                                backgroundColor: editName.trim() ? COLORS.primary : COLORS.border,
                                shadowColor: COLORS.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: editName.trim() ? 0.3 : 0,
                                shadowRadius: 8, elevation: editName.trim() ? 4 : 0,
                            }}
                        >
                            {editMutation.isPending ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.white }}>
                                    {language === 'hi' ? 'सहेजें' : 'Save Changes'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
    backButton: { marginRight: 16, padding: 4 },
    backIcon: { fontSize: 24, color: COLORS.text },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    editInput: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.text, marginBottom: 20 },
    avatarText: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
    customerNameText: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    txnStatsText: { fontSize: 13, color: COLORS.textMuted },
    headerActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    actionIcon: { fontSize: 18 },
    summaryContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
    summaryCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1 },
    summaryLabel: { fontSize: 12, fontWeight: '700' },
    summaryValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
    filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
    filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
    filterTabTextActive: { color: COLORS.white },
    emptyState: { paddingVertical: 80, alignItems: 'center' },
    emptyText: { fontSize: 15, color: COLORS.textMuted, marginTop: 12 },
    txnItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    txnItemTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    txnItemDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    txnItemPrice: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
    typeBadgeText: { fontSize: 10, fontWeight: '800' },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, paddingTop: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
    collectButton: { backgroundColor: COLORS.success, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    collectButtonText: { fontSize: 18, fontWeight: '800', color: COLORS.white },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 30 },
    modalHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
    modalSubTitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, marginBottom: 24 },
    modalInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 2, borderColor: COLORS.success, paddingHorizontal: 20 },
    currencySymbol: { fontSize: 30, fontWeight: '700', color: COLORS.success, marginRight: 8 },
    modalInput: { flex: 1, fontSize: 32, fontWeight: '800', color: COLORS.text, paddingVertical: 16 },
    quickAmountContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    quickAmountBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary },
    quickAmountText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    cancelBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    confirmBtn: { flex: 2, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: COLORS.success },
    confirmBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
