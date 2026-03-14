import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    Linking,
} from 'react-native';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import i18n from '../i18n';

interface SettingsScreenProps {
    navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
    const { logout, phone, language } = useAppStore();

    const getLanguageLabel = () => {
        const map: Record<string, string> = {
            hi: 'हिंदी (Hindi)',
            mr: 'मराठी (Marathi)',
            kn: 'ಕನ್ನಡ (Kannada)',
            en: 'English',
            te: 'తెలుగు (Telugu)',
        };
        return map[language] || 'Hindi';
    };

    const handleLogout = () => {
        Alert.alert(i18n.t('settings.logout'), 'Are you sure you want to logout?', [
            { text: i18n.t('common.cancel'), style: 'cancel' },
            {
                text: i18n.t('settings.logout'),
                style: 'destructive',
                onPress: () => {
                    logout(); // This clears all auth data (token, phone, businessId, isLoggedIn)
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Splash' }],
                    });
                },
            },
        ]);
    };

    const menuItems = [
        {
            icon: '🏪',
            label: i18n.t('settings.businessProfile'),
            subtitle: 'Name, type, GSTIN',
            action: () => navigation.navigate('BusinessProfile'),
        },
        {
            icon: '🌐',
            label: i18n.t('settings.language'),
            subtitle: getLanguageLabel(),
            action: () => navigation.navigate('LanguageSelect'),
        },
        {
            icon: '💳',
            label: i18n.t('settings.subscription'),
            subtitle: i18n.t('settings.freePlan'),
            action: () => Alert.alert('Free Plan', 'You are on the free plan. Upgrade coming soon!'),
        },
        {
            icon: '💬',
            label: i18n.t('settings.help'),
            subtitle: 'Chat on WhatsApp',
            action: () => {
                Linking.openURL('https://wa.me/919876543210?text=Hi%20I%20need%20help%20with%20ApnaKhata');
            },
        },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View
                style={{
                    paddingTop: 52,
                    paddingHorizontal: 20,
                    paddingBottom: 12,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, marginRight: 8 }}>⚙️</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>
                        {i18n.t('settings.title')}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <View
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 16,
                        padding: 20,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        marginBottom: 24,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: COLORS.successLight,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 16,
                        }}
                    >
                        <Text style={{ fontSize: 28 }}>🏪</Text>
                    </View>
                    <View>
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '700',
                                color: COLORS.text,
                            }}
                        >
                            {i18n.t('settings.myBusiness')}
                        </Text>
                        <Text
                            style={{
                                fontSize: 13,
                                color: COLORS.textMuted,
                                marginTop: 2,
                            }}
                        >
                            +91 {phone || '---'} · {i18n.t('settings.freePlan')}
                        </Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        overflow: 'hidden',
                        marginBottom: 24,
                    }}
                >
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.label}
                            onPress={item.action}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 16,
                                paddingHorizontal: 20,
                                borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                                borderBottomColor: COLORS.border,
                            }}
                        >
                            <Text style={{ fontSize: 20, marginRight: 14 }}>{item.icon}</Text>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: '600',
                                        color: COLORS.text,
                                    }}
                                >
                                    {item.label}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: COLORS.textMuted,
                                        marginTop: 2,
                                    }}
                                >
                                    {item.subtitle}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 14, color: COLORS.textMuted }}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity
                    onPress={handleLogout}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: COLORS.dangerLight,
                        borderRadius: 12,
                        paddingVertical: 16,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#FECACA',
                        marginBottom: 40,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: COLORS.danger,
                        }}
                    >
                        Logout
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
