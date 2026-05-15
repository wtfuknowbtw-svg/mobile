import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { COLORS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleLocalNotification, isNotificationEnabled, saveNotificationPreferences } from '../utils/notifications';
import { useAppStore } from '../store/useAppStore';

export default function NotificationsScreen() {
    const { language } = useAppStore();
    const [highUdharAlert, setHighUdharAlert] = useState(true);
    const [dailySummary, setDailySummary] = useState(true);
    const [weeklyReminder, setWeeklyReminder] = useState(true);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const prefs = await AsyncStorage.getItem('notification-preferences');
            if (prefs) {
                const parsed = JSON.parse(prefs);
                setHighUdharAlert(parsed.highUdharAlert ?? true);
                setDailySummary(parsed.dailySummary ?? true);
                setWeeklyReminder(parsed.weeklyReminder ?? true);
            }
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
        }
    };

    const savePreferences = async () => {
        try {
            const prefs = {
                highUdharAlert,
                dailySummary,
                weeklyReminder,
            };
            await AsyncStorage.setItem('notification-preferences', JSON.stringify(prefs));

            // Update notification preferences using the correct API
            await saveNotificationPreferences({
                HIGH_UDHAR_ALERT: highUdharAlert,
                DAILY_SUMMARY: dailySummary,
                WEEKLY_REMINDER: weeklyReminder,
                TRANSACTION_ADDED: true,
                TEST: true,
            });
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
        }
    };

    const handleToggle = async (key: string, value: boolean) => {
        if (key === 'highUdharAlert') setHighUdharAlert(value);
        if (key === 'dailySummary') setDailySummary(value);
        if (key === 'weeklyReminder') setWeeklyReminder(value);
        
        await savePreferences();
    };

    const handleTestNotification = async () => {
        try {
            const title = language === 'hi' ? 'टेस्ट नोटिफिकेशन' : 'Test Notification';
            const body = language === 'hi' ? 'यह एक टेस्ट नोटिफिकेशन है' : 'This is a test notification';
            
            await scheduleLocalNotification(title, body, { type: 'TEST' });
            
            Alert.alert(
                language === 'hi' ? 'सफल' : 'Success',
                language === 'hi' ? 'टेस्ट नोटिफिकेशन भेजा गया' : 'Test notification sent'
            );
        } catch (error) {
            console.error('Failed to send test notification:', error);
            Alert.alert(
                language === 'hi' ? 'त्रुटि' : 'Error',
                language === 'hi' ? 'टेस्ट नोटिफिकेशन भेजने में विफल' : 'Failed to send test notification'
            );
        }
    };

    const text = {
        title: language === 'hi' ? 'नोटिफिकेशन सेटिंग्स' : 'Notification Settings',
        highUdharAlert: language === 'hi' ? 'उच्च उधार अलर्ट' : 'High Udhar Alert',
        highUdharAlertDesc: language === 'hi' ? 'जब किसी ग्राहक का कुल उधार ₹1000 से अधिक हो' : 'When customer total udhar exceeds ₹1000',
        dailySummary: language === 'hi' ? 'दैनिक सारांश (रात 8 बजे)' : 'Daily Summary (8 PM)',
        dailySummaryDesc: language === 'hi' ? 'रोजाना रात 8 बजे दिन का सारांश' : 'Daily summary at 8 PM every day',
        weeklyReminder: language === 'hi' ? 'साप्ताहिक अनुस्मारक (सोमवार 10 बजे)' : 'Weekly Reminder (Monday 10 AM)',
        weeklyReminderDesc: language === 'hi' ? 'हर सोमवार सुबह 10 बजे साप्ताहिक अनुस्मारक' : 'Weekly reminder every Monday at 10 AM',
        testNotification: language === 'hi' ? 'टेस्ट नोटिफिकेशन' : 'Test Notification',
        testNotificationDesc: language === 'hi' ? 'एक नमूना नोटिफिकेशन भेजें' : 'Send a sample notification',
    };

    const renderToggle = (
        title: string,
        description: string,
        value: boolean,
        onValueChange: (val: boolean) => void
    ) => (
        <View style={styles.toggleItem}>
            <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>{title}</Text>
                <Text style={styles.toggleDescription}>{description}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={value ? COLORS.primary : COLORS.textMuted}
                ios_backgroundColor={COLORS.border}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title}>{text.title}</Text>

                {/* Toggle Switches */}
                <View style={styles.section}>
                    {renderToggle(
                        text.highUdharAlert,
                        text.highUdharAlertDesc,
                        highUdharAlert,
                        (val) => handleToggle('highUdharAlert', val)
                    )}
                    {renderToggle(
                        text.dailySummary,
                        text.dailySummaryDesc,
                        dailySummary,
                        (val) => handleToggle('dailySummary', val)
                    )}
                    {renderToggle(
                        text.weeklyReminder,
                        text.weeklyReminderDesc,
                        weeklyReminder,
                        (val) => handleToggle('weeklyReminder', val)
                    )}
                </View>

                {/* Test Notification Button */}
                <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
                    <Text style={styles.testButtonText}>{text.testNotification}</Text>
                </TouchableOpacity>
                <Text style={styles.testButtonDesc}>{text.testNotificationDesc}</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 24,
    },
    section: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    toggleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    toggleContent: {
        flex: 1,
        marginRight: 12,
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    toggleDescription: {
        fontSize: 14,
        color: COLORS.textMuted,
        lineHeight: 18,
    },
    testButton: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    testButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
    },
    testButtonDesc: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});
