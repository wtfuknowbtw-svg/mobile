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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTransaction } from '../api/transactions';

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
            aiConfidence: receiptData?.confidence || receiptData?.aiConfidence || 90,
            rawText: receiptData?.raw_text || receiptData?.rawText,
            date: new Date().toISOString(),
            isConfirmed: true,
            businessId,
        });
    };

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
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ fontSize: 16, color: COLORS.text }}>←</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, marginRight: 8 }}>📋</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
                        Review Extracted Data
                    </Text>
                </View>
                <Text style={{ fontSize: 18, color: COLORS.textMuted }}>•••</Text>
            </View>

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Preview Card */}
                <View
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        marginBottom: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 8,
                            backgroundColor: COLORS.successLight,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 14,
                        }}
                    >
                        <Text style={{ fontSize: 28 }}>📸</Text>
                    </View>
                    <View>
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: COLORS.text,
                            }}
                        >
                            khata_photo_1.jpg
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                            <View
                                style={{
                                    backgroundColor: COLORS.successLight,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                }}
                            >
                                <Text
                                    style={{ fontSize: 10, fontWeight: '600', color: COLORS.success }}
                                >
                                    Google Vision API
                                </Text>
                            </View>
                            <View
                                style={{
                                    backgroundColor: COLORS.primaryLight,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                }}
                            >
                                <Text
                                    style={{ fontSize: 10, fontWeight: '600', color: COLORS.primary }}
                                >
                                    AI Parsed
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Raw OCR Text */}
                <Text
                    style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: COLORS.textMuted,
                        letterSpacing: 1,
                        marginBottom: 8,
                    }}
                >
                    RAW OCR TEXT
                </Text>
                <View
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        marginBottom: 20,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            color: COLORS.text,
                            lineHeight: 22,
                            fontFamily: 'monospace',
                        }}
                    >
                        Raja - 2 kg daal   500/-{'\n'}
                        Chawal 1kg  - 45{'\n'}
                        Date : 3/3/26
                    </Text>
                </View>

                {/* AI Parsed Data */}
                <Text
                    style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: COLORS.textMuted,
                        letterSpacing: 1,
                        marginBottom: 4,
                    }}
                >
                    AI PARSED DATA
                </Text>
                <Text
                    style={{
                        fontSize: 11,
                        color: COLORS.textMuted,
                        marginBottom: 12,
                    }}
                >
                    EXTRACTED BY AI, TAP TO EDIT
                </Text>

                <View
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        overflow: 'hidden',
                        marginBottom: 24,
                    }}
                >
                    {Object.entries(parsedData).map(([key, value], i) => (
                        <View
                            key={key}
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderBottomWidth: i < Object.keys(parsedData).length - 1 ? 1 : 0,
                                borderBottomColor: COLORS.border,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: COLORS.textMuted,
                                    fontWeight: '500',
                                    textTransform: 'capitalize',
                                }}
                            >
                                {key}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: key === 'type' ? COLORS.danger : COLORS.text,
                                    fontWeight: '600',
                                }}
                            >
                                {value}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Bottom Buttons */}
            <View
                style={{
                    flexDirection: 'row',
                    paddingHorizontal: 20,
                    paddingBottom: 40,
                    paddingTop: 16,
                    gap: 12,
                    backgroundColor: COLORS.background,
                }}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: COLORS.border,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        backgroundColor: COLORS.card,
                    }}
                >
                    <Text style={{ fontSize: 14, marginRight: 6 }}>✏️</Text>
                    <Text
                        style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: COLORS.text,
                        }}
                    >
                        Edit
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={mutation.isPending}
                    activeOpacity={0.85}
                    style={{
                        flex: 1.5,
                        paddingVertical: 14,
                        borderRadius: 12,
                        backgroundColor: mutation.isPending ? COLORS.border : COLORS.success,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        shadowColor: COLORS.success,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Text style={{ fontSize: 14, marginRight: 6 }}>✅</Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: '700',
                                    color: COLORS.white,
                                }}
                            >
                                Confirm & Save
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
