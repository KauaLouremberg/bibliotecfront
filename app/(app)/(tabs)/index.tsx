import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
      <Text className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-slate-50">
        Olá{user?.full_name ? `, ${user.full_name}` : ''}
      </Text>
      <Text className="mb-8 text-center text-base text-slate-600 dark:text-slate-300">
        {user?.email ?? 'Sessão iniciada.'}
      </Text>
      <Button variant="secondary" onPress={() => void logout()}>
        Sair
      </Button>
    </View>
  );
}
