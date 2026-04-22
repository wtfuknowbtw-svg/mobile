import React from 'react';
import "./global.css";
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import AppNavigator from './src/navigation/AppNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  // On web, we don't need GestureHandlerRootView or SafeAreaProvider
  if (Platform.OS === 'web') {
    return (
      <QueryClientProvider client={queryClient}>
        <SubscriptionProvider>
          <AppNavigator />
        </SubscriptionProvider>
      </QueryClientProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SubscriptionProvider>
            <AppNavigator />
          </SubscriptionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
