import React, { useState, useRef } from 'react';
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
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createTransaction } from '../api/transactions';
import { getCustomers } from '../api/customers';
import { useAppStore } from '../store/useAppStore';
import i18n from '../i18n';
import type { Customer } from '../types';

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
    const [showSuggestions, setShowSuggestions] = useState(false);
    const selectionMadeRef = useRef(false);
    
    // Phone contacts
    const [showPhoneContacts, setShowPhoneContacts] = useState(false);
    const [phoneContacts, setPhoneContacts] = useState<any[]>([]);
    const [filteredPhoneContacts, setFilteredPhoneContacts] = useState<any[]>([]);
    const [phoneContactSearch, setPhoneContactSearch] = useState('');
    const [isLoadingPhoneContacts, setIsLoadingPhoneContacts] = useState(false);
    const [phonePermissionDenied, setPhonePermissionDenied] = useState(false);

    const queryClient = useQueryClient();

    const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ['customers', businessId],
        queryFn: () => getCustomers(businessId || undefined),
        enabled: !!businessId,
    });

    const customers = customersResponse?.data || [];

    const suggestions = customer.trim() 
        ? customers.filter(c => 
            c.name.toLowerCase().includes(customer.toLowerCase())
          ).slice(0, 5)
        : [];

    const handleSelectCustomer = (selectedCustomer: Customer) => {
        selectionMadeRef.current = true;
        setCustomer(selectedCustomer.name);
        if (selectedCustomer.phone) {
            setPhoneNumber(selectedCustomer.phone);
        }
        setShowSuggestions(false);
    };

    // Phone contacts functions
    const pickFromPhoneContacts = async () => {
        setIsLoadingPhoneContacts(true);
        setPhonePermissionDenied(false);
        setPhoneContacts([]);
        setFilteredPhoneContacts([]);
        setPhoneContactSearch('');
        
        try {
            // Step 1: Request permission first
            const { status } = await Contacts.requestPermissionsAsync();
            
            if (status !== 'granted') {
                setIsLoadingPhoneContacts(false);
                Alert.alert(
                    'Permission Required',
                    'Please grant contacts permission to import from phonebook.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => {
                            // Would open settings here
                        }}
                    ]
                );
                return;
            }

            // Step 2: Show loading modal
            setShowPhoneContacts(true);

            // Step 3: Load contacts
            const result = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
                pageSize: 500,
            });
            
            const contactsWithPhone = result.data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
            
            // Step 4: Store contacts
            setPhoneContacts(contactsWithPhone);
            setFilteredPhoneContacts(contactsWithPhone);
        } catch (error) {
            console.error('Error loading phone contacts:', error);
            Alert.alert('Error', 'Failed to load phone contacts');
            setShowPhoneContacts(false);
        } finally {
            setIsLoadingPhoneContacts(false);
        }
    };

    const selectPhoneContact = (contact: any) => {
        const name = contact.name || '';
        const phone = contact.phoneNumbers?.[0]?.number || '';
        
        if (name) setCustomer(name);
        if (phone) setPhoneNumber(phone.replace(/\D/g, ''));
        
        setShowPhoneContacts(false);
        setPhoneContactSearch('');
    };

    const handlePhoneContactSearch = (query: string) => {
        setPhoneContactSearch(query);
        if (!query.trim()) {
            setFilteredPhoneContacts(phoneContacts);
            return;
        }
        
        const filtered = phoneContacts.filter(contact => 
            contact.name?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredPhoneContacts(filtered);
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
                keyboardShouldPersistTaps="handled"
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
                <View style={{ zIndex: 100, position: 'relative' }}>
                    <TextInput
                        value={customer}
                        onChangeText={(text) => {
                            setCustomer(text);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => {
                            // Delay to check if selection was made
                            setTimeout(() => {
                                if (!selectionMadeRef.current) {
                                    setShowSuggestions(false);
                                }
                                selectionMadeRef.current = false;
                            }, 150);
                        }}
                        autoCapitalize="words"
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
                            paddingRight: 50,
                        }}
                    />
                    
                    {/* Phone Contacts Button */}
                    <TouchableOpacity
                        onPress={pickFromPhoneContacts}
                        style={{
                            position: 'absolute',
                            right: 12,
                            top: 10,
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: COLORS.primary + '20',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 18 }}>📱</Text>
                    </TouchableOpacity>
                    
                    {showSuggestions && customer.trim().length > 0 && (
                        <View style={{
                            position: 'absolute',
                            top: 52,
                            left: 0,
                            right: 0,
                            backgroundColor: COLORS.card,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            borderRadius: 10,
                            maxHeight: 250,
                            zIndex: 1000,
                            elevation: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                        }}>
                            {isLoadingCustomers ? (
                                <View style={{ padding: 16, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                </View>
                            ) : suggestions.length > 0 ? (
                                <ScrollView bounces={false}>
                                    {suggestions.map((suggestion) => (
                                        <TouchableOpacity
                                            key={suggestion.id}
                                            onPress={() => handleSelectCustomer(suggestion)}
                                            style={{
                                                paddingHorizontal: 16,
                                                paddingVertical: 14,
                                                borderBottomWidth: 1,
                                                borderBottomColor: COLORS.border + '50',
                                            }}
                                        >
                                            <Text style={{ fontSize: 16, fontWeight: '500', color: COLORS.text }}>
                                                {suggestion.name}
                                            </Text>
                                            {suggestion.phone && (
                                                <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
                                                    {suggestion.phone}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => {
                                        selectionMadeRef.current = true;
                                        setShowSuggestions(false);
                                    }}
                                    style={{ 
                                        padding: 16, 
                                        flexDirection: 'row', 
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 20, marginRight: 8 }}>➕</Text>
                                    <Text style={{ fontSize: 15, color: COLORS.primary, fontWeight: '600' }}>
                                        Create "{customer}"
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

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
                <View style={{ marginBottom: 20 }}>
                    <TextInput
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="e.g. 9876543210"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="phone-pad"
                        style={{
                            backgroundColor: COLORS.card,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            fontSize: 15,
                            color: COLORS.text,
                        }}
                    />
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

            {/* Phone Contacts Modal */}
            <Modal
                visible={showPhoneContacts}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowPhoneContacts(false);
                    setPhoneContactSearch('');
                }}
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
                        maxHeight: '80%',
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
                                Import from Phone
                            </Text>
                            <TouchableOpacity onPress={() => {
                                setShowPhoneContacts(false);
                                setPhoneContactSearch('');
                            }}>
                                <Text style={{ fontSize: 24, color: COLORS.textMuted }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        {!phonePermissionDenied && !isLoadingPhoneContacts && phoneContacts.length > 0 && (
                            <View style={{
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: COLORS.border,
                            }}>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: COLORS.card,
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                }}>
                                    <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
                                    <TextInput
                                        style={{
                                            flex: 1,
                                            fontSize: 15,
                                            color: COLORS.text,
                                        }}
                                        placeholder={`Search ${phoneContacts.length} contacts...`}
                                        placeholderTextColor={COLORS.textMuted}
                                        value={phoneContactSearch}
                                        onChangeText={handlePhoneContactSearch}
                                    />
                                    {phoneContactSearch.length > 0 && (
                                        <TouchableOpacity onPress={() => handlePhoneContactSearch('')}>
                                            <Text style={{ fontSize: 18, color: COLORS.textMuted }}>✕</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Content */}
                        <ScrollView 
                            style={{ maxHeight: 400 }}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {/* Loading State */}
                            {isLoadingPhoneContacts && (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={{ marginTop: 16, color: COLORS.textMuted, fontSize: 14 }}>
                                        Loading contacts...
                                    </Text>
                                </View>
                            )}

                            {/* Permission Denied */}
                            {!isLoadingPhoneContacts && phonePermissionDenied && (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                                        Permission Required
                                    </Text>
                                    <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 }}>
                                        Please grant contacts permission in your device settings
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setShowPhoneContacts(false)}
                                        style={{
                                            backgroundColor: COLORS.primary,
                                            paddingHorizontal: 20,
                                            paddingVertical: 12,
                                            borderRadius: 10,
                                        }}
                                    >
                                        <Text style={{ color: COLORS.white, fontWeight: '600' }}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Empty State */}
                            {!isLoadingPhoneContacts && !phonePermissionDenied && filteredPhoneContacts.length === 0 && (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 48, marginBottom: 16 }}>📭</Text>
                                    <Text style={{ fontSize: 16, color: COLORS.textMuted }}>
                                        {phoneContactSearch.length > 0 ? 'No contacts found' : 'No contacts available'}
                                    </Text>
                                </View>
                            )}

                            {/* Contact List */}
                            {!isLoadingPhoneContacts && !phonePermissionDenied && filteredPhoneContacts.length > 0 && (
                                <View style={{ padding: 8, backgroundColor: COLORS.card }}>
                                    <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center' }}>
                                        Found {filteredPhoneContacts.length} contacts
                                    </Text>
                                </View>
                            )}
                            {!isLoadingPhoneContacts && !phonePermissionDenied && filteredPhoneContacts.map((contact, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => selectPhoneContact(contact)}
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
