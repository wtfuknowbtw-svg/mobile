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
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, createCustomer } from '../api/customers';
import type { Customer } from '../types';
import i18n from '../i18n';
import { useSubscription } from '../context/SubscriptionContext';
import UsageProgressBar from '../components/UsageProgressBar';

interface CustomersScreenProps {
    navigation: any;
}

export default function CustomersScreen({ navigation }: CustomersScreenProps) {
    const { businessId } = useAppStore();
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

    const filtered = customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const udharCustomers = filtered.filter((c) => c.totalUdhar > 0);
    const regularCustomers = filtered.filter((c) => c.totalUdhar <= 0);

    const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

    const getInitialColor = (name: string) => {
        if (!name) return COLORS.primary;
        const colors = [COLORS.danger, COLORS.primary, COLORS.success, COLORS.orange];
        const code = name.charCodeAt(0);
        return colors[isNaN(code) ? 0 : code % colors.length];
    };

    const handleAddCustomer = () => {
        if (!newName.trim()) return;
        addMutation.mutate({
            name: newName.trim(),
            phone: newPhone.trim() || undefined,
            businessId
        });
    };

    const renderCustomerRow = (customer: Customer, showUdhar: boolean) => (
        <TouchableOpacity
            key={customer.id}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CustomerDetail', { customerId: customer.id, customerName: customer.name, customerPhone: customer.phone })}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
            }}
        >
            {/* Avatar */}
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: getInitialColor(customer.name),
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                }}
            >
                <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700' }}>
                    {customer.name.charAt(0)}
                </Text>
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>
                    {customer.name}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {customer.phone || i18n.t('customers.noPhone')}
                </Text>
            </View>

            {/* Amount */}
            {showUdhar ? (
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.danger }}>
                        +{formatCurrency(customer.totalUdhar)}
                    </Text>
                    <Text style={{ fontSize: 11, color: COLORS.danger, marginTop: 2 }}>
                        {i18n.t('customers.owed')}
                    </Text>
                </View>
            ) : (
                <View
                    style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: COLORS.successLight,
                    }}
                >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.success }}>
                        CLEAR
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

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
                    <Text style={{ fontSize: 16, marginRight: 8 }}>👥</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>
                        {i18n.t('customers.title')}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        if (!canCreateCustomer()) {
                            Alert.alert(
                                'Customer Limit Reached',
                                getUpgradeMessage('customers'),
                                [
                                    {
                                        text: 'Cancel',
                                        style: 'cancel',
                                    },
                                    {
                                        text: getUpgradeCTA('customers'),
                                        onPress: () => navigation.navigate('Upgrade'),
                                    },
                                ]
                            );
                            return;
                        }
                        setShowAddModal(true);
                    }}
                    activeOpacity={canCreateCustomer() ? 0.8 : 0.5}
                    style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: canCreateCustomer() ? COLORS.successLight : COLORS.background,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: canCreateCustomer() ? COLORS.success + '20' : COLORS.border,
                    }}
                >
                    <Text style={{ fontSize: 16, marginRight: 4, color: canCreateCustomer() ? COLORS.success : COLORS.textMuted }}>+</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: canCreateCustomer() ? COLORS.success : COLORS.textMuted }}>
                        {i18n.t('customers.addNew')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: COLORS.card,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        paddingHorizontal: 14,
                    }}
                >
                    <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder={i18n.t('customers.search')}
                        placeholderTextColor={COLORS.textMuted}
                        style={{
                            flex: 1,
                            paddingVertical: 12,
                            fontSize: 15,
                            color: COLORS.text,
                        }}
                    />
                </View>
            </View>

            {/* Usage Progress Bar for Free Plan */}
            {plan === 'free' && (
                <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                    <UsageProgressBar
                        current={usage.customers.current}
                        limit={usage.customers.limit}
                        label="Customers"
                        showWarning={true}
                        color={COLORS.primary}
                    />
                </View>
            )}

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

                {!isLoading && customers.length > 0 && filtered.length === 0 && (
                    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                        <Text style={{ fontSize: 44, marginBottom: 16 }}>🔍</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>
                            No results found for "{search}"
                        </Text>
                        <TouchableOpacity 
                            onPress={() => setSearch('')}
                            style={{ marginTop: 12 }}
                        >
                            <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Clear Search</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!isLoading && customers.length === 0 && (
                    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                        <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>
                            No customers yet
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' }}>
                            Add your first customer using the + button{'\n'}or they'll be created when you add transactions
                        </Text>
                    </View>
                )}

                {/* Udhar Section */}
                {udharCustomers.length > 0 && (
                    <>
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: COLORS.danger,
                                letterSpacing: 1,
                                marginBottom: 12,
                            }}
                        >
                            {i18n.t('customers.udhar')} · {udharCustomers.length} {i18n.t('customers.all')}
                        </Text>
                        {udharCustomers.map((c) => renderCustomerRow(c, true))}
                    </>
                )}

                {/* All Customers */}
                {regularCustomers.length > 0 && (
                    <>
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: COLORS.textMuted,
                                letterSpacing: 1,
                                marginTop: 24,
                                marginBottom: 12,
                            }}
                        >
                            {i18n.t('customers.all')} · {regularCustomers.length}
                        </Text>
                        {regularCustomers.map((c) => renderCustomerRow(c, false))}
                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Add Customer Modal */}
            <Modal visible={showAddModal} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            justifyContent: 'center',
                            paddingHorizontal: 24,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: COLORS.card,
                                borderRadius: 20,
                                padding: 24,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: 0.25,
                                shadowRadius: 15,
                                elevation: 10,
                            }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>
                                    {i18n.t('customers.addNew')}
                                </Text>
                                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                    <Text style={{ fontSize: 20, color: COLORS.textMuted }}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
                                NAME *
                            </Text>
                            <TextInput
                                value={newName}
                                onChangeText={setNewName}
                                placeholder="e.g. Ramesh Kumar"
                                placeholderTextColor={COLORS.textMuted}
                                autoFocus
                                style={{
                                    backgroundColor: COLORS.background,
                                    borderRadius: 12,
                                    borderWidth: 1.5,
                                    borderColor: COLORS.border,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    fontSize: 16,
                                    color: COLORS.text,
                                    marginBottom: 20,
                                }}
                            />

                            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
                                PHONE (OPTIONAL)
                            </Text>
                            <TextInput
                                value={newPhone}
                                onChangeText={setNewPhone}
                                placeholder="10-digit mobile number"
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="phone-pad"
                                maxLength={10}
                                style={{
                                    backgroundColor: COLORS.background,
                                    borderRadius: 12,
                                    borderWidth: 1.5,
                                    borderColor: COLORS.border,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    fontSize: 16,
                                    color: COLORS.text,
                                    marginBottom: 28,
                                }}
                            />

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowAddModal(false);
                                        setNewName('');
                                        setNewPhone('');
                                    }}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 16,
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: COLORS.border,
                                        alignItems: 'center',
                                        backgroundColor: COLORS.card,
                                    }}
                                >
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textMuted }}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleAddCustomer}
                                    disabled={!newName.trim() || addMutation.isPending}
                                    activeOpacity={0.8}
                                    style={{
                                        flex: 2,
                                        paddingVertical: 16,
                                        borderRadius: 14,
                                        backgroundColor: newName.trim() ? COLORS.success : COLORS.border,
                                        alignItems: 'center',
                                        shadowColor: COLORS.success,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: newName.trim() ? 0.3 : 0,
                                        shadowRadius: 8,
                                        elevation: 4,
                                    }}
                                >
                                    {addMutation.isPending ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.white }}>
                                            Save Customer
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
