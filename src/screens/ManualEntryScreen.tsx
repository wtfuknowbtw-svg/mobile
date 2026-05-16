import React, { useState, useRef, useMemo } from 'react';
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
    StyleSheet,
    Dimensions,
} from 'react-native';
import { COLORS } from '../constants';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createTransaction } from '../api/transactions';
import { getCustomers } from '../api/customers';
import { useAppStore } from '../store/useAppStore';
import i18n from '../i18n';
import type { Customer } from '../types';
import { useSubscription } from '../context/SubscriptionContext';
import { Ionicons } from '@expo/vector-icons';
import { getInitialColor } from '../utils/ui';
import { triggerHighUdharAlert, isNotificationEnabled } from '../utils/notifications';

const { width } = Dimensions.get('window');

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
    const { businessId, language } = useAppStore();
    const { syncSubscriptionStatus } = useSubscription();
    const prefilledData = route?.params?.prefilledData;
    
    // Form State
    const [customerName, setCustomerName] = useState(prefilledData?.customerName || '');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [item, setItem] = useState(prefilledData?.itemName || '');
    const [amount, setAmount] = useState(prefilledData?.price ? prefilledData.price.toString() : '');
    const [type, setType] = useState<'cash' | 'credit'>(
        prefilledData?.type === 'credit' ? 'credit' : 'cash'
    );
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    
    const [showCustomerPicker, setShowCustomerPicker] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');

    const queryClient = useQueryClient();

    const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ['customers', businessId],
        queryFn: () => getCustomers(businessId || undefined),
        enabled: !!businessId,
    });

    const customers = customersResponse?.data || [];

    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customers;
        return customers.filter(c => 
            c.name.toLowerCase().includes(customerSearch.toLowerCase())
        );
    }, [customers, customerSearch]);

    const mutation = useMutation({
        mutationFn: createTransaction,
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            syncSubscriptionStatus();

            // Check high udhar alert
            if (selectedCustomer && type === 'credit') {
                const newUdhar = (selectedCustomer.totalUdhar || 0) + Number(amount);
                if (newUdhar > 1000) {
                    const enabled = await isNotificationEnabled('HIGH_UDHAR_ALERT');
                    if (enabled) {
                        triggerHighUdharAlert(
                            selectedCustomer.name,
                            newUdhar,
                            language as 'hi' | 'en'
                        );
                    }
                }
            }

            navigation.goBack();
        },
        onError: (error) => {
            Alert.alert("Error", "Failed to save transaction.");
            console.error(error);
        }
    });

    const handleSave = () => {
        if (!customerName && !selectedCustomer) {
            Alert.alert("Error", "Please select or enter a customer name");
            return;
        }
        if (!amount) {
            Alert.alert("Error", "Please enter an amount");
            return;
        }

        mutation.mutate({
            customerName: selectedCustomer?.name || customerName,
            customerId: selectedCustomer?.id,
            itemName: item || 'Manual Entry',
            quantity: quantity ? parseFloat(quantity) : undefined,
            unit: unit || undefined,
            price: Number(amount),
            type: type,
            sourceType: 'manual',
            date: date.toISOString(),
            rawText: notes || undefined, // Store notes in rawText
            isConfirmed: true,
            businessId,
        });
    };

    const renderInputCard = (label: string, icon: string, color: string, children: React.ReactNode, row = false) => (
        <View style={[styles.inputGroup, row && { flex: 1 }]}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.inputCard}>
                <View style={[styles.inputIconContainer, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
                <View style={{ flex: 1 }}>{children}</View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {language === 'hi' ? 'नया लेन-देन' : 'New Transaction'}
                </Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView 
                style={styles.scroll} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Toggle Buttons */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity 
                        onPress={() => setType('credit')}
                        style={[
                            styles.toggleBtn, 
                            type === 'credit' && styles.toggleBtnCreditActive
                        ]}
                    >
                        <Text style={[
                            styles.toggleBtnText, 
                            type === 'credit' && styles.toggleBtnTextActive
                        ]}>
                            {language === 'hi' ? 'उधार दें' : 'Give Credit'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setType('cash')}
                        style={[
                            styles.toggleBtn, 
                            type === 'cash' && styles.toggleBtnCashActive
                        ]}
                    >
                        <Text style={[
                            styles.toggleBtnText, 
                            type === 'cash' && styles.toggleBtnTextActive
                        ]}>
                            {language === 'hi' ? 'पेमेंट लें' : 'Get Payment'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Customer Selector */}
                <Text style={styles.inputLabel}>{language === 'hi' ? 'ग्राहक' : 'Customer'}</Text>
                <TouchableOpacity 
                    style={styles.customerCard}
                    onPress={() => setShowCustomerPicker(true)}
                >
                    <View style={[
                        styles.customerAvatar, 
                        { backgroundColor: selectedCustomer ? getInitialColor(selectedCustomer.name) : '#E9ECEF' }
                    ]}>
                        {selectedCustomer ? (
                            <Text style={styles.avatarText}>{selectedCustomer.name.charAt(0).toUpperCase()}</Text>
                        ) : (
                            <Ionicons name="person" size={24} color="#ADB5BD" />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[
                            styles.customerName, 
                            !selectedCustomer && { color: '#ADB5BD' }
                        ]}>
                            {selectedCustomer ? selectedCustomer.name : (language === 'hi' ? 'ग्राहक चुनें' : 'Select Customer')}
                        </Text>
                        {selectedCustomer?.phone && (
                            <Text style={styles.customerPhone}>{selectedCustomer.phone}</Text>
                        )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                {/* Form Fields */}
                {renderInputCard(
                    language === 'hi' ? 'सामान का नाम (वैकल्पिक)' : 'Item Name (Optional)',
                    'cube-outline',
                    COLORS.primary,
                    <TextInput
                        value={item}
                        onChangeText={setItem}
                        placeholder={language === 'hi' ? 'जैसे: 2kg दाल, 1kg चावल' : 'e.g. 2kg Daal, 1kg Chawal'}
                        style={styles.input}
                    />
                )}

                <View style={{ flexDirection: 'row', gap: 16 }}>
                    {renderInputCard(
                        language === 'hi' ? 'मात्रा' : 'Quantity',
                        'bar-chart-outline',
                        '#6C757D',
                        <TextInput
                            value={quantity}
                            onChangeText={setQuantity}
                            placeholder="0"
                            keyboardType="numeric"
                            style={styles.input}
                        />,
                        true
                    )}
                    {renderInputCard(
                        language === 'hi' ? 'यूनिट' : 'Unit',
                        'options-outline',
                        '#6C757D',
                        <TextInput
                            value={unit}
                            onChangeText={setUnit}
                            placeholder="kg/ltr"
                            style={styles.input}
                        />,
                        true
                    )}
                </View>

                {renderInputCard(
                    language === 'hi' ? 'राशि' : 'Amount',
                    'cash-outline',
                    type === 'credit' ? COLORS.danger : COLORS.success,
                    <View style={styles.amountContainer}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0"
                            keyboardType="numeric"
                            style={styles.amountInput}
                        />
                    </View>
                )}

                {renderInputCard(
                    language === 'hi' ? 'तारीख' : 'Date',
                    'calendar-outline',
                    COLORS.primary,
                    <TouchableOpacity style={styles.dateSelector}>
                        <Text style={styles.dateText}>
                            {date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </Text>
                    </TouchableOpacity>
                )}

                {renderInputCard(
                    language === 'hi' ? 'नोट्स (वैकल्पिक)' : 'Notes (Optional)',
                    'document-text-outline',
                    '#F5A623',
                    <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder={language === 'hi' ? 'अतिरिक्त जानकारी यहाँ लिखें...' : 'Write extra info here...'}
                        multiline
                        numberOfLines={3}
                        style={[styles.input, { height: 80, paddingTop: 12 }]}
                    />
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleSave}
                    activeOpacity={0.85}
                    style={[
                        styles.saveBtn,
                        mutation.isPending && { opacity: 0.7 }
                    ]}
                    disabled={mutation.isPending}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveBtnText}>
                            {language === 'hi' ? 'सेव करें' : 'Save'} ✓
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Customer Picker Modal */}
            <Modal visible={showCustomerPicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {language === 'hi' ? 'ग्राहक चुनें' : 'Select Customer'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color={COLORS.textMuted} />
                            <TextInput
                                value={customerSearch}
                                onChangeText={setCustomerSearch}
                                placeholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                                style={styles.searchInput}
                                autoFocus
                            />
                        </View>

                        <ScrollView style={{ flex: 1 }}>
                            {filteredCustomers.map((c) => (
                                <TouchableOpacity 
                                    key={c.id} 
                                    style={styles.customerRow}
                                    onPress={() => {
                                        setSelectedCustomer(c);
                                        setCustomerName(c.name);
                                        setShowCustomerPicker(false);
                                    }}
                                >
                                    <View style={[styles.rowAvatar, { backgroundColor: getInitialColor(c.name) }]}>
                                        <Text style={styles.rowAvatarText}>{c.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.rowName}>{c.name}</Text>
                                        {c.phone && <Text style={styles.rowPhone}>{c.phone}</Text>}
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {customerSearch.length > 0 && filteredCustomers.length === 0 && (
                                <TouchableOpacity 
                                    style={styles.customerRow}
                                    onPress={() => {
                                        setSelectedCustomer(null);
                                        setCustomerName(customerSearch);
                                        setShowCustomerPicker(false);
                                    }}
                                >
                                    <View style={[styles.rowAvatar, { backgroundColor: COLORS.primary }]}>
                                        <Ionicons name="add" size={24} color="#FFFFFF" />
                                    </View>
                                    <Text style={[styles.rowName, { color: COLORS.primary }]}>
                                        Add "{customerSearch}"
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.primary,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#E9ECEF',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
    },
    toggleBtnCreditActive: {
        backgroundColor: COLORS.danger,
    },
    toggleBtnCashActive: {
        backgroundColor: COLORS.success,
    },
    toggleBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.textMuted,
    },
    toggleBtnTextActive: {
        color: '#FFFFFF',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    customerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    customerAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },
    customerName: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
    },
    customerPhone: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    input: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
        paddingVertical: 8,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        marginRight: 8,
    },
    amountInput: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.text,
        flex: 1,
    },
    dateSelector: {
        paddingVertical: 10,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F5',
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 8,
        fontSize: 16,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F3F5',
    },
    rowAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rowAvatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    rowName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    rowPhone: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
});
