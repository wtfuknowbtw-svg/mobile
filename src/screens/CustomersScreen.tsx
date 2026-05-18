import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, createCustomer } from '../api/customers';
import type { Customer } from '../types';
import i18n from '../i18n';
import { useSubscription } from '../context/SubscriptionContext';
import UsageProgressBar from '../components/UsageProgressBar';
import OfflineBanner from '../components/OfflineBanner';
import { openWhatsAppReminder } from '../utils/whatsappHelper';
import { formatCurrency } from '../utils/currency';
import { getInitialColor } from '../utils/ui';

type FilterType = 'all' | 'pending' | 'clear';

interface CustomersScreenProps {
    navigation: any;
}

export default function CustomersScreen({ navigation }: CustomersScreenProps) {
    const { businessId, business, language } = useAppStore();
    const businessName = business?.name || 'Humari shop';
    const { 
        plan, 
        usage, 
        canCreateCustomer, 
        getCustomerProgress,
        getUpgradeMessage,
        getUpgradeCTA 
    } = useSubscription();

    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const queryClient = useQueryClient();

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['customers', businessId],
        queryFn: () => getCustomers(businessId),
        enabled: !!businessId,
    });

    const customers: Customer[] = data?.data || [];

    const addMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setShowAddModal(false);
            setNewName('');
            setNewPhone('');
        },
        onError: () => Alert.alert('Error', 'Failed to add customer.'),
    });

    // Search filter
    const searchFiltered = customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    // Apply filter chips
    const filtered = searchFiltered.filter((c) => {
        if (activeFilter === 'pending') return c.totalUdhar > 0;
        if (activeFilter === 'clear') return c.totalUdhar <= 0;
        return true;
    });

    // Sort: udhar customers first, then by name
    const sortedCustomers = [...filtered].sort((a, b) => {
        if (a.totalUdhar > 0 && b.totalUdhar <= 0) return -1;
        if (a.totalUdhar <= 0 && b.totalUdhar > 0) return 1;
        return b.totalUdhar - a.totalUdhar;
    });

    const handleAddCustomer = () => {
        if (!newName.trim()) return;
        addMutation.mutate({
            name: newName.trim(),
            phone: newPhone.trim() || undefined,
            businessId
        });
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return i18n.t('common.today');
        if (d.toDateString() === yesterday.toDateString()) return i18n.t('common.yesterday');
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const handleOpenAddModal = () => {
        if (!canCreateCustomer()) {
            Alert.alert(
                'Customer Limit Reached',
                getUpgradeMessage('customers'),
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: getUpgradeCTA('customers'), onPress: () => navigation.navigate('Subscription') },
                ]
            );
            return;
        }
        setShowAddModal(true);
    };

    const filterChips: { key: FilterType; label: string }[] = [
        { key: 'all', label: i18n.t('customers.filterAll') },
        { key: 'pending', label: i18n.t('customers.filterPending') },
        { key: 'clear', label: i18n.t('customers.filterClear') },
    ];

    const renderCustomerCard = (customer: Customer) => {
        const hasHighUdhar = customer.totalUdhar > 1000;
        const hasUdhar = customer.totalUdhar > 0;

        return (
            <TouchableOpacity
                key={customer.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('CustomerDetail', {
                    customerId: customer.id,
                    customerName: customer.name,
                    customerPhone: customer.phone,
                })}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: COLORS.card,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                }}
            >
                {/* Avatar */}
                <View
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: getInitialColor(customer.name),
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 14,
                        borderWidth: hasHighUdhar ? 3 : 0,
                        borderColor: hasHighUdhar ? COLORS.secondary : 'transparent',
                    }}
                >
                    <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: '700' }}>
                        {customer.name.charAt(0).toUpperCase()}
                    </Text>
                </View>

                {/* Middle */}
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
                        {customer.name}
                    </Text>
                    {(customer.lastTransaction || customer.phone) ? (
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>
                            {customer.lastTransaction ? formatDate(customer.lastTransaction) : customer.phone}
                        </Text>
                    ) : null}
                </View>

                {/* Right */}
                <View style={{ alignItems: 'flex-end' }}>
                    {hasUdhar ? (
                        <>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.danger }}>
                                {formatCurrency(customer.totalUdhar)}
                            </Text>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation?.();
                                    if (customer.phone) {
                                        openWhatsAppReminder(customer.phone, customer.name, businessName, customer.totalUdhar, language as 'en' | 'hi');
                                    } else {
                                        Alert.alert('No Phone', 'This customer does not have a phone number saved.');
                                    }
                                }}
                                style={{
                                    marginTop: 6,
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: COLORS.primary,
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary }}>
                                    {i18n.t('customers.sendReminder')}
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={{
                            paddingHorizontal: 14,
                            paddingVertical: 6,
                            borderRadius: 8,
                            backgroundColor: COLORS.successLight,
                        }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.success }}>
                                {i18n.t('customers.clear')}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <OfflineBanner />

            {/* Header */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 52,
                paddingHorizontal: 20,
                paddingBottom: 12,
            }}>
                <View>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.text }}>
                        {i18n.t('customers.title')}
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 4 }}>
                        {customers.length} {i18n.t('customers.subtitle')}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleOpenAddModal}
                    activeOpacity={0.8}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: COLORS.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: COLORS.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                    }}
                >
                    <Ionicons name="add" size={26} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: COLORS.card,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    elevation: 2,
                }}>
                    <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder={i18n.t('customers.search')}
                        placeholderTextColor={COLORS.textMuted}
                        style={{
                            flex: 1,
                            paddingVertical: 14,
                            fontSize: 15,
                            color: COLORS.text,
                        }}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Chips */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 10 }}>
                {filterChips.map((chip) => (
                    <TouchableOpacity
                        key={chip.key}
                        onPress={() => setActiveFilter(chip.key)}
                        activeOpacity={0.8}
                        style={{
                            paddingHorizontal: 18,
                            paddingVertical: 8,
                            borderRadius: 20,
                            backgroundColor: activeFilter === chip.key ? COLORS.primary : COLORS.card,
                            shadowColor: activeFilter === chip.key ? COLORS.primary : '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: activeFilter === chip.key ? 0.2 : 0.05,
                            shadowRadius: 4,
                            elevation: activeFilter === chip.key ? 3 : 1,
                        }}
                    >
                        <Text style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: activeFilter === chip.key ? COLORS.white : COLORS.textMuted,
                        }}>
                            {chip.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Usage Progress Bar for Free Plan */}
            {plan === 'free' && (
                <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                    <UsageProgressBar
                        current={usage.customers.current}
                        limit={usage.customers.limit}
                        label="Customers"
                        showWarning={true}
                        color={COLORS.primary}
                    />
                </View>
            )}

            {/* Customer List */}
            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            >
                {isLoading && (
                    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 14 }}>Loading...</Text>
                    </View>
                )}

                {/* No search results */}
                {!isLoading && customers.length > 0 && filtered.length === 0 && (
                    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                        <Ionicons name="search-outline" size={56} color={COLORS.textMuted} />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 16 }}>
                            {i18n.t('customers.noResults')} "{search}"
                        </Text>
                        <TouchableOpacity
                            onPress={() => { setSearch(''); setActiveFilter('all'); }}
                            style={{ marginTop: 12 }}
                        >
                            <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>
                                {i18n.t('customers.clearSearch')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Empty state */}
                {!isLoading && customers.length === 0 && (
                    <View style={{ paddingVertical: 80, alignItems: 'center' }}>
                        <View style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            backgroundColor: `${COLORS.primary}12`,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}>
                            <Ionicons name="people-outline" size={48} color={COLORS.primary} />
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>
                            {i18n.t('customers.emptyTitle')}
                        </Text>
                        <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                            {i18n.t('customers.emptySubtitle')}
                        </Text>
                        <TouchableOpacity
                            onPress={handleOpenAddModal}
                            activeOpacity={0.8}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: COLORS.primary,
                                paddingHorizontal: 24,
                                paddingVertical: 14,
                                borderRadius: 14,
                                shadowColor: COLORS.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.white, marginLeft: 8 }}>
                                {i18n.t('customers.addButton')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Customer cards */}
                {!isLoading && sortedCustomers.map(renderCustomerCard)}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Add Customer Bottom Sheet Modal */}
            <Modal visible={showAddModal} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => { setShowAddModal(false); setNewName(''); setNewPhone(''); }}
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                            <View style={{
                                backgroundColor: COLORS.card,
                                borderTopLeftRadius: 24,
                                borderTopRightRadius: 24,
                                paddingTop: 16,
                                paddingBottom: 40,
                                paddingHorizontal: 24,
                            }}>
                                {/* Handle */}
                                <View style={{
                                    width: 40, height: 4, backgroundColor: COLORS.border,
                                    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
                                }} />

                                {/* Title Row */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>
                                        {i18n.t('customers.addNew')}
                                    </Text>
                                    <TouchableOpacity onPress={() => { setShowAddModal(false); setNewName(''); setNewPhone(''); }}>
                                        <Ionicons name="close-circle" size={28} color={COLORS.textMuted} />
                                    </TouchableOpacity>
                                </View>

                                {/* Name Input */}
                                <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
                                    {i18n.t('customers.nameRequired')}
                                </Text>
                                <TextInput
                                    value={newName}
                                    onChangeText={setNewName}
                                    placeholder={i18n.t('customers.namePlaceholder')}
                                    placeholderTextColor={COLORS.textMuted}
                                    autoFocus
                                    style={{
                                        backgroundColor: COLORS.background,
                                        borderRadius: 14,
                                        borderWidth: 1.5,
                                        borderColor: COLORS.border,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        fontSize: 16,
                                        color: COLORS.text,
                                        marginBottom: 20,
                                    }}
                                />

                                {/* Phone Input */}
                                <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
                                    {i18n.t('customers.phoneOptional')}
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: COLORS.background,
                                    borderRadius: 14,
                                    borderWidth: 1.5,
                                    borderColor: COLORS.border,
                                    marginBottom: 28,
                                }}>
                                    <View style={{
                                        paddingHorizontal: 14,
                                        paddingVertical: 14,
                                        borderRightWidth: 1,
                                        borderRightColor: COLORS.border,
                                    }}>
                                        <Text style={{ fontSize: 16, color: COLORS.textMuted, fontWeight: '600' }}>+91</Text>
                                    </View>
                                    <TextInput
                                        value={newPhone}
                                        onChangeText={setNewPhone}
                                        placeholder={i18n.t('customers.phonePlaceholder')}
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        style={{
                                            flex: 1,
                                            paddingHorizontal: 14,
                                            paddingVertical: 14,
                                            fontSize: 16,
                                            color: COLORS.text,
                                        }}
                                    />
                                </View>

                                {/* Action Buttons */}
                                <TouchableOpacity
                                    onPress={handleAddCustomer}
                                    disabled={!newName.trim() || addMutation.isPending}
                                    activeOpacity={0.8}
                                    style={{
                                        paddingVertical: 16,
                                        borderRadius: 14,
                                        backgroundColor: newName.trim() ? COLORS.primary : COLORS.border,
                                        alignItems: 'center',
                                        shadowColor: COLORS.primary,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: newName.trim() ? 0.3 : 0,
                                        shadowRadius: 8,
                                        elevation: newName.trim() ? 4 : 0,
                                        marginBottom: 12,
                                    }}
                                >
                                    {addMutation.isPending ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.white }}>
                                            {i18n.t('customers.saveButton')}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => { setShowAddModal(false); setNewName(''); setNewPhone(''); }}
                                    style={{ paddingVertical: 12, alignItems: 'center' }}
                                >
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textMuted }}>
                                        {i18n.t('common.cancel')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
