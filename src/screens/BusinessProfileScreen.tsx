import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { COLORS } from '../constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBusinessProfile, updateBusinessProfile } from '../api/business';
import { useAppStore } from '../store/useAppStore';



interface BusinessProfileScreenProps {
    navigation: any;
}

export default function BusinessProfileScreen({ navigation }: BusinessProfileScreenProps) {
    const { phone: storePhone, setPhone } = useAppStore();
    const queryClient = useQueryClient();

    const [shopName, setShopName] = useState('');
    const [gstin, setGstin] = useState('');
    const [ownerName, setOwnerName] = useState('');

    const { data, isLoading, isError } = useQuery({
        queryKey: ['businessProfile'],
        queryFn: getBusinessProfile,
    });

    useEffect(() => {
        if (data?.data) {
            setShopName(data.data.name || '');
            setOwnerName(data.data.ownerName || '');
            setGstin(data.data.gstin || '');
            
            // Sync store phone if it matches or fills gap
            if (data.data.phone && data.data.phone !== storePhone) {
                setPhone(data.data.phone);
            }
        }
    }, [data, storePhone, setPhone]);

    const mutation = useMutation({
        mutationFn: updateBusinessProfile,
        onSuccess: (res) => {
            if (res.error) {
                Alert.alert('Error', res.error);
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['businessProfile'] });
            Alert.alert('✅ Saved', 'Business profile updated successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to save profile');
        },
    });

    const handleSave = () => {
        if (!shopName.trim()) {
            Alert.alert('Required', 'Please enter your shop name.');
            return;
        }
        mutation.mutate({
            name: shopName.trim(),
            ownerName: ownerName.trim() || undefined,
            gstin: gstin.trim() || undefined,
        });
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

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
                    alignItems: 'center',
                    paddingTop: Platform.OS === 'ios' ? 56 : 42,
                    paddingHorizontal: 20,
                    paddingBottom: 24,
                    backgroundColor: COLORS.primary,
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                    shadowColor: COLORS.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 8,
                    zIndex: 10,
                }}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 14,
                    }}
                >
                    <Text style={{ fontSize: 18, color: COLORS.white, marginTop: -2 }}>{'‹'}</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.white }}>
                    Business Profile
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Profile Avatar Card */}
                <View style={{ alignItems: 'center', marginTop: -30, marginBottom: 24, zIndex: 11 }}>
                    <View
                        style={{
                            width: 90,
                            height: 90,
                            borderRadius: 45,
                            backgroundColor: COLORS.secondary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 4,
                            borderColor: COLORS.background,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 5,
                        }}
                    >
                        <Text style={{ fontSize: 40, fontWeight: '800', color: COLORS.white }}>
                            {shopName ? shopName.charAt(0).toUpperCase() : 'B'}
                        </Text>
                    </View>
                </View>

                {/* First-time / empty state banner */}
                {!isLoading && (!data?.data?.name) && (
                    <View
                        style={{
                            backgroundColor: COLORS.secondaryLight,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: COLORS.secondary,
                            padding: 16,
                            marginBottom: 24,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 28, marginRight: 12 }}>👋</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>
                                Setup your business profile
                            </Text>
                            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                                Fill in your details below to get started
                            </Text>
                        </View>
                    </View>
                )}

                {/* Error state */}
                {isError && (
                    <View
                        style={{
                            backgroundColor: COLORS.dangerLight,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#FECACA',
                            padding: 16,
                            marginBottom: 20,
                        }}
                    >
                        <Text style={{ fontSize: 14, color: COLORS.danger, fontWeight: '600' }}>
                            Could not load profile. You can still fill in and save.
                        </Text>
                    </View>
                )}
                {/* Phone (Read-only) */}
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
                    PHONE NUMBER
                </Text>
                <View
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        marginBottom: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ fontSize: 15, color: COLORS.textMuted }}>
                        +91 {data?.data?.phone || storePhone || '---'}
                    </Text>
                    <View style={{
                        marginLeft: 'auto',
                        backgroundColor: COLORS.successLight,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                    }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.success }}>VERIFIED</Text>
                    </View>
                </View>

                {/* Shop Name */}
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
                    SHOP NAME *
                </Text>
                <TextInput
                    value={shopName}
                    onChangeText={setShopName}
                    placeholder="e.g. Sharma General Store"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 15,
                        color: COLORS.text,
                        marginBottom: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 3,
                        elevation: 1,
                    }}
                />

                {/* Owner Name */}
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
                    OWNER NAME
                </Text>
                <TextInput
                    value={ownerName}
                    onChangeText={setOwnerName}
                    placeholder="e.g. Rajesh Sharma"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 15,
                        color: COLORS.text,
                        marginBottom: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 3,
                        elevation: 1,
                    }}
                />



                {/* GSTIN */}
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
                    GSTIN (OPTIONAL)
                </Text>
                <TextInput
                    value={gstin}
                    onChangeText={setGstin}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="characters"
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 15,
                        color: COLORS.text,
                        marginBottom: 40,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 3,
                        elevation: 1,
                    }}
                />
            </ScrollView>

            {/* Save Button */}
            <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, paddingTop: 12 }}>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={mutation.isPending}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: COLORS.primary,
                        borderRadius: 14,
                        paddingVertical: 16,
                        alignItems: 'center',
                        shadowColor: COLORS.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                        opacity: mutation.isPending ? 0.7 : 1,
                    }}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator color={COLORS.secondary} />
                    ) : (
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.secondary }}>
                            Save Profile
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
