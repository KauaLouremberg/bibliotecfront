import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  KeyboardProvider,
  KeyboardStickyView,
  useKeyboardState,
} from 'react-native-keyboard-controller';

import { BackButton } from '@/components/BackButton';
import { postIntentLabels } from '@/constants/library';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAppInsets } from '@/hooks/useAppInsets';
import { useCloseSignalChat, useSignalChatRoom, useSignalChatThread } from '@/hooks/useSignalChat';
import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast, showSuccessToast } from '@/utils/feedback';

const CHAT_INPUT_NATIVE_ID = 'signal-chat-input';
const MIN_COMPOSER_HEIGHT = 72;

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function participantLabel(fullName: string, email: string) {
  return fullName.trim() || email;
}

export default function SignalChatScreen() {
  const { threadId: threadIdParam } = useLocalSearchParams<{ threadId: string }>();
  const threadId = Number(threadIdParam);
  const { monochrome } = useInterfaceMode();
  const { topInset, insets } = useAppInsets();
  const keyboardHeight = useKeyboardState((state) => (state.isVisible ? state.height : 0));
  const listRef = useRef<FlatList>(null);
  const [composerHeight, setComposerHeight] = useState(MIN_COMPOSER_HEIGHT);
  const threadQuery = useSignalChatThread(Number.isFinite(threadId) ? threadId : null);
  const { messages, connected, isLoading, sendMessage, userId } = useSignalChatRoom(threadId);
  const closeChat = useCloseSignalChat();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const heading = monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white';
  const muted = monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400';
  const pageBg = monochrome ? 'bg-white' : 'bg-[#F5ECD7] dark:bg-[#4A3520]';
  const bubbleMine = monochrome ? 'bg-black' : 'bg-[#4A3520]';
  const bubbleOther = monochrome ? 'bg-neutral-100' : 'bg-white dark:bg-stone-800';
  const inputBg = monochrome ? 'border-neutral-300 bg-white' : 'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-900';

  const stickyOffset = useMemo(() => ({ closed: 0, opened: 0 }), []);
  const listBottomPad = keyboardHeight > 0 ? composerHeight + keyboardHeight : composerHeight + 8;

  const thread = threadQuery.data;
  const otherName = thread
    ? participantLabel(thread.other_participant.full_name, thread.other_participant.email)
    : '…';
  const bookTitle = thread?.post.book_title ?? 'Sinal';
  const bookAuthor = thread?.post.book_author;
  const intentLabel = thread ? postIntentLabels[thread.post.intent as keyof typeof postIntentLabels] : null;

  useEffect(() => {
    if (keyboardHeight > 0 && messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [keyboardHeight, messages.length]);

  const headerSubtitle = useMemo(() => {
    if (threadQuery.isLoading) return 'Carregando conversa…';
    if (!connected && messages.length > 0) return 'Reconectando…';
    if (!connected) return 'Conectando…';
    return 'Mensagens salvas nesta conversa';
  }, [connected, messages.length, threadQuery.isLoading]);

  if (!Number.isFinite(threadId)) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${pageBg}`}>
        <Text className={`text-center text-base ${muted}`}>Conversa inválida.</Text>
      </View>
    );
  }

  async function handleSend() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const sent = await sendMessage(body);
      if (sent) {
        setDraft('');
      } else {
        showErrorToast('Não foi possível enviar', 'Verifique a conexão e tente novamente.');
      }
    } finally {
      setSending(false);
    }
  }

  function confirmCloseChat() {
    Alert.alert(
      'Encerrar conversa',
      'Todas as mensagens serão apagadas para você e para a outra pessoa. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await closeChat.mutateAsync(threadId);
                showSuccessToast('Conversa encerrada', 'O histórico foi removido.');
                router.back();
              } catch (error) {
                showErrorToast(
                  'Não foi possível encerrar',
                  extractApiErrorMessage(error, 'Tente novamente em instantes.'),
                );
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <KeyboardProvider preserveEdgeToEdge>
    <View className={`flex-1 ${pageBg}`}>
      <View className="border-b border-stone-200 px-5 pb-4 dark:border-stone-700" style={{ paddingTop: topInset }}>
        <View className="mb-3 flex-row items-center justify-between">
          <BackButton color={monochrome ? '#111' : '#4A3520'} fallbackHref="/(app)/chats" />
          <TouchableOpacity
            disabled={closeChat.isPending}
            onPress={confirmCloseChat}
            className="rounded-xl px-3 py-2">
            <Text className={`text-xs font-bold ${monochrome ? 'text-red-600' : 'text-red-500'}`}>
              {closeChat.isPending ? 'Encerrando…' : 'Encerrar conversa'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className={`text-2xl font-black ${heading}`}>{otherName}</Text>
        <Text className={`mt-1 text-base font-semibold ${heading}`}>{bookTitle}</Text>
        {bookAuthor ? <Text className={`mt-0.5 text-sm ${muted}`}>{bookAuthor}</Text> : null}
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          {intentLabel ? (
            <Text className={`rounded-full px-3 py-1 text-xs font-semibold ${monochrome ? 'bg-neutral-100 text-neutral-700' : 'bg-[#8B6534]/15 text-[#8B6534]'}`}>
              {intentLabel}
            </Text>
          ) : null}
          <Text className={`text-xs ${muted}`}>{headerSubtitle}</Text>
        </View>
      </View>

      <View className="flex-1">
        {isLoading || threadQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={monochrome ? '#111' : '#8B6534'} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            className="flex-1 px-4"
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: listBottomPad }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => {
              if (keyboardHeight > 0) {
                listRef.current?.scrollToEnd({ animated: true });
              }
            }}
            renderItem={({ item }) => {
              const mine = item.sender_id === userId;
              return (
                <View className={`mb-3 max-w-[85%] ${mine ? 'self-end' : 'self-start'}`}>
                  <Text className={`mb-1 text-xs font-semibold ${mine ? 'text-right' : ''} ${muted}`}>
                    {item.sender_name}
                  </Text>
                  <View className={`rounded-2xl px-4 py-3 ${mine ? bubbleMine : bubbleOther}`}>
                    <Text className={`text-base leading-6 ${mine ? 'text-white' : heading}`}>{item.body}</Text>
                  </View>
                  <Text className={`mt-1 text-[11px] ${muted} ${mine ? 'text-right' : ''}`}>
                    {formatTime(item.created_at)}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-6 py-16">
                <Text className={`text-center text-base ${muted}`}>
                  Envie a primeira mensagem para {otherName} sobre «{bookTitle}».
                </Text>
              </View>
            }
          />
        )}

        <KeyboardStickyView offset={stickyOffset}>
          <View
            className={`border-t px-4 pt-3 ${inputBg}`}
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
            onLayout={(event) => {
              const nextHeight = event.nativeEvent.layout.height;
              if (nextHeight > 0 && Math.abs(nextHeight - composerHeight) > 1) {
                setComposerHeight(nextHeight);
              }
            }}>
            <View className="flex-row items-end gap-2">
              <TextInput
                nativeID={CHAT_INPUT_NATIVE_ID}
                className={`max-h-28 min-h-[44px] flex-1 rounded-2xl border px-4 py-3 text-base ${inputBg} ${heading}`}
                placeholder={`Mensagem para ${otherName}…`}
                placeholderTextColor={monochrome ? '#737373' : '#78716c'}
                value={draft}
                onChangeText={setDraft}
                multiline
                editable={!sending}
              />
              <TouchableOpacity
                className={`rounded-2xl px-4 py-3 ${monochrome ? 'bg-black' : 'bg-[#8B6534]'} ${sending ? 'opacity-60' : ''}`}
                disabled={sending}
                onPress={() => void handleSend()}>
                <Text className="font-bold text-white">{sending ? '…' : 'Enviar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardStickyView>
      </View>
    </View>
    </KeyboardProvider>
  );
}
