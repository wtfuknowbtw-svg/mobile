import React, { useState, useMemo } from 'react';
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
    StyleSheet,
    Dimensions,
    Modal,
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../api/transactions';
import type { Transaction } from '../types';
import i18n from '../i18n';
import { useSubscription } from '../context/SubscriptionContext';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/currency';
import { getInitialColor } from '../utils/ui';
import OfflineBanner from '../components/OfflineBanner';

const { width } = Dimensions.get('window');

interface ReportsScreenProps {
    navigation: any;
}

type TimeFilter = 'today' | 'week' | 'month' | 'custom';

export default function ReportsScreen({ navigation }: ReportsScreenProps) {
    const { businessId, language } = useAppStore();
    const { plan } = useSubscription();
    const isPro = plan !== 'free'; // 'pro' and 'business' plans have access to reports

    const [filter, setFilter] = useState<TimeFilter>('month');
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const { data: txnsResponse, isLoading, refetch } = useQuery({
        queryKey: ['transactions', businessId],
        queryFn: () => getTransactions(businessId),
        enabled: !!businessId,
    });

    const transactions: Transaction[] = txnsResponse?.data || [];

    // Date calculations
    const now = new Date();
    const months = language === 'hi' 
        ? ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const currentMonthName = `${months[selectedMonth]} ${selectedYear}`;

    // Filtered data logic
    const filteredTransactions = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekStart = new Date();
        weekStart.setDate(now.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date(selectedYear, selectedMonth, 1);
        const nextMonthStart = new Date(selectedYear, selectedMonth + 1, 1);

        return transactions.filter(t => {
            const d = new Date(t.date);
            if (filter === 'today') return d >= today;
            if (filter === 'week') return d >= weekStart;
            if (filter === 'month') return d >= monthStart && d < nextMonthStart;
            return true;
        });
    }, [transactions, filter, selectedMonth, selectedYear]);

    const stats = useMemo(() => {
        let given = 0;
        let received = 0;

        filteredTransactions.forEach(t => {
            if (t.type === 'credit') given += t.price;
            else if (t.type === 'cash' || t.type === 'udhar_payment') received += t.price;
        });

        return {
            given,
            received,
            outstanding: Math.max(0, given - received)
        };
    }, [filteredTransactions]);

    // Chart Data (Last 7 days)
    const chartData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            d.setHours(0, 0, 0, 0);
            
            const dayTxns = transactions.filter(t => {
                const td = new Date(t.date);
                td.setHours(0, 0, 0, 0);
                return td.getTime() === d.getTime();
            });

            let given = 0;
            let received = 0;
            dayTxns.forEach(t => {
                if (t.type === 'credit') given += t.price;
                else if (t.type === 'cash' || t.type === 'udhar_payment') received += t.price;
            });

            days.push({
                label: d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short' }),
                given,
                received
            });
        }
        return days;
    }, [transactions, language]);

    // Top 5 Customers
    const topCustomers = useMemo(() => {
        const map: Record<string, { id: string, name: string, amount: number }> = {};
        transactions.forEach(t => {
            if (!t.customerId || !t.customerName) return;
            const current = map[t.customerId] || { id: t.customerId, name: t.customerName, amount: 0 };
            if (t.type === 'credit') current.amount += t.price;
            else if (t.type === 'cash' || t.type === 'udhar_payment') current.amount -= t.price;
            map[t.customerId] = current;
        });

        return Object.values(map)
            .filter(c => c.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [transactions]);

    // Last 10 Transactions
    const lastTransactions = useMemo(() => {
        return [...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
    }, [transactions]);

    const handleExportPDF = async () => {
        const text = `📄 *BUSINESS REPORT - ${currentMonthName.toUpperCase()}*\n\n` +
            `📅 Period: ${filter.toUpperCase()}\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `🔴 Total Given: ${formatCurrency(stats.given)}\n` +
            `🟢 Total Received: ${formatCurrency(stats.received)}\n` +
            `🔵 Net Outstanding: ${formatCurrency(stats.outstanding)}\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `🏆 *TOP DEBTORS*\n` +
            topCustomers.map(c => `• ${c.name}: ${formatCurrency(c.amount)}`).join('\n') +
            `\n\nGenerated via ApnaKhata App`;

        try {
            await Share.share({ message: text });
        } catch (error) {
            console.error(error);
        }
    };

    const handleWhatsAppShare = async () => {
        const text = `📊 *${i18n.t('reports.title')} - ${currentMonthName}*\n\n` +
            `🔴 ${i18n.t('reports.totalGiven')}: ${formatCurrency(stats.given)}\n` +
            `🟢 ${i18n.t('reports.totalReceived')}: ${formatCurrency(stats.received)}\n` +
            `🔵 ${i18n.t('reports.outstanding')}: ${formatCurrency(stats.outstanding)}\n\n` +
            `Shared via ApnaKhata`;

        try {
            await Share.share({ message: text });
        } catch (error) {
            console.error(error);
        }
    };

    const renderBarChart = () => {
        const maxVal = Math.max(...chartData.map(d => Math.max(d.given, d.received)), 100);
        const chartHeight = 150;

        return (
            <View style={styles.chartContainer}>
                <View style={styles.chartContent}>
                    {chartData.map((day, idx) => (
                        <View key={idx} style={styles.chartColumn}>
                            <View style={styles.barsContainer}>
                                <View 
                                    style={[
                                        styles.bar, 
                                        { 
                                            height: (day.received / maxVal) * chartHeight, 
                                            backgroundColor: COLORS.success,
                                            borderTopLeftRadius: 4,
                                            borderTopRightRadius: 4,
                                        }
                                    ]} 
                                />
                                <View 
                                    style={[
                                        styles.bar, 
                                        { 
                                            height: (day.given / maxVal) * chartHeight, 
                                            backgroundColor: COLORS.danger,
                                            borderTopLeftRadius: 4,
                                            borderTopRightRadius: 4,
                                        }
                                    ]} 
                                />
                            </View>
                            <Text style={styles.chartLabel}>{day.label}</Text>
                        </View>
                    ))}
                </View>
                {!isPro && (
                    <View style={styles.proOverlay}>
                        <View style={styles.blurEffect} />
                        <View style={styles.proContent}>
                            <Ionicons name="lock-closed" size={32} color={COLORS.gold} />
                            <Text style={styles.proTitle}>{i18n.t('reports.unlockPro')}</Text>
                            <TouchableOpacity 
                                style={styles.upgradeBtn}
                                onPress={() => navigation.navigate('Subscription')}
                            >
                                <Text style={styles.upgradeBtnText}>{i18n.t('reports.upgradeNow')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <OfflineBanner />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{i18n.t('reports.title')}</Text>
                    <Text style={styles.headerSubtitle}>{currentMonthName}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.calendarBtn}
                    onPress={() => setShowMonthPicker(true)}
                >
                    <Ionicons name="calendar" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Time Filters */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity 
                        onPress={() => setFilter('today')}
                        style={[styles.tab, filter === 'today' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, filter === 'today' && styles.activeTabText]}>
                            {i18n.t('reports.filterToday')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setFilter('week')}
                        style={[styles.tab, filter === 'week' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, filter === 'week' && styles.activeTabText]}>
                            {i18n.t('reports.filterWeek')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setFilter('month')}
                        style={[styles.tab, filter === 'month' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, filter === 'month' && styles.activeTabText]}>
                            {i18n.t('reports.filterMonth')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setFilter('custom')}
                        style={[styles.tab, filter === 'custom' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, filter === 'custom' && styles.activeTabText]}>
                            {i18n.t('reports.filterCustom')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Ionicons name="arrow-up-circle" size={24} color={COLORS.danger} />
                        <Text style={styles.summaryLabel}>{i18n.t('reports.totalGiven')}</Text>
                        <Text style={[styles.summaryAmount, { color: COLORS.danger }]}>{formatCurrency(stats.given)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Ionicons name="arrow-down-circle" size={24} color={COLORS.success} />
                        <Text style={styles.summaryLabel}>{i18n.t('reports.totalReceived')}</Text>
                        <Text style={[styles.summaryAmount, { color: COLORS.success }]}>{formatCurrency(stats.received)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                        <Text style={styles.summaryLabel}>{i18n.t('reports.outstanding')}</Text>
                        <Text style={[styles.summaryAmount, { color: COLORS.primary }]}>{formatCurrency(stats.outstanding)}</Text>
                    </View>
                </View>

                {/* Chart Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{i18n.t('reports.transactionGraph')}</Text>
                </View>
                {renderBarChart()}

                {/* Top Customers */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{i18n.t('reports.highestPending')}</Text>
                </View>
                <View style={styles.card}>
                    {topCustomers.length === 0 ? (
                        <Text style={styles.emptyText}>{i18n.t('reports.noOutstanding')}</Text>
                    ) : (
                        topCustomers.map((customer, idx) => (
                            <TouchableOpacity 
                                key={customer.id} 
                                style={[styles.customerRow, idx === topCustomers.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={() => navigation.navigate('CustomerDetail', { customerId: customer.id, customerName: customer.name })}
                            >
                                <View style={[styles.avatar, { backgroundColor: getInitialColor(customer.name) }]}>
                                    <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <Text style={styles.customerName}>{customer.name}</Text>
                                <Text style={styles.customerAmount}>{formatCurrency(customer.amount)}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Transaction Summary Table */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{i18n.t('reports.transactionSummary')}</Text>
                </View>
                <View style={styles.tableCard}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>{i18n.t('reports.date')}</Text>
                        <Text style={[styles.tableHeaderText, { flex: 2 }]}>{i18n.t('reports.customer')}</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>{i18n.t('reports.amount')}</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right' }]}>{i18n.t('reports.type')}</Text>
                    </View>
                    {lastTransactions.map((txn, idx) => (
                        <View key={txn.id} style={[styles.tableRow, idx % 2 !== 0 && { backgroundColor: '#F9FAFB' }]}>
                            <Text style={[styles.tableCell, { flex: 1.2 }]}>{new Date(txn.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short' })}</Text>
                            <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{txn.customerName || 'Cash Sale'}</Text>
                            <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: '700' }]}>{formatCurrency(txn.price)}</Text>
                            <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                                <View style={[styles.typeBadge, { backgroundColor: txn.type === 'credit' ? '#FEE2E2' : '#D1FAE5' }]}>
                                    <Text style={[styles.typeBadgeText, { color: txn.type === 'credit' ? COLORS.danger : COLORS.success }]}>
                                        {txn.type === 'credit' ? i18n.t('common.udhar') : i18n.t('common.sale')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Export Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{i18n.t('reports.export')}</Text>
                </View>
                <View style={styles.exportRow}>
                    <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF}>
                        <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.exportBtnText}>{i18n.t('reports.pdfReport')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.exportBtn, styles.whatsappBtn]} onPress={handleWhatsAppShare}>
                        <Ionicons name="logo-whatsapp" size={20} color={COLORS.success} />
                        <Text style={[styles.exportBtnText, { color: COLORS.success }]}>{i18n.t('reports.whatsappShare')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Custom Month Picker Modal */}
            <Modal visible={showMonthPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity 
                        activeOpacity={1} 
                        onPress={() => setShowMonthPicker(false)} 
                        style={{ flex: 1 }} 
                    />
                    <View style={styles.monthPickerContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>
                            {language === 'hi' ? 'महीना चुनें' : 'Select Month'}
                        </Text>
                        
                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                            <View style={styles.monthsGrid}>
                                {months.map((m, idx) => (
                                    <TouchableOpacity
                                        key={m}
                                        onPress={() => {
                                            setSelectedMonth(idx);
                                            setFilter('month');
                                            setShowMonthPicker(false);
                                        }}
                                        style={[
                                            styles.monthBtn,
                                            selectedMonth === idx && styles.activeMonthBtn
                                        ]}
                                    >
                                        <Text style={[
                                            styles.monthBtnText,
                                            selectedMonth === idx && styles.activeMonthBtnText
                                        ]}>
                                            {m}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            
                            <View style={styles.yearSelector}>
                                <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)}>
                                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                                </TouchableOpacity>
                                <Text style={styles.yearText}>{selectedYear}</Text>
                                <TouchableOpacity onPress={() => setSelectedYear(y => y + 1)}>
                                    <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingTop: Platform.OS === 'ios' ? 60 : 40, 
        paddingHorizontal: 20, 
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F3F5',
    },
    headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
    headerSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
    calendarBtn: { 
        width: 44, 
        height: 44, 
        borderRadius: 12, 
        backgroundColor: '#F1F3F5', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 },
    tabsContainer: { 
        flexDirection: 'row', 
        backgroundColor: '#FFFFFF', 
        padding: 6, 
        borderRadius: 16, 
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    tab: { 
        flex: 1, 
        paddingVertical: 12, 
        alignItems: 'center', 
        borderRadius: 12 
    },
    activeTab: { backgroundColor: COLORS.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
    activeTabText: { color: '#FFFFFF' },
    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    summaryCard: { 
        flex: 1, 
        backgroundColor: '#FFFFFF', 
        borderRadius: 18, 
        padding: 16, 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    summaryLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 10, fontWeight: '700', letterSpacing: 0.5 },
    summaryAmount: { fontSize: 16, fontWeight: '800', marginTop: 6 },
    sectionHeader: { marginBottom: 16, marginTop: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
    chartContainer: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        padding: 24, 
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
    },
    chartContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 200 },
    chartColumn: { alignItems: 'center', flex: 1 },
    barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 160 },
    bar: { width: 12 },
    chartLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 12, fontWeight: '700' },
    proOverlay: { 
        ...StyleSheet.absoluteFillObject, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderRadius: 20,
    },
    blurEffect: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    proContent: { alignItems: 'center', padding: 24 },
    proTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginTop: 16, textAlign: 'center' },
    upgradeBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20 },
    upgradeBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
    card: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        padding: 8, 
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    customerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 18, 
        borderBottomWidth: 1, 
        borderBottomColor: '#F1F3F5' 
    },
    avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
    customerName: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.text },
    customerAmount: { fontSize: 16, fontWeight: '800', color: COLORS.danger },
    emptyText: { padding: 32, textAlign: 'center', color: COLORS.textMuted, fontSize: 15 },
    tableCard: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        overflow: 'hidden', 
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F8F9FA', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
    tableHeaderText: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1 },
    tableRow: { flexDirection: 'row', padding: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
    tableCell: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    typeBadgeText: { fontSize: 11, fontWeight: '800' },
    exportRow: { flexDirection: 'row', gap: 10, marginBottom: 40 },
    exportBtn: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 12, 
        borderRadius: 12, 
        borderWidth: 1.5, 
        borderColor: COLORS.primary,
        gap: 6,
    },
    whatsappBtn: { borderColor: COLORS.success },
    exportBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    monthPickerContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 30 },
    modalHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#E9ECEF', alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 24, textAlign: 'center' },
    monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
    monthBtn: { width: '30%', paddingVertical: 14, borderRadius: 12, backgroundColor: '#F8F9FA', alignItems: 'center', marginBottom: 10 },
    activeMonthBtn: { backgroundColor: COLORS.primary },
    monthBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
    activeMonthBtnText: { color: '#FFFFFF' },
    yearSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30, marginTop: 20, paddingVertical: 10 },
    yearText: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
});
