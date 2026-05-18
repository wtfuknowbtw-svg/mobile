import React from 'react';
import { Platform, ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, useIsRestoring } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import AppNavigator from './src/navigation/AppNavigator';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import NetInfo from '@react-native-community/netinfo';

let isOffline = false;
NetInfo.addEventListener(state => {
  isOffline = !state.isConnected;
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 minutes
      gcTime: 1000 * 60 * 60 * 24,    // 24 hours
      retry: (count, error) => !isOffline && count < 2,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

function AppContent() {
  const isRestoring = useIsRestoring();

  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#1A3C6E" />
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 86400000 }}
      >
        <SubscriptionProvider>
          <AppContent />
        </SubscriptionProvider>
      </PersistQueryClientProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister, maxAge: 86400000 }}
        >
          <SubscriptionProvider>
            <AppContent />
          </SubscriptionProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
