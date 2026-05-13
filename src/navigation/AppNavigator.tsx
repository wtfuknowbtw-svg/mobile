import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform } from 'react-native';
import { COLORS } from '../constants';
import type { RootStackParamList, MainTabParamList } from '../types';
import i18n from '../i18n';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LanguageSelectScreen from '../screens/LanguageSelectScreen';
import OTPLoginScreen from '../screens/OTPLoginScreen';
import HomeScreen from '../screens/HomeScreen';
import CustomersScreen from '../screens/CustomersScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import VoiceInputScreen from '../screens/VoiceInputScreen';
import CameraScanScreen from '../screens/CameraScanScreen';
import ReviewOCRScreen from '../screens/ReviewOCRScreen';
import ManualEntryScreen from '../screens/ManualEntryScreen';
import CustomerDetailScreen from '../screens/CustomerDetailScreen';
import EditTransactionScreen from '../screens/EditTransactionScreen';
import UdharPaymentScreen from '../screens/UdharPaymentScreen';
import BusinessProfileScreen from '../screens/BusinessProfileScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import UpgradeScreen from '../screens/UpgradeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

/** Get translated tab label */
function getTabLabel(routeName: string) {
    switch (routeName) {
        case 'Home':
            return i18n.t('tabs.home');
        case 'Customers':
            return i18n.t('tabs.customers');
        case 'Reports':
            return i18n.t('tabs.reports');
        case 'Settings':
            return i18n.t('tabs.settings');
        default:
            return routeName;
    }
}

/** Tab icon component */
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
    const icons: Record<string, string> = {
        Home: '🏠',
        Customers: '👥',
        Reports: '📊',
        Settings: '⚙️',
    };

    return (
        <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>{icons[name] || '📱'}</Text>
            {focused && (
                <View
                    style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: COLORS.success,
                        marginTop: 4,
                    }}
                />
            )}
        </View>
    );
}

/** Main tab navigator */
function MainTabs() {
    return (
        <MainTab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <TabIcon name={route.name} focused={focused} />
                ),
                tabBarLabel: ({ focused }) => (
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: focused ? '700' : '500',
                            color: focused ? COLORS.success : COLORS.textMuted,
                            marginTop: -2,
                        }}
                    >
                        {getTabLabel(route.name)}
                    </Text>
                ),
                tabBarStyle: {
                    backgroundColor: COLORS.card,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 24 : Platform.OS === 'web' ? 16 : 12,
                    height: Platform.OS === 'ios' ? 88 : Platform.OS === 'web' ? 72 : 68,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                },
            })}
        >
            <MainTab.Screen name="Home" component={HomeScreen} />
            <MainTab.Screen name="Customers" component={CustomersScreen} />
            <MainTab.Screen name="Reports" component={ReportsScreen} />
            <MainTab.Screen name="Settings" component={SettingsScreen} />
        </MainTab.Navigator>
    );
}

/** Root stack navigator */
export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: COLORS.background },
                }}
            >
                {/* Auth Flow */}
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
                <Stack.Screen name="OTPLogin" component={OTPLoginScreen} />

                {/* Main App */}
                <Stack.Screen
                    name="MainTabs"
                    component={MainTabs}
                    options={{ animation: 'fade' }}
                />

                {/* Feature Screens */}
                <Stack.Screen
                    name="VoiceInput"
                    component={VoiceInputScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                    name="CameraScan"
                    component={CameraScanScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen name="ReviewOCR" component={ReviewOCRScreen} />
                <Stack.Screen
                    name="ManualEntry"
                    component={ManualEntryScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
                <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
                <Stack.Screen name="UdharPayment" component={UdharPaymentScreen} />
                <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
                <Stack.Screen
                    name="Subscription"
                    component={SubscriptionScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                    name="Upgrade"
                    component={UpgradeScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
