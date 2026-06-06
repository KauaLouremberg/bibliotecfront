import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';

export type NotificationKind =
  | 'chat_started'
  | 'chat_message'
  | 'trade_received'
  | 'trade_accepted'
  | 'trade_rejected'
  | 'trade_completed';

export type LibraryNotification = {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  thread_id: number | null;
  trade_id: number | null;
  post_id: number | null;
  actor: { id: number; full_name: string; email: string } | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationCollection = {
  items: LibraryNotification[];
  unread_count: number;
};

function notificationsKey(userId: number | undefined) {
  return ['library', 'notifications', userId] as const;
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: notificationsKey(user?.id),
    enabled: user?.id != null,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data } = await api.get<NotificationCollection>('/api/library/notifications');
      return data;
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const { data } = await api.patch<LibraryNotification>(
        `/api/library/notifications/${notificationId}/read`,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey(user?.id) });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      await api.post('/api/library/notifications/read-all');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey(user?.id) });
    },
  });
}

export function useUnreadNotificationCount() {
  const query = useNotifications();
  return query.data?.unread_count ?? 0;
}
