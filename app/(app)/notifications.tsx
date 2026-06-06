import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAppInsets } from '@/hooks/useAppInsets';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type LibraryNotification,
} from '@/hooks/useNotifications';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';

function formatWhen(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function iconForKind(kind: LibraryNotification['kind']) {
  if (kind.startsWith('chat')) return 'comments' as const;
  return 'exchange' as const;
}

export default function NotificationsScreen() {
  const { monochrome } = useInterfaceMode();
  const { topInset } = useAppInsets();
  const notificationsQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  useToastOnQueryError(notificationsQuery, 'Notificações indisponíveis', 'Não foi possível carregar.');

  const refresh = useCallback(() => notificationsQuery.refetch(), [notificationsQuery.refetch]);
  useRefreshOnFocus(refresh);

  const items = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unread_count ?? 0;

  const bg = monochrome ? 'bg-white' : 'bg-[#F5ECD7]';
  const heading = monochrome ? 'text-black' : 'text-[#4A3520]';
  const muted = monochrome ? 'text-neutral-600' : 'text-[#8B6534]';

  const openNotification = useCallback(
    (item: LibraryNotification) => {
      if (!item.read_at) {
        markRead.mutate(item.id);
      }
      if (item.thread_id) {
        router.push({
          pathname: '/(app)/signal-chat/[threadId]',
          params: { threadId: String(item.thread_id) },
        });
        return;
      }
      if (item.trade_id) {
        router.push('/(app)/(tabs)/trades');
        return;
      }
      router.push('/(app)/(tabs)/two');
    },
    [markRead],
  );

  return (
    <View className={`flex-1 ${bg}`} style={{ paddingTop: topInset }}>
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <BackButton fallbackHref="/(app)/(tabs)" />
        <Text className={`text-lg font-extrabold ${heading}`}>Notificações</Text>
        <TouchableOpacity
          accessibilityLabel="Conversas"
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => router.push('/(app)/chats')}>
          <FontAwesome name="comments" size={18} color={monochrome ? '#111' : '#8B6534'} />
        </TouchableOpacity>
      </View>

      {unreadCount > 0 ? (
        <View className="flex-row items-center justify-between px-4 pb-3">
          <Text className={`text-sm ${muted}`}>{unreadCount} não lidas</Text>
          <Button
            variant="secondary"
            className="px-4 py-2"
            loading={markAllRead.isPending}
            onPress={() => markAllRead.mutate()}>
            Marcar todas como lidas
          </Button>
        </View>
      ) : null}

      {notificationsQuery.isPending && !notificationsQuery.data ? (
        <View className="flex-1 items-center justify-center">
          <Text className={muted}>Carregando…</Text>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <FontAwesome name="bell-slash" size={40} color={monochrome ? '#ccc' : '#C9A96E'} style={{ opacity: 0.4 }} />
          <Text className={`mt-4 text-center text-base ${muted}`}>
            Nenhuma notificação ainda. Chats novos e atualizações de trocas aparecem aqui.
          </Text>
          <Button className="mt-6" variant="secondary" onPress={() => router.push('/(app)/chats')}>
            Ver conversas
          </Button>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="gap-3 px-4 pb-6"
          refreshControl={
            <RefreshControl
              refreshing={notificationsQuery.isRefetching}
              tintColor={monochrome ? '#111' : '#8B6534'}
              onRefresh={() => void refresh()}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => openNotification(item)}
              className={`rounded-[22px] border px-4 py-4 ${
                item.read_at
                  ? monochrome
                    ? 'border-neutral-200 bg-white'
                    : 'border-[#C9A96E]/25 bg-white/60'
                  : monochrome
                    ? 'border-black bg-neutral-100'
                    : 'border-[#8B6534] bg-white'
              }`}>
              <View className="flex-row items-start gap-3">
                <View
                  className={`mt-0.5 h-10 w-10 items-center justify-center rounded-full ${
                    monochrome ? 'bg-neutral-200' : 'bg-[#E8D5B0]'
                  }`}>
                  <FontAwesome name={iconForKind(item.kind)} size={16} color={monochrome ? '#111' : '#8B6534'} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className={`flex-1 text-base font-bold ${heading}`}>{item.title}</Text>
                    {!item.read_at ? (
                      <View className="mt-1 h-2.5 w-2.5 rounded-full bg-[#8B6534]" />
                    ) : null}
                  </View>
                  <Text className={`mt-1 text-sm leading-6 ${muted}`}>{item.body}</Text>
                  <Text className={`mt-2 text-xs ${muted}`}>{formatWhen(item.created_at)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
