import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from 'react-query';
import FlashMessage from 'react-native-flash-message';
import { Provider as PaperProvider } from 'react-native-paper';

import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';
import { initializeApp } from './src/utils/appInitializer';

// Ignore specific warnings
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Setting a timer',
  'AsyncStorage has been extracted',
]);

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
    },
  },
});

const App = () => {
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <NotificationProvider>
                <SocketProvider>
                  <NavigationContainer>
                    <StatusBar
                      barStyle="dark-content"
                      backgroundColor="#FFFFFF"
                      translucent={false}
                    />
                    <AppNavigator />
                  </NavigationContainer>
                  <FlashMessage position="top" />
                </SocketProvider>
              </NotificationProvider>
            </AuthProvider>
          </QueryClientProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;