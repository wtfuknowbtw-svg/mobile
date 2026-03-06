import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { COLORS } from '../constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTransaction } from '../api/transactions';
import { useAppStore } from '../store/useAppStore';

interface ManualEntryScreenProps {
    navigation: any;
}

export default function ManualEntryScreen({ navigation }: ManualEntryScreenProps) {
    const { businessId } = useAppStore();
    const [customer, setCustomer] = useState('');
    const [item, setItem] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'cash' | 'credit' | 'expense'>('cash');

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            navigation.goBack();
        },
        onError: (error) => {
            Alert.alert("Error", "Failed to save transaction.");
            console.error(error);
        }
    });

    const handleSave = () => {
        if (!customer || !amount) return;
        mutation.mutate({
            customerName: customer,
            itemName: item || 'Manual Entry',
            price: Number(amount),
            type: type,
            sourceType: 'manual',
            date: new Date().toISOString(),
            isConfirmed: true,
            businessId,
        });
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: COLORS.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ fontSize: 16, color: COLORS.text }}>←</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
                    Manual Entry
                </Text>
                <View style={{ width: 16 }} />
            </View>

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Transaction Type */}
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: COLORS.textMuted,
                        marginBottom: 10,
                        marginTop: 8,
                    }}
                >
                    Transaction Type
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        gap: 10,
                        marginBottom: 24,
                    }}
                >
                    {[
                        { value: 'cash' as const, label: 'Sale (Cash)', emoji: '💰', color: COLORS.success },
                        { value: 'credit' as const, label: 'Udhar (Credit)', emoji: '📕', color: COLORS.danger },
                        { value: 'expense' as const, label: 'Purchase', emoji: '🛒', color: COLORS.primary },
                    ].map((t) => (
                        <TouchableOpacity
                            key={t.value}
                            onPress={() => setType(t.value)}
                            style={{
                                flex: 1,
                                paddingVertical: 14,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: type === t.value ? t.color : COLORS.border,
                                backgroundColor: type === t.value
                                    ? t.value === 'cash'
                                        ? COLORS.successLight
                                        : t.value === 'credit'
                                            ? COLORS.dangerLight
                                            : COLORS.primaryLight
                                    : COLORS.card,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 20, marginBottom: 4 }}>{t.emoji}</Text>
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontWeight: '600',
                                    color: type === t.value ? t.color : COLORS.textMuted,
                                    textAlign: 'center',
                                }}
                            >
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Customer Name */}
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: COLORS.textMuted,
                        marginBottom: 8,
                    }}
                >
                    Customer Name
                </Text>
                <TextInput
                    value={customer}
                    onChangeText={setCustomer}
                    placeholder="e.g. Raja Kumar"
                    placeholderTextColor={COLORS.textMuted}
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 15,
                        color: COLORS.text,
                        marginBottom: 20,
                    }}
                />

                {/* Item Name */}
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: COLORS.textMuted,
                        marginBottom: 8,
                    }}
                >
                    Item / Description
                </Text>
                <TextInput
                    value={item}
                    onChangeText={setItem}
                    placeholder="e.g. 2kg Daal, 1kg Chawal"
                    placeholderTextColor={COLORS.textMuted}
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 15,
                        color: COLORS.text,
                        marginBottom: 20,
                    }}
                />

                {/* Amount */}
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: COLORS.textMuted,
                        marginBottom: 8,
                    }}
                >
                    Amount (₹)
                </Text>
                <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="e.g. 500"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 24,
                        fontWeight: '700',
                        color: COLORS.text,
                        marginBottom: 24,
                    }}
                />
            </ScrollView>

            {/* Save Button */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 }}>
                <TouchableOpacity
                    onPress={handleSave}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor:
                            customer && amount ? COLORS.success : COLORS.border,
                        paddingVertical: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                        shadowColor: COLORS.success,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: customer && amount ? 0.3 : 0,
                        shadowRadius: 8,
                        elevation: customer && amount ? 6 : 0,
                    }}
                    disabled={!customer || !amount}
                >
                    <Text
                        style={{
                            color: customer && amount ? COLORS.white : COLORS.textMuted,
                            fontSize: 17,
                            fontWeight: '700',
                        }}
                    >
                        Save Transaction ✓
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
