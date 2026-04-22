import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers } from '../api/customers';
import { createTransaction } from '../api/transactions';
import type { Customer } from '../types';
import { useSubscription } from '../context/SubscriptionContext';

interface UdharPaymentScreenProps {
    navigation: any;
}

export default function UdharPaymentScreen({ navigation }: UdharPaymentScreenProps) {
    const { businessId } = useAppStore();
    const { syncSubscriptionStatus } = useSubscription();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [amount, setAmount] = useState('');
    const [showCustomerList, setShowCustomerList] = useState(false);
    const queryClient = useQueryClient();

    const { data: customersData, isLoading: customersLoading } = useQuery({
        queryKey: ['customers', businessId],
        queryFn: () => getCustomers(businessId),
        enabled: !!businessId,
    });

    const customers = customersData?.data || [];
    // Filter customers who have outstanding udhar
    const customersWithUdhar = customers.filter(c => c.totalUdhar > 0);

    const mutation = useMutation({
        mutationFn: createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            syncSubscriptionStatus(); // Refresh usage stats
            Alert.alert('Success', 'Udhar payment recorded successfully');
            navigation.goBack();
        },
        onError: () => {
            Alert.alert('Error', 'Failed to record payment');
        },
    });

    const handleSubmit = () => {
        if (!selectedCustomer) {
            Alert.alert('Error', 'Please select a customer');
            return;
        }
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }
        if (Number(amount) > selectedCustomer.totalUdhar) {
            Alert.alert('Error', `Amount cannot exceed outstanding udhar (₹${selectedCustomer.totalUdhar})`);
            return;
        }

        mutation.mutate({
            customerName: selectedCustomer.name,
            customerId: selectedCustomer.id,
            price: Number(amount),
            type: 'udhar_payment',
            itemName: 'Udhar Payment',
            sourceType: 'manual',
            businessId,
            date: new Date().toISOString(),
            isConfirmed: true,
        });
    };

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
                backgroundColor: COLORS.card,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ fontSize: 24, color: COLORS.text }}>←</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
                    Record Udhar Payment
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1, padding: 20 }}>
                {/* Customer Selection */}
                <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: COLORS.textMuted,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }}>
                    Select Customer
                </Text>

                <TouchableOpacity
                    onPress={() => setShowCustomerList(!showCustomerList)}
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: COLORS.primary,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        marginBottom: 20,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, marginRight: 12 }}>👤</Text>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '500',
                                color: selectedCustomer ? COLORS.text : COLORS.textMuted,
                            }}>
                                {selectedCustomer ? selectedCustomer.name : 'Choose customer...'}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 14, color: COLORS.textMuted }}>▼</Text>
                    </View>
                </TouchableOpacity>

                {/* Customer List Dropdown */}
                {showCustomerList && (
                    <View style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        marginBottom: 20,
                        maxHeight: 250,
                    }}>
                        {customersLoading ? (
                            <ActivityIndicator style={{ padding: 20 }} color={COLORS.primary} />
                        ) : customersWithUdhar.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: COLORS.textMuted }}>No customers with outstanding udhar</Text>
                            </View>
                        ) : (
                            <ScrollView>
                                {customersWithUdhar.map((customer, index) => (
                                    <TouchableOpacity
                                        key={customer.id}
                                        onPress={() => {
                                            setSelectedCustomer(customer);
                                            setShowCustomerList(false);
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            paddingVertical: 14,
                                            paddingHorizontal: 16,
                                            borderBottomWidth: index < customersWithUdhar.length - 1 ? 1 : 0,
                                            borderBottomColor: COLORS.border,
                                            backgroundColor: selectedCustomer?.id === customer.id ? COLORS.primaryLight : 'transparent',
                                        }}
                                    >
                                        <View>
                                            <Text style={{
                                                fontSize: 15,
                                                fontWeight: '500',
                                                color: COLORS.text,
                                            }}>
                                                {customer.name}
                                            </Text>
                                            {customer.phone && (
                                                <Text style={{
                                                    fontSize: 12,
                                                    color: COLORS.textMuted,
                                                    marginTop: 2,
                                                }}>
                                                    {customer.phone}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{
                                                fontSize: 14,
                                                fontWeight: '600',
                                                color: COLORS.danger,
                                            }}>
                                                ₹{customer.totalUdhar.toLocaleString('en-IN')}
                                            </Text>
                                            <Text style={{
                                                fontSize: 11,
                                                color: COLORS.textMuted,
                                            }}>
                                                Outstanding
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* Amount Input */}
                <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: COLORS.textMuted,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }}>
                    Payment Amount
                </Text>

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: COLORS.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginBottom: 8,
                }}>
                    <Text style={{ fontSize: 18, marginRight: 12 }}>💰</Text>
                    <Text style={{ fontSize: 16, color: COLORS.textMuted, marginRight: 8 }}>₹</Text>
                    <TextInput
                        style={{
                            flex: 1,
                            fontSize: 18,
                            color: COLORS.text,
                            fontWeight: '600',
                        }}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="Enter amount"
                        placeholderTextColor={COLORS.textMuted}
                    />
                </View>

                {selectedCustomer && (
                    <Text style={{
                        fontSize: 12,
                        color: COLORS.textMuted,
                        marginBottom: 24,
                    }}>
                        Outstanding: ₹{selectedCustomer.totalUdhar.toLocaleString('en-IN')} • 
                        Remaining after payment: ₹{Math.max(0, selectedCustomer.totalUdhar - Number(amount || 0)).toLocaleString('en-IN')}
                    </Text>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={mutation.isPending}
                    style={{
                        backgroundColor: mutation.isPending ? COLORS.textMuted : COLORS.success,
                        borderRadius: 12,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: COLORS.success,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 4,
                        marginTop: 20,
                    }}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Text style={{ fontSize: 20, marginRight: 8 }}>💳</Text>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '700',
                                color: COLORS.white,
                            }}>
                                Record Payment
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}
