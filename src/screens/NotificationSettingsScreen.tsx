import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { 
    getNotificationPreferences, 
    saveNotificationPreferences, 
    registerForPushNotifications,
    NotificationType 
} from '../utils/notifications';
import { useAppStore } from '../store/useAppStore';

interface NotificationSettingsScreenProps {
    navigation: any;
}

export default function NotificationSettingsScreen({ navigation }: NotificationSettingsScreenProps) {
    const { businessId, phone, language } = useAppStore();
    const [isLoading, setIsLoading] = useState(true);
    const [preferences, setPreferences] = useState<Record<NotificationType, boolean>>({
        HIGH_UDHAR_ALERT: true,
        DAILY_SUMMARY: true,
        WEEKLY_REMINDER: true,
        TRANSACTION_ADDED: true,
        TEST: true,
    });

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const prefs = await getNotificationPreferences();
            setPreferences(prefs);
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePreference = async (type: NotificationType) => {
        const newPrefs = { ...preferences, [type]: !preferences[type] };
        setPreferences(newPrefs);
        await saveNotificationPreferences(newPrefs);
    };

    const handleEnableNotifications = async () => {
        setIsLoading(true);
        try {
            const token = await registerForPushNotifications(businessId || '', phone || '');
            if (token) {
                Alert.alert(
                    language === 'hi' ? 'सफल' : 'Success',
                    language === 'hi' ? 'नोटिफिकेशन सक्रिय कर दिए गए हैं!' : 'Notifications have been enabled!'
                );
            } else {
                Alert.alert(
                    language === 'hi' ? 'सूचना' : 'Notice',
                    language === 'hi' 
                        ? 'नोटिफिकेशन अनुमति नहीं मिली। कृपया फोन सेटिंग्स में इसे चालू करें।' 
                        : 'Notification permission not granted. Please enable it in phone settings.'
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to enable notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const text = {
        title: language === 'hi' ? 'नोटिफिकेशन सेटिंग्स' : 'Notification Settings',
        enableBtn: language === 'hi' ? 'नोटिफिकेशन सक्षम करें' : 'Enable Notifications',
        highUdhar: language === 'hi' ? 'ज़्यादा उधार अलर्ट' : 'High Udhar Alert',
        highUdharDesc: language === 'hi' ? 'जब किसी का उधार सीमा से बाहर हो जाए' : 'When someone\'s credit crosses the limit',
        dailySummary: language === 'hi' ? 'दैनिक सारांश' : 'Daily Summary',
        dailySummaryDesc: language === 'hi' ? 'हर शाम 8 बजे आज का हिसाब' : 'Every evening at 8pm today\'s summary',
        weeklyReminder: language === 'hi' ? 'साप्ताहिक याद' : 'Weekly Reminder',
        weeklyReminderDesc: language === 'hi' ? 'सोमवार सुबह बकाया राशि की याद' : 'Monday morning reminder of dues',
        transAdded: language === 'hi' ? 'लेन-देन की पुष्टि' : 'Transaction Confirmation',
        transAddedDesc: language === 'hi' ? 'नया लेन-देन जोड़ने पर तुरंत सूचना' : 'Instant notice when adding transactions',
    };

    const renderSettingItem = (
        type: NotificationType, 
        label: string, 
        description: string, 
        icon: string
    ) => (
        <View style={styles.settingItem}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon as any} size={24} color={COLORS.primary} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.settingLabel}>{label}</Text>
                <Text style={styles.settingDescription}>{description}</Text>
            </View>
            <Switch
                trackColor={{ false: '#D1D5DB', true: COLORS.primary + '80' }}
                thumbColor={preferences[type] ? COLORS.primary : '#F3F4F6'}
                ios_backgroundColor="#D1D5DB"
                onValueChange={() => togglePreference(type)}
                value={preferences[type]}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{text.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.promoCard}>
                        <View style={styles.promoTextContainer}>
                            <Text style={styles.promoTitle}>
                                {language === 'hi' ? 'अपडेट रहें!' : 'Stay Updated!'}
                            </Text>
                            <Text style={styles.promoDesc}>
                                {language === 'hi' 
                                    ? 'अपने व्यापार की हर खबर सीधे अपने फोन पर पाएं।' 
                                    : 'Get every update about your business directly on your phone.'}
                            </Text>
                        </View>
                        <Ionicons name="notifications" size={48} color={COLORS.white} style={{ opacity: 0.3 }} />
                    </View>

                    <TouchableOpacity 
                        style={styles.enableButton}
                        onPress={handleEnableNotifications}
                    >
                        <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
                        <Text style={styles.enableButtonText}>{text.enableBtn}</Text>
                    </TouchableOpacity>

                    <View style={styles.section}>
                        {renderSettingItem(
                            'HIGH_UDHAR_ALERT', 
                            text.highUdhar, 
                            text.highUdharDesc, 
                            'warning-outline'
                        )}
                        {renderSettingItem(
                            'DAILY_SUMMARY', 
                            text.dailySummary, 
                            text.dailySummaryDesc, 
                            'stats-chart-outline'
                        )}
                        {renderSettingItem(
                            'WEEKLY_REMINDER', 
                            text.weeklyReminder, 
                            text.weeklyReminderDesc, 
                            'calendar-outline'
                        )}
                        {renderSettingItem(
                            'TRANSACTION_ADDED', 
                            text.transAdded, 
                            text.transAddedDesc, 
                            'checkmark-circle-outline'
                        )}
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>
                            {language === 'hi'
                                ? 'हम आपकी गोपनीयता का सम्मान करते हैं। केवल महत्वपूर्ण अपडेट ही भेजे जाएंगे।'
                                : 'We respect your privacy. Only important updates will be sent.'}
                        </Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 60,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    promoCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    promoTextContainer: {
        flex: 1,
        marginRight: 12,
    },
    promoTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: 8,
    },
    promoDesc: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 20,
    },
    enableButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 16,
        marginBottom: 32,
    },
    enableButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 10,
    },
    section: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border + '50',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 40,
        paddingHorizontal: 16,
    },
    infoText: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginLeft: 8,
        flex: 1,
    },
});
