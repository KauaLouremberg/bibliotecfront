import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

export default function AuthGroupLayout() {
  const { isReady, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      void logout();
    }
  }, [isAuthenticated, isReady, logout]);

  if (isReady && isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
