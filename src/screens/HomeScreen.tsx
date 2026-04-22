import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Animated,
    Dimensions,
    Modal,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { getTransactions, deleteTransaction } from '../api/transactions';
import type { Transaction } from '../types';
import i18n from '../i18n';
import UpgradeBanner from '../components/UpgradeBanner';
import UsageProgressBar from '../components/UsageProgressBar';
import { useSubscription } from '../context/SubscriptionContext';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
    navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const { dashboardStats, computeStats, businessId } = useAppStore();
    const { 
        plan, 
        usage, 
        canCreateTransaction, 
        getTransactionProgress,
        getUpgradeMessage,
        getUpgradeCTA,
        syncSubscriptionStatus
    } = useSubscription();
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
    const [showTxnDetails, setShowTxnDetails] = useState(false);
    const [showEditOptions, setShowEditOptions] = useState<Transaction | null>(null);
    const slideAnim = useRef(new Animated.Value(300)).current;

    const { data: txnsResponse, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['transactions', businessId],
        queryFn: () => getTransactions(businessId),
        enabled: !!businessId,
    });

    const recentTransactions: Transaction[] = txnsResponse?.data || [];

    // Compute dashboard stats whenever transactions change
    useEffect(() => {
        if (recentTransactions.length > 0) {
            computeStats(recentTransactions);
        }
    }, [recentTransactions]);

    // Refresh subscription status when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            syncSubscriptionStatus();
        }, [])
    );

    const openSheet = () => {
        setShowAddSheet(true);
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
    };

    const closeSheet = () => {
        Animated.timing(slideAnim, {
            toValue: 300,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setShowAddSheet(false));
    };

    const handleDelete = async () => {
        if (!selectedTxn) return;

        try {
            const { error } = await deleteTransaction(selectedTxn.id);
            if (error) throw new Error(error);

            setShowTxnDetails(false);
            refetch(); // Refresh the list
        } catch (err) {
            alert('Failed to delete transaction. Please try again.');
        }
    };

    const getTypeLabel = (type: string) => {
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

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    // Calculate outstanding udhar per customer
    const customerUdharMap: Record<string, { name: string; totalUdhar: number; lastTransaction: Transaction | null }> = {};
    recentTransactions.forEach((txn) => {
        const name = txn.customerName || 'Unknown';
        if (!customerUdharMap[name]) {
            customerUdharMap[name] = { name, totalUdhar: 0, lastTransaction: null };
        }
        
        if (txn.type === 'credit') {
            customerUdharMap[name].totalUdhar += txn.price;
        } else if (txn.type === 'cash' || txn.type === 'udhar_payment') {
            customerUdharMap[name].totalUdhar -= txn.price;
        }
        
        // Track most recent transaction
        if (!customerUdharMap[name].lastTransaction || new Date(txn.date) > new Date(customerUdharMap[name].lastTransaction!.date)) {
            customerUdharMap[name].lastTransaction = txn;
        }
    });

    // Filter only customers with outstanding udhar > 0
    const activeUdharCustomers = Object.values(customerUdharMap)
        .filter(c => c.totalUdhar > 0)
        .sort((a, b) => b.totalUdhar - a.totalUdhar); // Highest udhar first

    const formatDate = (dateStr: string) => {
        const txnDate = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (txnDate.toDateString() === today.toDateString()) {
            return i18n.t('common.today');
        } else if (txnDate.toDateString() === yesterday.toDateString()) {
            return i18n.t('common.yesterday');
        } else {
            return txnDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        }
    };

    const handleEditOption = (transaction: Transaction) => {
        navigation.navigate('EditTransaction', { transaction });
        setShowEditOptions(null);
    };

    const handleDeleteOption = (transaction: Transaction) => {
        Alert.alert(
            i18n.t('editTransaction.deleteConfirm'),
            i18n.t('editTransaction.deleteWarning'),
            [
                { text: i18n.t('common.cancel'), style: 'cancel' },
                {
                    text: i18n.t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTransaction(transaction.id);
                            refetch();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete transaction');
                        }
                    },
                },
            ]
        );
        setShowEditOptions(null);
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 32,
                    paddingHorizontal: 20,
                    paddingBottom: 16,
                    backgroundColor: COLORS.background,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, marginRight: 8 }}>📒</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>
                        <Text style={{ color: COLORS.success }}>Apna</Text>
                        <Text style={{ color: COLORS.orange }}>Khata</Text>
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: COLORS.orangeLight,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 16 }}>🔔</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Settings')}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: COLORS.primaryLight,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 16 }}>👤</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Upgrade Banner for free plan users */}
            {plan === 'free' && usage.transactions.isLimitReached && (
                <UpgradeBanner
                    compact
                    feature="transactions"
                    message="You've reached the free plan limit (50 txns/mo)"
                    onUpgrade={() => navigation.navigate('Upgrade')}
                />
            )}

            {/* Stats Row */}
            <View
                style={{
                    flexDirection: 'row',
                    marginHorizontal: 20,
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 20,
                }}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: COLORS.success,
                        paddingVertical: 14,
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ color: '#A7F3D0', fontSize: 11, fontWeight: '500' }}>
                        {i18n.t('home.todaySales')}
                    </Text>
                    <Text
                        style={{
                            color: COLORS.white,
                            fontSize: 18,
                            fontWeight: '800',
                            marginTop: 2,
                        }}
                    >
                        {formatCurrency(dashboardStats.todaySales)}
                    </Text>
                </View>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: COLORS.danger,
                        paddingVertical: 14,
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ color: '#FECACA', fontSize: 11, fontWeight: '500' }}>
                        {i18n.t('home.totalUdhar')}
                    </Text>
                    <Text
                        style={{
                            color: COLORS.white,
                            fontSize: 18,
                            fontWeight: '800',
                            marginTop: 2,
                        }}
                    >
                        {formatCurrency(dashboardStats.totalUdhar)}
                    </Text>
                </View>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: COLORS.orange,
                        paddingVertical: 14,
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ color: '#FEF3C7', fontSize: 11, fontWeight: '500' }}>
                        {i18n.t('home.thisWeek')}
                    </Text>
                    <Text
                        style={{
                            color: COLORS.white,
                            fontSize: 18,
                            fontWeight: '800',
                            marginTop: 2,
                        }}
                    >
                        {formatCurrency(dashboardStats.thisWeek)}
                    </Text>
                </View>
            </View>

            {/* Usage Progress Bar for Free Plan */}
            {plan === 'free' && (
                <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                    <UsageProgressBar
                        current={usage.transactions.current}
                        limit={usage.transactions.limit}
                        label="Transactions"
                        showWarning={true}
                        color={COLORS.success}
                    />
                </View>
            )}

            {/* Outstanding Udhar List */}
            <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                <Text
                    style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: COLORS.textMuted,
                        letterSpacing: 1,
                    }}
                >
                    OUTSTANDING UDHAR
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                }
            >
                {isLoading && (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLORS.success} />
                        <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>Loading...</Text>
                    </View>
                )}

                {!isLoading && activeUdharCustomers.length === 0 && (
                    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                        <Text style={{ fontSize: 48, marginBottom: 16 }}>🎉</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>
                            No outstanding udhar
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' }}>
                            All customers have paid their dues!{'\n'}Tap + to add new transactions
                        </Text>
                    </View>
                )}

                {activeUdharCustomers.map((customer) => {
                    return (
                        <View key={customer.name} style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: COLORS.border,
                        }}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    if (customer.lastTransaction) {
                                        setSelectedTxn(customer.lastTransaction);
                                        setShowTxnDetails(true);
                                    }
                                }}
                                style={{ flex: 1 }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontWeight: '600',
                                                color: COLORS.text,
                                            }}
                                        >
                                            {customer.name}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                color: COLORS.textMuted,
                                                marginTop: 2,
                                            }}
                                        >
                                            Outstanding Udhar
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text
                                            style={{
                                                fontSize: 18,
                                                fontWeight: '700',
                                                color: COLORS.danger,
                                            }}
                                        >
                                            {formatCurrency(customer.totalUdhar)}
                                        </Text>
                                        <View
                                            style={{
                                                backgroundColor: COLORS.dangerLight,
                                                paddingHorizontal: 8,
                                                paddingVertical: 2,
                                                borderRadius: 4,
                                                marginTop: 4,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: '700',
                                                    color: COLORS.danger,
                                                }}
                                            >
                                                UDHAR
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                            
                            {/* Edit/Delete Options */}
                            <TouchableOpacity
                                onPress={() => customer.lastTransaction && setShowEditOptions(customer.lastTransaction)}
                                style={{
                                    padding: 8,
                                    marginLeft: 8,
                                }}
                            >
                                <Text style={{ fontSize: 16, color: COLORS.textMuted }}>⋮</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}

                {/* Recent Transactions Section */}
                {recentTransactions.length > 0 && (
                    <>
                        <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 8 }}>
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: '700',
                                    color: COLORS.textMuted,
                                    letterSpacing: 1,
                                }}
                            >
                                RECENT TRANSACTIONS
                            </Text>
                        </View>

                        {recentTransactions.slice(0, 10).map((txn) => {
                            const typeInfo = getTypeLabel(txn.type);
                            return (
                                <View key={txn.id} style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 12,
                                    borderBottomWidth: 1,
                                    borderBottomColor: COLORS.border,
                                    opacity: 0.8,
                                }}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            setSelectedTxn(txn);
                                            setShowTxnDetails(true);
                                        }}
                                        style={{ flex: 1 }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 15,
                                                        fontWeight: '500',
                                                        color: COLORS.text,
                                                    }}
                                                >
                                                    {txn.customerName || 'Unknown'}
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        color: COLORS.textMuted,
                                                        marginTop: 1,
                                                    }}
                                                >
                                                    {txn.itemName || 'Items'} · {formatDate(txn.date)}
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text
                                                    style={{
                                                        fontSize: 15,
                                                        fontWeight: '600',
                                                        color: COLORS.text,
                                                    }}
                                                >
                                                    {formatCurrency(txn.price)}
                                                </Text>
                                                <View
                                                    style={{
                                                        backgroundColor: typeInfo.bg,
                                                        paddingHorizontal: 6,
                                                        paddingVertical: 1,
                                                        borderRadius: 3,
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 9,
                                                            fontWeight: '700',
                                                            color: typeInfo.color,
                                                        }}
                                                    >
                                                        {typeInfo.label}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </>
                )}

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                onPress={() => {
                    if (!canCreateTransaction()) {
                        Alert.alert(
                            'Transaction Limit Reached',
                            getUpgradeMessage('transactions'),
                            [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                },
                                {
                                    text: getUpgradeCTA('transactions'),
                                    onPress: () => navigation.navigate('Upgrade'),
                                },
                            ]
                        );
                        return;
                    }
                    openSheet();
                }}
                activeOpacity={canCreateTransaction() ? 0.85 : 0.5}
                style={{
                    position: 'absolute',
                    bottom: 24,
                    right: 24,
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: canCreateTransaction() ? COLORS.success : COLORS.textMuted,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: canCreateTransaction() ? COLORS.success : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: canCreateTransaction() ? 0.4 : 0,
                    shadowRadius: 8,
                    elevation: canCreateTransaction() ? 8 : 0,
                }}
            >
                <Text style={{ fontSize: 28, color: COLORS.white, fontWeight: '300' }}>
                    +
                </Text>
            </TouchableOpacity>

            {/* Add Transaction Bottom Sheet */}
            <Modal
                visible={showAddSheet}
                transparent
                animationType="none"
                onRequestClose={closeSheet}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={closeSheet}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        justifyContent: 'flex-end',
                    }}
                >
                    <Animated.View
                        style={{
                            backgroundColor: COLORS.card,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingTop: 20,
                            paddingBottom: 40,
                            paddingHorizontal: 24,
                            transform: [{ translateY: slideAnim }],
                        }}
                    >
                        {/* Handle */}
                        <View
                            style={{
                                width: 40,
                                height: 4,
                                backgroundColor: COLORS.border,
                                borderRadius: 2,
                                alignSelf: 'center',
                                marginBottom: 20,
                            }}
                        />
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '700',
                                color: COLORS.text,
                                textAlign: 'center',
                                marginBottom: 24,
                            }}
                        >
                            {i18n.t('home.addTransaction')}
                        </Text>

                        {/* Two-Column Grid Layout */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            {/* Row 1: Quick Entry Methods */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    closeSheet();
                                    setTimeout(() => navigation.navigate('VoiceInput'), 300);
                                }}
                                style={{ width: '48%', marginBottom: 16 }}
                            >
                                <View style={{
                                    backgroundColor: COLORS.successLight,
                                    borderRadius: 16,
                                    padding: 20,
                                    alignItems: 'center',
                                }}>
                                    <Text style={{ fontSize: 32, marginBottom: 8 }}>🎤</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>Voice Entry</Text>
                                    <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Fastest way</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    closeSheet();
                                    setTimeout(() => navigation.navigate('CameraScan'), 300);
                                }}
                                style={{ width: '48%', marginBottom: 16 }}
                            >
                                <View style={{
                                    backgroundColor: COLORS.orangeLight,
                                    borderRadius: 16,
                                    padding: 20,
                                    alignItems: 'center',
                                }}>
                                    <Text style={{ fontSize: 32, marginBottom: 8 }}>📸</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>Photo/OCR</Text>
                                    <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Scan receipt</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Row 2: Other Methods */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    closeSheet();
                                    setTimeout(() => navigation.navigate('ManualEntry'), 300);
                                }}
                                style={{ width: '31%', alignItems: 'center' }}
                            >
                                <View style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 14,
                                    backgroundColor: '#F3F4F6',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 6,
                                }}>
                                    <Text style={{ fontSize: 24 }}>✏️</Text>
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.text }}>Manual</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    closeSheet();
                                    Alert.alert('WhatsApp', 'Coming soon!');
                                }}
                                style={{ width: '31%', alignItems: 'center' }}
                            >
                                <View style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 14,
                                    backgroundColor: '#F3F4F6',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 6,
                                }}>
                                    <Text style={{ fontSize: 24 }}>💬</Text>
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.text }}>WhatsApp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    closeSheet();
                                    setTimeout(() => navigation.navigate('UdharPayment'), 300);
                                }}
                                style={{ width: '31%', alignItems: 'center' }}
                            >
                                <View style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 14,
                                    backgroundColor: COLORS.primaryLight,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 6,
                                }}>
                                    <Text style={{ fontSize: 24 }}>💳</Text>
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primary }}>Pay Udhar</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
            {/* Transaction Details Modal */}
            <Modal
                visible={showTxnDetails}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTxnDetails(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowTxnDetails(false)}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: COLORS.card,
                            borderRadius: 24,
                            width: '100%',
                            padding: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.1,
                            shadowRadius: 20,
                            elevation: 10,
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>
                                Transaction Details
                            </Text>
                            <TouchableOpacity onPress={() => setShowTxnDetails(false)}>
                                <Text style={{ fontSize: 20, color: COLORS.textMuted }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedTxn && (
                            <View>
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>CUSTOMER</Text>
                                    <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text }}>{selectedTxn.customerName}</Text>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 24, marginBottom: 16 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>AMOUNT</Text>
                                        <Text style={{ fontSize: 18, fontWeight: '700', color: selectedTxn.type === 'credit' ? COLORS.danger : COLORS.success }}>
                                            {formatCurrency(selectedTxn.price)}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>TYPE</Text>
                                        <View style={{
                                            backgroundColor: getTypeLabel(selectedTxn.type).bg,
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 6,
                                            alignSelf: 'flex-start'
                                        }}>
                                            <Text style={{ color: getTypeLabel(selectedTxn.type).color, fontWeight: '700', fontSize: 12 }}>
                                                {getTypeLabel(selectedTxn.type).label}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>ITEM / DESCRIPTION</Text>
                                    <Text style={{ fontSize: 16, color: COLORS.text }}>{selectedTxn.itemName || 'No description'}</Text>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            height: 48,
                                            borderRadius: 12,
                                            backgroundColor: COLORS.background,
                                            borderWidth: 1,
                                            borderColor: COLORS.border,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        onPress={() => {
                                            setShowTxnDetails(false);
                                            if (selectedTxn) {
                                                navigation.navigate('EditTransaction', { transaction: selectedTxn });
                                            }
                                        }}
                                    >
                                        <Text style={{ fontWeight: '600', color: COLORS.text }}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            height: 48,
                                            borderRadius: 12,
                                            backgroundColor: '#FEF2F2',
                                            borderWidth: 1,
                                            borderColor: '#FECACA',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        onPress={() => {
                                            Alert.alert(
                                                'Delete Transaction',
                                                'Are you sure you want to delete this transaction? This action cannot be undone.',
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    { text: 'Delete', style: 'destructive', onPress: handleDelete },
                                                ]
                                            );
                                        }}
                                    >
                                        <Text style={{ fontWeight: '600', color: COLORS.danger }}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Premium Transaction Options Bottom Sheet */}
            <Modal
                visible={!!showEditOptions}
                transparent
                animationType="slide"
                onRequestClose={() => setShowEditOptions(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setShowEditOptions(null)}
                    />
                    <Animated.View 
                        style={{
                            backgroundColor: COLORS.background,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingTop: 8,
                            paddingBottom: 20,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                            elevation: 12,
                        }}
                    >
                        {/* Handle Bar */}
                        <View style={{
                            width: 40,
                            height: 4,
                            backgroundColor: COLORS.border,
                            borderRadius: 2,
                            alignSelf: 'center',
                            marginBottom: 16,
                        }} />

                        {/* Transaction Header */}
                        {showEditOptions && (
                            <View style={{
                                paddingHorizontal: 20,
                                paddingVertical: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: COLORS.border,
                            }}>
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{
                                            fontSize: 18,
                                            fontWeight: '700',
                                            color: COLORS.text,
                                            marginBottom: 4,
                                        }}>
                                            {showEditOptions.customerName || 'Unknown Customer'}
                                        </Text>
                                        <Text style={{
                                            fontSize: 24,
                                            fontWeight: '700',
                                            color: showEditOptions.type === 'credit' ? COLORS.danger : 
                                                   showEditOptions.type === 'expense' ? COLORS.warning : COLORS.success,
                                        }}>
                                            ₹{showEditOptions.price}
                                        </Text>
                                    </View>
                                    <View style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 12,
                                        backgroundColor: showEditOptions.type === 'credit' ? 'rgba(239, 68, 68, 0.1)' : 
                                                       showEditOptions.type === 'expense' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                    }}>
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: '600',
                                            color: showEditOptions.type === 'credit' ? COLORS.danger : 
                                                   showEditOptions.type === 'expense' ? COLORS.warning : COLORS.success,
                                            textTransform: 'uppercase',
                                        }}>
                                            {showEditOptions.type}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Options List */}
                        <View style={{ paddingHorizontal: 8 }}>
                            {/* Edit Transaction */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 16,
                                    paddingHorizontal: 16,
                                    borderRadius: 12,
                                    marginVertical: 4,
                                }}
                                onPress={() => handleEditOption(showEditOptions!)}
                            >
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 16,
                                }}>
                                    <Text style={{ fontSize: 20 }}>✏️</Text>
                                </View>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: COLORS.text,
                                    flex: 1,
                                }}>
                                    Edit Transaction
                                </Text>
                                <Text style={{ fontSize: 16, color: COLORS.textMuted }}>›</Text>
                            </TouchableOpacity>

                            {/* Copy Details */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 16,
                                    paddingHorizontal: 16,
                                    borderRadius: 12,
                                    marginVertical: 4,
                                }}
                                onPress={() => {
                                    setShowEditOptions(null);
                                    // Copy transaction details to clipboard
                                    const details = `${showEditOptions?.customerName || 'Unknown'} - ₹${showEditOptions?.price} (${showEditOptions?.type})`;
                                    Alert.alert('Copied', 'Transaction details copied to clipboard');
                                }}
                            >
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 16,
                                }}>
                                    <Text style={{ fontSize: 20 }}>📋</Text>
                                </View>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: COLORS.text,
                                    flex: 1,
                                }}>
                                    Copy Details
                                </Text>
                                <Text style={{ fontSize: 16, color: COLORS.textMuted }}>›</Text>
                            </TouchableOpacity>

                            {/* Send Reminder - Only for credit transactions */}
                            {showEditOptions?.type === 'credit' && (
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 16,
                                        paddingHorizontal: 16,
                                        borderRadius: 12,
                                        marginVertical: 4,
                                    }}
                                    onPress={() => {
                                        setShowEditOptions(null);
                                        Alert.alert('Send Reminder', 'Reminder feature coming soon!');
                                    }}
                                >
                                    <View style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 16,
                                    }}>
                                        <Text style={{ fontSize: 20 }}>📲</Text>
                                    </View>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '600',
                                        color: COLORS.text,
                                        flex: 1,
                                    }}>
                                        Send Reminder
                                    </Text>
                                    <Text style={{ fontSize: 16, color: COLORS.textMuted }}>›</Text>
                                </TouchableOpacity>
                            )}

                            {/* Delete */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 16,
                                    paddingHorizontal: 16,
                                    borderRadius: 12,
                                    marginVertical: 4,
                                }}
                                onPress={() => handleDeleteOption(showEditOptions!)}
                            >
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 16,
                                }}>
                                    <Text style={{ fontSize: 20 }}>🗑️</Text>
                                </View>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: COLORS.danger,
                                    flex: 1,
                                }}>
                                    Delete
                                </Text>
                                <Text style={{ fontSize: 16, color: COLORS.danger }}>›</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Cancel Button */}
                        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: COLORS.card,
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                    alignItems: 'center',
                                }}
                                onPress={() => setShowEditOptions(null)}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: COLORS.text,
                                }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}
