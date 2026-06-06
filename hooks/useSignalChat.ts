import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { SignalChatSocket, type ChatSocketMessage } from '@/services/signalChatSocket';

export type SignalChatPostPreview = {
  id: number;
  book_title: string;
  book_author: string;
  intent: string;
};

export type SignalChatThread = {
  id: number;
  post: SignalChatPostPreview;
  initiator: { id: number; full_name: string; email: string };
  owner: { id: number; full_name: string; email: string };
  is_owner: boolean;
  other_participant: { id: number; full_name: string; email: string };
  last_message_at: string;
  created_at: string;
};

export type SignalChatMessage = ChatSocketMessage;

function chatListKey(userId: number | undefined) {
  return ['signal-chats', userId] as const;
}

function chatThreadKey(userId: number | undefined, threadId: number | null) {
  return ['signal-chat-thread', userId, threadId] as const;
}

function chatMessagesKey(userId: number | undefined, threadId: number | null) {
  return ['signal-chat-messages', userId, threadId] as const;
}

export function useSignalChatThreads() {
  const { user } = useAuth();
  return useQuery({
    queryKey: chatListKey(user?.id),
    enabled: user?.id != null,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data } = await api.get<{ items: SignalChatThread[] }>('/api/library/chats');
      return data.items;
    },
  });
}

export function useSignalChatThread(threadId: number | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: chatThreadKey(user?.id, threadId),
    enabled: user?.id != null && threadId != null,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data } = await api.get<SignalChatThread>(`/api/library/chats/${threadId}`);
      return data;
    },
  });
}

export function useOpenSignalChat() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (postId: number) => {
      const { data } = await api.post<{ thread: SignalChatThread; messages: SignalChatMessage[] }>(
        `/api/library/feed/${postId}/chat/open`,
      );
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: chatListKey(user?.id) });
      void queryClient.setQueryData(chatThreadKey(user?.id, data.thread.id), data.thread);
      void queryClient.setQueryData(chatMessagesKey(user?.id, data.thread.id), {
        items: data.messages,
        has_more: false,
      });
    },
  });
}

export function useCloseSignalChat() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (threadId: number) => {
      await api.delete(`/api/library/chats/${threadId}`);
    },
    onSuccess: (_data, threadId) => {
      void queryClient.invalidateQueries({ queryKey: chatListKey(user?.id) });
      queryClient.removeQueries({ queryKey: chatThreadKey(user?.id, threadId) });
      queryClient.removeQueries({ queryKey: chatMessagesKey(user?.id, threadId) });
    },
  });
}

export function useSignalChatMessages(threadId: number | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: chatMessagesKey(user?.id, threadId),
    enabled: user?.id != null && threadId != null,
    refetchOnMount: 'always',
    staleTime: 0,
    queryFn: async () => {
      const { data } = await api.get<{ items: SignalChatMessage[]; has_more: boolean }>(
        `/api/library/chats/${threadId}/messages`,
      );
      return data;
    },
  });
}

export function useSignalChatRoom(threadId: number) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const messagesQuery = useSignalChatMessages(threadId);
  const [liveMessages, setLiveMessages] = useState<SignalChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<SignalChatSocket | null>(null);
  const seenIds = useRef(new Set<number>());

  const mergeMessages = useCallback((initial: SignalChatMessage[], live: SignalChatMessage[]) => {
    const map = new Map<number, SignalChatMessage>();
    for (const message of [...initial, ...live]) {
      map.set(message.id, message);
    }
    return [...map.values()].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, []);

  useEffect(() => {
    seenIds.current.clear();
    setLiveMessages([]);
  }, [threadId, userId]);

  useEffect(() => {
    if (messagesQuery.data?.items) {
      for (const message of messagesQuery.data.items) {
        seenIds.current.add(message.id);
      }
    }
  }, [messagesQuery.data?.items]);

  useEffect(() => {
    if (userId == null) return undefined;

    const socket = new SignalChatSocket();
    socketRef.current = socket;

    socket.setHandlers(
      (message) => {
        if (seenIds.current.has(message.id)) return;
        seenIds.current.add(message.id);
        setLiveMessages((prev) => [...prev, message]);
        void queryClient.invalidateQueries({ queryKey: chatMessagesKey(userId, threadId) });
        void queryClient.invalidateQueries({ queryKey: chatListKey(userId) });
      },
      (isConnected) => setConnected(isConnected),
    );

    void socket.connect(threadId);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [threadId, userId, queryClient]);

  const messages = useMemo(
    () => mergeMessages(messagesQuery.data?.items ?? [], liveMessages),
    [liveMessages, mergeMessages, messagesQuery.data?.items],
  );

  const sendMessage = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed || userId == null) return false;

      if (socketRef.current?.send(trimmed)) {
        return true;
      }

      try {
        const { data } = await api.post<SignalChatMessage>(`/api/library/chats/${threadId}/messages`, {
          body: trimmed,
        });
        if (seenIds.current.has(data.id)) return true;
        seenIds.current.add(data.id);
        setLiveMessages((prev) => [...prev, data]);
        void queryClient.invalidateQueries({ queryKey: chatMessagesKey(userId, threadId) });
        void queryClient.invalidateQueries({ queryKey: chatListKey(userId) });
        return true;
      } catch {
        return false;
      }
    },
    [queryClient, threadId, userId],
  );

  return {
    userId,
    messages,
    connected,
    isLoading: messagesQuery.isLoading,
    sendMessage,
    refetch: messagesQuery.refetch,
  };
}
