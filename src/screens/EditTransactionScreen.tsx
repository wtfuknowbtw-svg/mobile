import React, { useState, useEffect } from 'react';
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
import { updateTransaction, deleteTransaction } from '../api/transactions';
import { useAppStore } from '../store/useAppStore';
import type { Transaction } from '../types';
import i18n from '../i18n';

interface EditTransactionScreenProps {
    navigation: any;
    route: {
        params: {
            transaction: Transaction;
        };
    };
}

export default function EditTransactionScreen({ navigation, route }: EditTransactionScreenProps) {
    const { businessId } = useAppStore();
    const { transaction } = route.params;
    
    const [customer, setCustomer] = useState(transaction.customerName || '');
    const [item, setItem] = useState(transaction.itemName || '');
    const [amount, setAmount] = useState(transaction.price.toString());
    const [type, setType] = useState<'cash' | 'credit' | 'expense'>(transaction.type as 'cash' | 'credit' | 'expense');
    const [date, setDate] = useState(transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateTransaction(transaction.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            Alert.alert(i18n.t('common.success'), i18n.t('editTransaction.updated'), [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        },
        onError: (error: any) => {
            Alert.alert(i18n.t('common.error'), error.message || i18n.t('editTransaction.updateFailed'));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteTransaction(transaction.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            Alert.alert(i18n.t('common.success'), i18n.t('editTransaction.deleted'), [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        },
        onError: (error: any) => {
            Alert.alert(i18n.t('common.error'), error.message || i18n.t('editTransaction.deleteFailed'));
        }
    });

    const handleSave = () => {
        if (!customer || !amount) {
            Alert.alert(i18n.t('common.error'), i18n.t('editTransaction.requiredFields'));
            return;
        }

        updateMutation.mutate({
            customerName: customer,
            itemName: item || 'Manual Entry',
            price: Number(amount),
            type: type,
            date: new Date(date).toISOString(),
            businessId,
        });
    };

    const handleDelete = () => {
        Alert.alert(
            i18n.t('editTransaction.deleteConfirm'),
            i18n.t('editTransaction.deleteWarning'),
            [
                { text: i18n.t('common.cancel'), style: 'cancel' },
                {
                    text: i18n.t('common.delete'),
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(),
                },
            ]
        );
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
                    {i18n.t('editTransaction.title')}
                </Text>
                <TouchableOpacity onPress={handleDelete}>
                    <Text style={{ fontSize: 16, color: COLORS.danger }}>
                        {i18n.t('common.delete')}
                    </Text>
                </TouchableOpacity>
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
                    {i18n.t('review.transactionType')}
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        gap: 10,
                        marginBottom: 24,
                    }}
                >
                    {[
                        { value: 'cash' as const, label: i18n.t('common.sale') + ' (' + i18n.t('review.cash') + ')', emoji: '💰', color: COLORS.success },
                        { value: 'credit' as const, label: i18n.t('common.udhar') + ' (' + i18n.t('review.credit') + ')', emoji: '📕', color: COLORS.danger },
                        { value: 'expense' as const, label: i18n.t('common.purchase'), emoji: '🛒', color: COLORS.primary },
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
                    {i18n.t('review.customerName')}
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
                    {i18n.t('review.itemName')}
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
                    {i18n.t('review.price')} (₹)
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
                        marginBottom: 20,
                    }}
                />

                {/* Date */}
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: COLORS.textMuted,
                        marginBottom: 8,
                    }}
                >
                    {i18n.t('review.date')}
                </Text>
                <TextInput
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
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
                        marginBottom: 40,
                    }}
                />
            </ScrollView>

            {/* Save Button */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 }}>
                <TouchableOpacity
                    onPress={handleSave}
                    activeOpacity={0.85}
                    disabled={updateMutation.isPending}
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
                >
                    {updateMutation.isPending ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                        <Text
                            style={{
                                color: customer && amount ? COLORS.white : COLORS.textMuted,
                                fontSize: 17,
                                fontWeight: '700',
                            }}
                        >
                            {i18n.t('review.saveTransaction')} ✓
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
