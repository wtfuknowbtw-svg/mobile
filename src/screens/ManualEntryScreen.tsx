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
    Modal,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { COLORS } from '../constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTransaction } from '../api/transactions';
import { useAppStore } from '../store/useAppStore';
import i18n from '../i18n';

interface ManualEntryScreenProps {
    navigation: any;
    route?: {
        params?: {
            prefilledData?: {
                customerName: string;
                itemName: string;
                price: number;
                type: 'cash' | 'credit' | 'expense';
            };
        };
    };
}

export default function ManualEntryScreen({ navigation, route }: ManualEntryScreenProps) {
    const { businessId } = useAppStore();
    const prefilledData = route?.params?.prefilledData;
    
    const [customer, setCustomer] = useState(prefilledData?.customerName || '');
    const [item, setItem] = useState(prefilledData?.itemName || '');
    const [amount, setAmount] = useState(prefilledData?.price ? prefilledData.price.toString() : '');
    const [type, setType] = useState<'cash' | 'credit' | 'expense'>(prefilledData?.type || 'cash');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [contacts, setContacts] = useState<any[]>([]);

    const queryClient = useQueryClient();

    const pickContact = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant contacts permission to pick from phonebook');
                return;
            }

            const result = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
                pageSize: 50, // Get more contacts for selection
            });
            
            if (result.data.length > 0) {
                setContacts(result.data);
                setShowContactPicker(true);
            } else {
                Alert.alert('No Contacts', 'No contacts found in your phonebook');
            }
        } catch (error) {
            console.error('Error picking contact:', error);
            Alert.alert('Error', 'Failed to pick contact');
        }
    };

    const selectContact = (contact: any) => {
        const name = contact.name || '';
        const phone = contact.phoneNumbers?.[0]?.number || '';
        
        if (name) setCustomer(name);
        if (phone) setPhoneNumber(phone.replace(/\D/g, '')); // Remove non-digits
        
        setShowContactPicker(false);
    };

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
            customerPhone: phoneNumber || undefined,
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
                    {prefilledData ? i18n.t('manualEntry.correctData') : i18n.t('home.manual')}
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
                        marginBottom: 12,
                    }}
                />

                {/* Phone Number */}
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: COLORS.textMuted,
                        marginBottom: 8,
                    }}
                >
                    {i18n.t('manualEntry.phoneNumber')} (Optional)
                </Text>
                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                    <TextInput
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="e.g. 9876543210"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="phone-pad"
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.card,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            fontSize: 15,
                            color: COLORS.text,
                            marginRight: 8,
                        }}
                    />
                    <TouchableOpacity
                        onPress={pickContact}
                        style={{
                            backgroundColor: COLORS.primary,
                            borderRadius: 10,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ color: COLORS.white, fontSize: 16 }}>📱</Text>
                    </TouchableOpacity>
                </View>

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
                        {i18n.t('review.saveTransaction')} ✓
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Contact Picker Modal */}
            <Modal
                visible={showContactPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowContactPicker(false)}
            >
                <View style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                }}>
                    <View style={{
                        backgroundColor: COLORS.background,
                        borderRadius: 20,
                        width: '100%',
                        maxHeight: '70%',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 10,
                    }}>
                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 20,
                            borderBottomWidth: 1,
                            borderBottomColor: COLORS.border,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
                                Select Contact
                            </Text>
                            <TouchableOpacity onPress={() => setShowContactPicker(false)}>
                                <Text style={{ fontSize: 24, color: COLORS.textMuted }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Contact List */}
                        <ScrollView 
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {contacts.map((contact, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => selectContact(contact)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: COLORS.border,
                                    }}
                                >
                                    <View style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: COLORS.primary,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 16,
                                    }}>
                                        <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>
                                            {contact.name?.charAt(0)?.toUpperCase() || '?'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>
                                            {contact.name || 'Unknown'}
                                        </Text>
                                        <Text style={{ fontSize: 14, color: COLORS.textMuted }}>
                                            {contact.phoneNumbers?.[0]?.number || 'No phone'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}
