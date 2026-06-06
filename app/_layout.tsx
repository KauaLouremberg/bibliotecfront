import FontAwesome from '@expo/vector-icons/FontAwesome';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import ToastManager from 'toastify-react-native';

import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { InterfaceProvider, useInterfaceMode } from '@/contexts/InterfaceContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.warn('Fontes opcionais não carregaram; app continua sem SpaceMono.', error);
    }
  }, [error]);

  const fontsReady = loaded || !!error;

  useEffect(() => {
    if (fontsReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <InterfaceProvider>
          <AuthProvider>
            <RootLayoutNav />
            <ToastHost />
          </AuthProvider>
        </InterfaceProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function ToastHost() {
  const insets = useSafeAreaInsets();

  return (
    <ToastManager
      animationStyle="slide"
      closeIconColor="#F5ECD7"
      duration={4000}
      iconSize={22}
      minHeight={72}
      position="top"
      showCloseIcon
      showProgressBar
      style={{
        borderColor: '#C9A96E',
        borderRadius: 22,
        borderWidth: 1,
        overflow: 'hidden',
        paddingVertical: 8,
      }}
      textStyle={{ fontWeight: '700' }}
      topOffset={Math.max(insets.top + 12, 24)}
      useModal
      width="92%"
    />
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { monochrome } = useInterfaceMode();
  const navigationTheme = monochrome
    ? {
        ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
        colors: {
          ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
          primary: colorScheme === 'dark' ? '#ffffff' : '#000000',
          background: colorScheme === 'dark' ? '#000000' : '#ffffff',
          card: colorScheme === 'dark' ? '#090909' : '#ffffff',
          text: colorScheme === 'dark' ? '#ffffff' : '#000000',
          border: colorScheme === 'dark' ? '#404040' : '#d4d4d4',
          notification: colorScheme === 'dark' ? '#ffffff' : '#000000',
        },
      }
    : {
        ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
        colors: {
          ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
          primary: '#8B6534',
          background: colorScheme === 'dark' ? '#4A3520' : '#F5ECD7',
          card: colorScheme === 'dark' ? '#4A3520' : '#F5ECD7',
          text: colorScheme === 'dark' ? '#F5ECD7' : '#4A3520',
          border: '#C9A96E',
          notification: '#8B6534',
        },
      };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
