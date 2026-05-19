import { Stack } from 'expo-router';

export default function AppGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="book-form"
        options={{
          presentation: 'modal',
          title: 'Livro do inventário',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="signal-form"
        options={{
          presentation: 'modal',
          title: 'Novo sinal',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="trade-form"
        options={{
          presentation: 'modal',
          title: 'Propor troca',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
