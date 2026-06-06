import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { Button } from '@/components/Button';
import { SignalReelCard } from '@/components/SignalReelCard';
import { SignalSearchBar, createEmptySignalSearch, hasActiveSignalSearch } from '@/components/SignalSearchBar';
import { SignalSearchCard } from '@/components/SignalSearchCard';
import { useCommunityFeedContext } from '@/contexts/CommunityFeedContext';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useCommunityFeed, type SocialPost } from '@/hooks/useLibrary';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useOpenSignalChat, useSignalChatThreads } from '@/hooks/useSignalChat';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';
import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast } from '@/utils/feedback';

export default function CommunityFeedScreen() {
  const { monochrome } = useInterfaceMode();
  const { searchMode, setSearchMode, registerOpenSearch } = useCommunityFeedContext();

  const [searchValues, setSearchValues] = useState(createEmptySignalSearch);
  const deferredSearch = useDeferredValue(searchValues);

  const feedFilters = searchMode
    ? { search: deferredSearch.search, intent: deferredSearch.intent }
    : undefined;
  const feedQuery = useCommunityFeed(feedFilters);
  const chatsQuery = useSignalChatThreads();
  const openChat = useOpenSignalChat();
  useToastOnQueryError(feedQuery, 'Feed indisponível', 'Não foi possível carregar os sinais da comunidade.');

  const refreshCommunity = useCallback(
    () => Promise.all([feedQuery.refetch(), chatsQuery.refetch()]),
    [chatsQuery.refetch, feedQuery.refetch],
  );
  useRefreshOnFocus(refreshCommunity);

  useEffect(() => {
    registerOpenSearch(() => setSearchMode(true));
    return () => registerOpenSearch(null);
  }, [registerOpenSearch, setSearchMode]);

  const feed = feedQuery.data;
  const items = feed?.items ?? [];

  const [slideHeight, setSlideHeight] = useState(0);
  const [openingPostId, setOpeningPostId] = useState<number | null>(null);

  const onReelsLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.floor(event.nativeEvent.layout.height);
    setSlideHeight((current) => (current === nextHeight ? current : nextHeight));
  }, []);

  const closeSearch = useCallback(() => {
    setSearchMode(false);
    setSearchValues(createEmptySignalSearch());
  }, [setSearchMode]);

  const startChat = useCallback(
    async (postId: number) => {
      setOpeningPostId(postId);
      try {
        const data = await openChat.mutateAsync(postId);
        router.push({
          pathname: '/(app)/signal-chat/[threadId]',
          params: { threadId: String(data.thread.id) },
        });
      } catch (error) {
        showErrorToast('Não foi possível abrir o chat', extractApiErrorMessage(error, 'Tente novamente.'));
      } finally {
        setOpeningPostId(null);
      }
    },
    [openChat],
  );

  const renderReelItem = useCallback(
    ({ item }: { item: SocialPost }) => (
      <SignalReelCard
        item={item}
        slideHeight={slideHeight}
        monochrome={monochrome}
        openingPostId={openingPostId}
        onChat={(postId) => void startChat(postId)}
        onPublishSimilar={() => router.push('/(app)/signal-form')}
      />
    ),
    [monochrome, openingPostId, slideHeight, startChat],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<SocialPost> | null | undefined, index: number) => ({
      length: slideHeight,
      offset: slideHeight * index,
      index,
    }),
    [slideHeight],
  );

  const renderSearchItem = useCallback(
    ({ item }: { item: SocialPost }) => (
      <SignalSearchCard
        item={item}
        monochrome={monochrome}
        onPress={(postId) => void startChat(postId)}
      />
    ),
    [monochrome, startChat],
  );

  if (searchMode) {
    return (
      <View className={`flex-1 ${monochrome ? 'bg-black' : 'bg-[#4A3520]'}`}>
        <SignalSearchBar
          values={searchValues}
          onChange={setSearchValues}
          onClose={closeSearch}
          resultCount={feed ? items.length : undefined}
          variant="dark"
          monochrome={monochrome}
        />
        {items.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <FontAwesome name="search" size={40} color={monochrome ? '#555' : '#C9A96E'} style={{ opacity: 0.3 }} />
            <Text className="mt-4 text-center text-base text-stone-400">
              {hasActiveSignalSearch(searchValues)
                ? 'Nenhum sinal encontrado para essa busca.'
                : 'Digite o nome do livro, autor ou qualquer termo.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSearchItem}
            contentContainerClassName="gap-3 px-4 py-3"
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={feedQuery.isRefetching}
                tintColor="#fb923c"
                onRefresh={() => void refreshCommunity()}
              />
            }
          />
        )}
      </View>
    );
  }

  return (
    <View className={`flex-1 ${monochrome ? 'bg-black' : 'bg-[#4A3520]'}`}>
      {feedQuery.isPending && !feed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-stone-400">Carregando sinais...</Text>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 justify-center px-5">
          <View className="rounded-[28px] bg-white/5 px-6 py-7">
            <Text className="text-2xl font-bold text-white">Nenhum sinal da comunidade.</Text>
            <Text className="mt-3 text-sm leading-6 text-stone-400">
              Aqui aparecem apenas sinais de outras pessoas. Para ver ou editar os seus, abra Meus sinais no topo.
            </Text>
            <Button className="mt-6" onPress={() => router.push('/(app)/my-signals')}>
              Ver meus sinais
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-1" onLayout={onReelsLayout}>
          {slideHeight > 0 ? (
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderReelItem}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={slideHeight}
              snapToAlignment="start"
              disableIntervalMomentum
              getItemLayout={getItemLayout}
              refreshControl={
                <RefreshControl
                  refreshing={feedQuery.isRefetching}
                  tintColor="#fb923c"
                  onRefresh={() => void refreshCommunity()}
                />
              }
            />
          ) : null}
        </View>
      )}
    </View>
  );
}
