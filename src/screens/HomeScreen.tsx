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
    FlatList,
    StyleSheet,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { formatCurrency } from '../utils/currency';
import { getInitialColor } from '../utils/ui';

const { width, height } = Dimensions.get('window');

interface HomeScreenProps {
    navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const businessId = useAppStore(state => state.businessId);
    const business = useAppStore(state => state.business);
    const language = useAppStore(state => state.language);
    const dashboardStats = useAppStore(state => state.dashboardStats);
    const computeStats = useAppStore(state => state.computeStats);

    const { 
        plan, 
        usage, 
        canCreateTransaction, 
        syncSubscriptionStatus 
    } = useSubscription();
    
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
    const [showTxnDetails, setShowTxnDetails] = useState(false);
    
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const { data: txnsResponse, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['transactions', businessId],
        queryFn: () => getTransactions(businessId),
        enabled: !!businessId,
    });

    const recentTransactions: Transaction[] = txnsResponse?.data || [];

    useEffect(() => {
        if (recentTransactions.length >= 0) {
            computeStats(recentTransactions);
        }
    }, [recentTransactions]);

    useFocusEffect(
        React.useCallback(() => {
            syncSubscriptionStatus();
            refetch();
        }, [])
    );

    const openSheet = () => {
        setShowAddSheet(true);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            })
        ]).start();
    };

    const closeSheet = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 250,
                useNativeDriver: true,
            })
        ]).start(() => setShowAddSheet(false));
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    };

    const renderTransactionItem = ({ item }: { item: Transaction }) => {
        const isCredit = item.type === 'credit';
        return (
            <TouchableOpacity
                onPress={() => {
                    setSelectedTxn(item);
                    setShowTxnDetails(true);
                }}
                activeOpacity={0.7}
                style={styles.txnItem}
            >
                <View style={[styles.avatar, { backgroundColor: getInitialColor(item.customerName || 'Unknown') }]}>
                    <Text style={styles.avatarText}>
                        {(item.customerName || 'U').charAt(0).toUpperCase()}
                    </Text>
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.txnName} numberOfLines={1}>
                        {item.customerName || 'Unknown Customer'}
                    </Text>
                    <Text style={styles.txnItemName} numberOfLines={1}>
                        {item.itemName || 'No description'}
                    </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txnAmount, { color: isCredit ? COLORS.danger : COLORS.success }]}>
                        {isCredit ? '-' : '+'}{formatCurrency(item.price)}
                    </Text>
                    <Text style={styles.txnDate}>
                        {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>
                        {business?.name || 'ApnaKhata'}
                    </Text>
                    <Text style={styles.dateText}>
                        {business?.ownerName ? `नमस्ते, ${business.ownerName}` : getTodayDate()}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Settings')}
                        style={styles.iconBtn}
                    >
                        <Ionicons name="person" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
                }
            >
                {/* Upgrade Banner */}
                {plan === 'free' && usage.transactions.isLimitReached && (
                    <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                        <UpgradeBanner
                            compact
                            feature="transactions"
                            message="Plan limit reached"
                            onUpgrade={() => navigation.navigate('Upgrade')}
                        />
                    </View>
                )}

                {/* Summary Card */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryTop}>
                            <View>
                                <Text style={styles.summaryLabel}>कुल बकाया (Total Outstanding)</Text>
                                <Text style={styles.totalAmount}>
                                    {formatCurrency(dashboardStats.totalUdhar)}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.detailsBtn}>
                                <Ionicons name="chevron-forward-circle" size={28} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.summaryBottom}>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>दिया उधार</Text>
                                <View style={styles.statRow}>
                                    <Ionicons name="arrow-up-circle" size={16} color="#FECACA" />
                                    <Text style={styles.statValueGiven}>
                                        {formatCurrency(dashboardStats.totalUdhar)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>वापस मिला</Text>
                                <View style={styles.statRow}>
                                    <Ionicons name="arrow-down-circle" size={16} color="#A7F3D0" />
                                    <Text style={styles.statValueReceived}>
                                        {formatCurrency(dashboardStats.todaySales)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsGrid}>
                    {[
                        { 
                            id: 'give', 
                            icon: 'add-circle', 
                            label: 'उधार दें', 
                            color: COLORS.danger, 
                            action: () => {
                                if (!canCreateTransaction()) {
                                    Alert.alert(
                                        'Limit Reached',
                                        'You have reached your monthly transaction limit. Please upgrade to continue.',
                                        [{ text: 'Upgrade', onPress: () => navigation.navigate('Upgrade') }, { text: 'Cancel', style: 'cancel' }]
                                    );
                                    return;
                                }
                                openSheet();
                            }
                        },
                        { id: 'take', icon: 'checkmark-circle', label: 'पेमेंट लें', color: COLORS.success, action: () => navigation.navigate('UdharPayment') },
                        { id: 'customers', icon: 'people', label: 'ग्राहक', color: COLORS.primary, action: () => navigation.navigate('Customers') },
                        { id: 'reports', icon: 'bar-chart', label: 'रिपोर्ट', color: COLORS.gold, action: () => navigation.navigate('Reports') },
                    ].map(item => (
                        <TouchableOpacity key={item.id} onPress={item.action} style={styles.actionItem}>
                            <View style={styles.actionIconBg}>
                                <Ionicons name={item.icon as any} size={28} color={item.color} />
                            </View>
                            <Text style={styles.actionLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Usage for Free */}
                {plan === 'free' && (
                    <View style={styles.usageContainer}>
                        <UsageProgressBar
                            current={usage.transactions.current}
                            limit={usage.transactions.limit}
                            label="Monthly Transactions"
                            showWarning={true}
                            color={COLORS.primary}
                        />
                    </View>
                )}

                {/* Transaction History */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>हाल के लेन-देन (Recent Transactions)</Text>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : recentTransactions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#E9ECEF" />
                        <Text style={styles.emptyTitle}>कोई लेन-देन नहीं</Text>
                        <Text style={styles.emptySubtitle}>Tap the + button to start</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 16 }}>
                            <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
                                <Text style={styles.seeAll}>See All →</Text>
                            </TouchableOpacity>
                        </View>
                        {recentTransactions.slice(0, 8).map(txn => (
                            <View key={txn.id}>{renderTransactionItem({ item: txn })}</View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Main FAB */}
            <TouchableOpacity
                onPress={() => {
                    if (!canCreateTransaction()) {
                        Alert.alert(
                            'Limit Reached',
                            'You have reached your monthly transaction limit. Please upgrade to continue.',
                            [{ text: 'Upgrade', onPress: () => navigation.navigate('Upgrade') }, { text: 'Cancel', style: 'cancel' }]
                        );
                        return;
                    }
                    openSheet();
                }}
                activeOpacity={0.8}
                style={styles.fab}
            >
                <Ionicons name="add" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Enhanced Add Transaction Sheet */}
            <Modal visible={showAddSheet} transparent animationType="none">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.overlayFade, { opacity: fadeAnim }]}>
                        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={closeSheet} />
                    </Animated.View>
                    
                    <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.sheetHandle} />
                        
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Add Transaction</Text>
                            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Primary Quick Methods */}
                        <View style={styles.methodGrid}>
                            <TouchableOpacity 
                                style={[styles.methodCard, { backgroundColor: '#F0FDF4' }]}
                                onPress={() => { closeSheet(); navigation.navigate('VoiceInput'); }}
                            >
                                <View style={[styles.methodIcon, { backgroundColor: '#DCFCE7' }]}>
                                    <Ionicons name="mic" size={32} color={COLORS.success} />
                                </View>
                                <Text style={styles.methodLabel}>Voice Entry</Text>
                                <Text style={styles.methodSub}>Fastest Way</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.methodCard, { backgroundColor: '#FFF7ED' }]}
                                onPress={() => { closeSheet(); navigation.navigate('CameraScan'); }}
                            >
                                <View style={[styles.methodIcon, { backgroundColor: '#FFEDD5' }]}>
                                    <Ionicons name="camera" size={32} color="#F97316" />
                                </View>
                                <Text style={styles.methodLabel}>Photo/OCR</Text>
                                <Text style={styles.methodSub}>Scan Receipt</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Secondary Methods */}
                        <View style={styles.secondaryActions}>
                            <TouchableOpacity style={styles.secAction} onPress={() => { closeSheet(); navigation.navigate('ManualEntry'); }}>
                                <View style={styles.secIconBg}>
                                    <Ionicons name="create" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.secLabel}>Manual</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secAction} onPress={() => { closeSheet(); Alert.alert("Coming Soon", "WhatsApp integration is in progress!"); }}>
                                <View style={styles.secIconBg}>
                                    <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                                </View>
                                <Text style={styles.secLabel}>WhatsApp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secAction} onPress={() => { closeSheet(); navigation.navigate('UdharPayment'); }}>
                                <View style={[styles.secIconBg, { backgroundColor: COLORS.primaryLight }]}>
                                    <Ionicons name="card" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.secLabel}>Pay Udhar</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={{ height: Platform.OS === 'ios' ? 40 : 20 }} />
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
    dateText: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' },
    headerActions: { flexDirection: 'row', gap: 12 },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    dot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.danger,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    summaryContainer: { paddingHorizontal: 20, marginBottom: 24 },
    summaryCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 24,
        padding: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    totalAmount: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', marginTop: 8 },
    detailsBtn: { marginTop: 4 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
    summaryBottom: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1 },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statValueGiven: { fontSize: 18, fontWeight: '800', color: '#FECACA' },
    statValueReceived: { fontSize: 18, fontWeight: '800', color: '#A7F3D0' },
    actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 28 },
    actionItem: { alignItems: 'center', width: (width - 40) / 4 },
    actionIconBg: {
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F3F5',
    },
    actionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text },
    usageContainer: { paddingHorizontal: 20, marginBottom: 24 },
    sectionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        marginBottom: 16 
    },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
    seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
    listContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingVertical: 10 },
    txnItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F8F9FA',
    },
    avatar: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    avatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    txnName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
    txnItemName: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
    txnAmount: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    txnDate: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
    loadingContainer: { paddingVertical: 60, alignItems: 'center' },
    emptyContainer: { paddingVertical: 80, alignItems: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    overlayFade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheetContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 12,
        paddingHorizontal: 24,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E9ECEF',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    sheetTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' },
    methodGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    methodCard: { flex: 1, borderRadius: 24, padding: 20, alignItems: 'center' },
    methodIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    methodLabel: { fontSize: 15, fontWeight: '800', color: COLORS.text },
    methodSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
    secondaryActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
    secAction: { alignItems: 'center', width: '30%' },
    secIconBg: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    secLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
});
