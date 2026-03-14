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
    Dimensions,
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTransaction } from '../api/transactions';

const { width } = Dimensions.get('window');

interface ReviewOCRScreenProps {
    navigation: any;
    route: any;
}

export default function ReviewOCRScreen({ navigation, route }: ReviewOCRScreenProps) {
    const { businessId } = useAppStore();
    const { receiptData, imageUrl } = route.params || {};
    
    const [parsedData, setParsedData] = useState({
        customer: receiptData?.customer_name || receiptData?.customerName || 'Unknown Customer',
        date: receiptData?.date || new Date().toLocaleDateString(),
        type: (receiptData?.transaction_type || receiptData?.type || 'cash').toLowerCase() === 'credit' ? 'credit' : 'cash',
        items: receiptData?.item_name || receiptData?.itemName || 'Items',
        total: (receiptData?.price || 0).toString(),
    });

    const confidence = receiptData?.confidence || receiptData?.aiConfidence || 90;
    const rawText = receiptData?.raw_text || receiptData?.rawText || '';
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            navigation.popToTop();
        },
        onError: (error) => {
            Alert.alert("Error", "Failed to save transaction.");
            console.error(error);
        }
    });

    const handleConfirm = () => {
        mutation.mutate({
            customerName: parsedData.customer,
            itemName: parsedData.items,
            price: Number(parsedData.total.replace(/[^0-9.]/g, '')),
            type: parsedData.type as any,
            sourceType: 'ocr',
            aiConfidence: confidence,
            rawText: receiptData?.raw_text || receiptData?.rawText,
            date: new Date().toISOString(),
            isConfirmed: true,
            businessId,
        });
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 90) return COLORS.success;
        if (score >= 70) return COLORS.warning;
        return COLORS.danger;
    };

    const getConfidenceLabel = (score: number) => {
        if (score >= 90) return 'High';
        if (score >= 70) return 'Medium';
        return 'Low';
    };

    const InputField = ({ 
        icon, 
        label, 
        value, 
        onChangeText, 
        keyboardType = 'default',
        isAmount = false 
    }: {
        icon: string;
        label: string;
        value: string;
        onChangeText: (text: string) => void;
        keyboardType?: 'default' | 'numeric';
        isAmount?: boolean;
    }) => (
        <View style={{ marginBottom: 16 }}>
            <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: COLORS.textMuted,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
            }}>
                {label}
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
            }}>
                <Text style={{ fontSize: 18, marginRight: 12 }}>{icon}</Text>
                <TextInput
                    style={{
                        flex: 1,
                        fontSize: 16,
                        color: COLORS.text,
                        fontWeight: '500',
                    }}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    editable={true}
                    placeholderTextColor={COLORS.textMuted}
                />
                {isAmount && (
                    <Text style={{
                        fontSize: 16,
                        color: COLORS.textMuted,
                        fontWeight: '600',
                    }}>
                        ₹
                    </Text>
                )}
            </View>
        </View>
    );

    const TypeSelector = () => (
        <View style={{ marginBottom: 16 }}>
            <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: COLORS.textMuted,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
            }}>
                Transaction Type
            </Text>
            <View style={{
                flexDirection: 'row',
                backgroundColor: COLORS.card,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: COLORS.primary,
                padding: 4,
            }}>
                {[
                    { value: 'cash', label: 'Cash', icon: '💵', color: COLORS.success },
                    { value: 'credit', label: 'Credit', icon: '🤝', color: COLORS.warning },
                ].map((type) => (
                    <TouchableOpacity
                        key={type.value}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 12,
                            borderRadius: 8,
                            backgroundColor: parsedData.type === type.value ? type.color : 'transparent',
                        }}
                        onPress={() => setParsedData(prev => ({ ...prev, type: type.value }))}
                    >
                        <Text style={{ fontSize: 16, marginRight: 6 }}>{type.icon}</Text>
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: parsedData.type === type.value ? COLORS.white : COLORS.text,
                        }}>
                            {type.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* Header */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 52,
                paddingHorizontal: 20,
                paddingBottom: 16,
                backgroundColor: '#ffffff',
                borderBottomWidth: 1,
                borderBottomColor: '#e9ecef',
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ fontSize: 24, color: COLORS.text, fontWeight: '500' }}>←</Text>
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
                        Review Transaction
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                        AI-powered data extraction
                    </Text>
                </View>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Confidence Badge */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    backgroundColor: '#ffffff',
                    marginBottom: 1,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: getConfidenceColor(confidence),
                            marginRight: 8,
                        }} />
                        <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '500' }}>
                            AI Confidence
                        </Text>
                    </View>
                    <View style={{
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        backgroundColor: getConfidenceColor(confidence) + '20',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: getConfidenceColor(confidence),
                    }}>
                        <Text style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: getConfidenceColor(confidence),
                        }}>
                            {confidence}% {getConfidenceLabel(confidence)}
                        </Text>
                    </View>
                </View>

                {/* Warning Banner for Low Confidence */}
                {confidence < 70 && (
                    <View style={{
                        backgroundColor: '#fff3cd',
                        borderLeftWidth: 4,
                        borderLeftColor: '#ffc107',
                        marginHorizontal: 20,
                        marginTop: 12,
                        marginBottom: 0,
                        padding: 12,
                        borderRadius: 8,
                    }}>
                        <Text style={{
                            fontSize: 13,
                            color: '#856404',
                            fontWeight: '600',
                        }}>
                            ⚠️ AI wasn't fully sure — please review all fields carefully
                        </Text>
                    </View>
                )}

                {/* Form Card */}
                <View style={{
                    backgroundColor: '#ffffff',
                    margin: 20,
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 3,
                }}>
                    {/* AI Read Raw Text — at top of card */}
                    {rawText ? (
                        <View style={{
                            backgroundColor: '#f4f5f7',
                            borderRadius: 10,
                            padding: 12,
                            marginBottom: 20,
                        }}>
                            <Text style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: COLORS.textMuted,
                                marginBottom: 6,
                                textTransform: 'uppercase',
                                letterSpacing: 0.8,
                            }}>
                                AI Read:
                            </Text>
                            <Text style={{
                                fontSize: 13,
                                color: '#555',
                                lineHeight: 19,
                                fontStyle: 'italic',
                            }}>
                                {rawText}
                            </Text>
                        </View>
                    ) : null}

                    <InputField
                        icon="👤"
                        label="Customer Name"
                        value={parsedData.customer}
                        onChangeText={(text) => setParsedData(prev => ({ ...prev, customer: text }))}
                    />

                    <InputField
                        icon="📦"
                        label="Item Description"
                        value={parsedData.items}
                        onChangeText={(text) => setParsedData(prev => ({ ...prev, items: text }))}
                    />

                    <InputField
                        icon="💰"
                        label="Amount"
                        value={parsedData.total}
                        onChangeText={(text) => setParsedData(prev => ({ ...prev, total: text }))}
                        keyboardType="numeric"
                        isAmount={true}
                    />

                    <TypeSelector />

                    <InputField
                        icon="📅"
                        label="Date"
                        value={parsedData.date}
                        onChangeText={(text) => setParsedData(prev => ({ ...prev, date: text }))}
                    />
                </View>

                {/* Source Info */}
                <View style={{
                    backgroundColor: '#ffffff',
                    marginHorizontal: 20,
                    marginBottom: 20,
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#e9ecef',
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, marginRight: 8 }}>
                            Source:
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>
                            OCR Scanner
                        </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                        Data extracted using AI vision technology
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={{
                backgroundColor: '#ffffff',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: '#e9ecef',
            }}>
                <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={mutation.isPending}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: mutation.isPending ? '#e9ecef' : COLORS.success,
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
                    }}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Text style={{ fontSize: 20, marginRight: 8, color: COLORS.white }}>💰</Text>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '700',
                                color: COLORS.white,
                            }}>
                                Save Transaction
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
