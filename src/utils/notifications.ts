import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { API_BASE_URL } from '../constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type NotificationType = 'HIGH_UDHAR_ALERT' | 'DAILY_SUMMARY' | 'WEEKLY_REMINDER' | 'TRANSACTION_ADDED' | 'TEST';

export interface NotificationData {
  type: NotificationType;
  customerName?: string;
  amount?: number;
  given?: number;
  received?: number;
  count?: number;
  total?: number;
  language?: 'hi' | 'en';
  // Index signature required by expo-notifications' NotificationContentInput.data: Record<string, unknown>
  [key: string]: unknown;
}

// Register for push notifications
export async function registerForPushNotifications(businessId: string, phone: string): Promise<string | null> {
  try {
    // Check if running in Expo Go (remote notifications are not supported in Expo Go client on SDK 53)
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      console.log('Push Token Registration bypassed: Remote push notifications are not supported in Expo Go client on SDK 53. Use a development build to test remote notifications.');
      return null;
    }

    // Check if device supports push notifications
    if (!Device.isDevice) {
      console.log('Push notifications are not supported on simulator/emulator');
      return null;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID || undefined,
    });
    const pushToken = tokenData.data;

    console.log('Expo Push Token:', pushToken);

    // Save token to backend
    await savePushTokenToBackend(businessId, phone, pushToken);

    // Save token locally
    await AsyncStorage.setItem('pushToken', pushToken);

    return pushToken;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

// Save push token to backend
async function savePushTokenToBackend(businessId: string, phone: string, pushToken: string): Promise<void> {
  try {
    const url = `${API_BASE_URL}/notifications/register`;
    console.log('Saving push token to backend:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId,
        phone,
        pushToken,
      }),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('Backend response (JSON):', data);
    } else {
      const text = await response.text();
      console.log('Backend response (Text/HTML):', text.substring(0, 100));
      throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(data?.error || `Failed to save push token to backend: ${response.status}`);
    }

    console.log('Push token saved to backend successfully');
  } catch (error) {
    console.error('Error saving push token to backend:', error);
    throw error;
  }
}

// Schedule local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: NotificationData,
  trigger: Notifications.NotificationTriggerInput | null = null
): Promise<string> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger,
    });

    console.log('Notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

// Cancel scheduled notification
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('Notification cancelled:', notificationId);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}

// Get notification content based on type and language
function getNotificationContent(type: NotificationType, data: NotificationData): { title: string; body: string } {
  const language = data.language || 'en';

  switch (type) {
    case 'HIGH_UDHAR_ALERT':
      if (language === 'hi') {
        return {
          title: '⚠️ ज़्यादा उधार!',
          body: `${data.customerName} का उधार ₹${data.amount} हो गया`,
        };
      }
      return {
        title: '⚠️ High Credit Alert!',
        body: `${data.customerName}'s credit crossed ₹${data.amount}`,
      };

    case 'DAILY_SUMMARY':
      if (language === 'hi') {
        return {
          title: '📊 आज का हिसाब',
          body: 'आज का हिसाब देखें',
        };
      }
      return {
        title: '📊 Daily Summary',
        body: "Check today's summary",
      };

    case 'WEEKLY_REMINDER':
      if (language === 'hi') {
        return {
          title: '📅 साप्ताहिक याद',
          body: 'इस हफ्ते का हिसाब देखें',
        };
      }
      return {
        title: '📅 Weekly Reminder',
        body: "Check this week's summary",
      };



    default:
      return {
        title: 'ApnaKhata',
        body: 'New notification',
      };
  }
}

// Trigger HIGH_UDHAR_ALERT notification (instant, local)
export async function triggerHighUdharAlert(
  customerName: string,
  amount: number,
  language: 'hi' | 'en' = 'hi'
): Promise<void> {
  const content = getNotificationContent('HIGH_UDHAR_ALERT', {
    type: 'HIGH_UDHAR_ALERT',
    customerName,
    amount,
    language,
  });

  await scheduleLocalNotification(content.title, content.body, {
    type: 'HIGH_UDHAR_ALERT',
    customerName,
    amount,
    language,
  });
}



// Schedule DAILY_SUMMARY notification (8pm every day)
export async function scheduleDailySummary(
  language: 'hi' | 'en' = 'hi'
): Promise<string> {
  const content = getNotificationContent('DAILY_SUMMARY', {
    type: 'DAILY_SUMMARY',
    language,
  });

  // Schedule for 8pm daily
  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    channelId: 'default',
    hour: 20,
    minute: 0,
  };

  return await scheduleLocalNotification(content.title, content.body, {
    type: 'DAILY_SUMMARY',
    language,
  }, trigger);
}

// Schedule WEEKLY_REMINDER notification (Monday 10am)
export async function scheduleWeeklyReminder(
  language: 'hi' | 'en' = 'hi'
): Promise<string> {
  const content = getNotificationContent('WEEKLY_REMINDER', {
    type: 'WEEKLY_REMINDER',
    language,
  });

  // Schedule for Monday 10am weekly
  const trigger: Notifications.WeeklyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    channelId: 'default',
    weekday: 2, // Monday (1 = Sunday, 2 = Monday, per expo-notifications convention)
    hour: 10,
    minute: 0,
  };

  return await scheduleLocalNotification(content.title, content.body, {
    type: 'WEEKLY_REMINDER',
    language,
  }, trigger);
}

// Get notification preferences from AsyncStorage
export async function getNotificationPreferences(): Promise<Record<NotificationType, boolean>> {
  try {
    const prefs = await AsyncStorage.getItem('notificationPreferences');
    if (prefs) {
      return JSON.parse(prefs);
    }

    // Default preferences
    const defaultPrefs: Record<NotificationType, boolean> = {
      HIGH_UDHAR_ALERT: true,
      DAILY_SUMMARY: true,
      WEEKLY_REMINDER: true,
      TRANSACTION_ADDED: true,
      TEST: true,
    };

    await AsyncStorage.setItem('notificationPreferences', JSON.stringify(defaultPrefs));
    return defaultPrefs;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return {
      HIGH_UDHAR_ALERT: true,
      DAILY_SUMMARY: true,
      WEEKLY_REMINDER: true,
      TRANSACTION_ADDED: true,
      TEST: true,
    };
  }
}

// Save notification preferences to AsyncStorage
export async function saveNotificationPreferences(
  preferences: Record<NotificationType, boolean>
): Promise<void> {
  try {
    await AsyncStorage.setItem('notificationPreferences', JSON.stringify(preferences));
    console.log('Notification preferences saved:', preferences);
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
}

// Check if notification type is enabled
export async function isNotificationEnabled(type: NotificationType): Promise<boolean> {
  const prefs = await getNotificationPreferences();
  return prefs[type] || false;
}
