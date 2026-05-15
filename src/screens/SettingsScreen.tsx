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
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { useSubscription } from '../context/SubscriptionContext';
import i18n from '../i18n';

interface SettingsScreenProps {
    navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
    const { logout, phone, language, business } = useAppStore();
    const { plan } = useSubscription();

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

    const getBusinessInitial = () => {
        return business?.name ? business.name.charAt(0).toUpperCase() : 'B';
    };

    const handleLogout = () => {
        Alert.alert(
            language === 'hi' ? 'लॉगआउट' : 'Logout',
            language === 'hi' ? 'क्या आप वाकई logout करना चाहते हैं?' : 'Are you sure you want to logout?',
            [
                { text: i18n.t('common.cancel'), style: 'cancel' },
                {
                    text: language === 'hi' ? 'लॉगआउट' : 'Logout',
                    style: 'destructive',
                    onPress: () => {
                        logout(); // This clears all auth data (token, phone, businessId, isLoggedIn)
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Splash' }],
                        });
                    },
                },
            ]
        );
    };

    const businessMenuItems = [
        {
            icon: 'storefront-outline',
            iconColor: COLORS.primary,
            label: i18n.t('settings.businessProfile'),
            subtitle: 'Name, type, GSTIN',
            action: () => navigation.navigate('BusinessProfile'),
        },
        {
            icon: 'bar-chart-outline',
            iconColor: COLORS.primary,
            label: 'Reports',
            subtitle: 'View detailed reports',
            action: () => navigation.navigate('Reports'),
        },
    ];

    const preferencesMenuItems = [
        {
            icon: 'language-outline',
            iconColor: COLORS.primary,
            label: i18n.t('settings.language'),
            subtitle: getLanguageLabel(),
            action: () => navigation.navigate('LanguageSelect'),
        },
        {
            icon: 'notifications-outline',
            iconColor: COLORS.textMuted,
            label: 'Notifications',
            subtitle: 'Coming soon',
            action: () => {},
            disabled: true,
        },
    ];

    const accountMenuItems = [
        {
            icon: 'card-outline',
            iconColor: COLORS.primary,
            label: i18n.t('settings.subscription'),
            subtitle: plan === 'free' ? i18n.t('settings.freePlan') : 'Pro Plan',
            action: () => navigation.navigate('Subscription'),
        },
        {
            icon: 'help-circle-outline',
            iconColor: COLORS.primary,
            label: i18n.t('settings.help'),
            subtitle: 'Chat on WhatsApp',
            action: () => {
                Linking.openURL('https://wa.me/919876543210?text=Hi%20I%20need%20help%20with%20ApnaKhata');
            },
        },
        {
            icon: 'star-outline',
            iconColor: COLORS.primary,
            label: 'Rate ApnaKhata',
            subtitle: 'Opens Play Store',
            action: () => {
                Linking.openURL('https://play.google.com/store/apps/details?id=com.apnakhata.app');
            },
        },
    ];

    const renderMenuItem = (item: any, index: number, items: any[]) => (
        <TouchableOpacity
            key={item.label}
            onPress={item.action}
            activeOpacity={item.disabled ? 1 : 0.7}
            disabled={item.disabled}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: 56,
                paddingHorizontal: 16,
                borderBottomWidth: index < items.length - 1 ? 1 : 0,
                borderBottomColor: COLORS.border,
            }}
        >
            <View
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: item.disabled ? '#F3F4F6' : `${item.iconColor}15`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                }}
            >
                <Ionicons name={item.icon as any} size={20} color={item.disabled ? COLORS.textMuted : item.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: item.disabled ? COLORS.textMuted : COLORS.text,
                    }}
                >
                    {item.label}
                </Text>
                <Text
                    style={{
                        fontSize: 12,
                        color: COLORS.textMuted,
                        marginTop: 1,
                    }}
                >
                    {item.subtitle}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View
                style={{
                    paddingTop: 52,
                    paddingHorizontal: 20,
                    paddingBottom: 16,
                }}
            >
                <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.text }}>
                    {i18n.t('settings.title')}
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <View
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 16,
                        padding: 24,
                        marginBottom: 24,
                        marginHorizontal: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                        borderTopWidth: 4,
                        borderTopColor: COLORS.primary,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <View
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                backgroundColor: COLORS.primary,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 16,
                            }}
                        >
                            <Text style={{ fontSize: 36, fontWeight: '800', color: COLORS.secondary }}>
                                {getBusinessInitial()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontSize: 22,
                                    fontWeight: '700',
                                    color: COLORS.text,
                                    marginBottom: 4,
                                }}
                            >
                                {business?.name || 'My Business'}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: COLORS.textMuted,
                                    marginBottom: 8,
                                }}
                            >
                                +91 {phone || '---'}
                            </Text>
                            <View
                                style={{
                                    backgroundColor: plan === 'free' ? '#F3F4F6' : '#FFF8E1',
                                    paddingHorizontal: 12,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                    alignSelf: 'flex-start',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: '600',
                                        color: plan === 'free' ? COLORS.textMuted : COLORS.secondary,
                                    }}
                                >
                                    {plan === 'free' ? 'Free Plan' : 'Pro'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('BusinessProfile')}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 12,
                            borderWidth: 1,
                            borderColor: COLORS.primary,
                            borderRadius: 12,
                        }}
                    >
                        <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginLeft: 8 }}>
                            Edit Profile
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Section 1 - Business */}
                <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 }}>
                        BUSINESS
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 16,
                        marginBottom: 24,
                        marginHorizontal: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                    }}
                >
                    {businessMenuItems.map((item, index) => renderMenuItem(item, index, businessMenuItems))}
                </View>

                {/* Section 2 - Preferences */}
                <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 }}>
                        PREFERENCES
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 16,
                        marginBottom: 24,
                        marginHorizontal: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                    }}
                >
                    {preferencesMenuItems.map((item, index) => renderMenuItem(item, index, preferencesMenuItems))}
                </View>

                {/* Section 3 - Account */}
                <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 }}>
                        ACCOUNT
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: COLORS.card,
                        borderRadius: 16,
                        marginBottom: 24,
                        marginHorizontal: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                    }}
                >
                    {accountMenuItems.map((item, index) => renderMenuItem(item, index, accountMenuItems))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    onPress={handleLogout}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: COLORS.card,
                        borderWidth: 1,
                        borderColor: COLORS.danger,
                        borderRadius: 12,
                        paddingVertical: 16,
                        alignItems: 'center',
                        marginHorizontal: 20,
                        marginBottom: 24,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: COLORS.danger,
                        }}
                    >
                        {language === 'hi' ? 'लॉगआउट' : 'Logout'}
                    </Text>
                </TouchableOpacity>

                {/* App Info */}
                <View style={{ alignItems: 'center', marginBottom: 40 }}>
                    <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>
                        ApnaKhata v1.0.0
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                        Made with ❤️ in India
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
