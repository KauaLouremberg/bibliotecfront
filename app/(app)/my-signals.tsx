import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useCallback, useDeferredValue, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { MySignalCard } from '@/components/MySignalCard';
import { Pill } from '@/components/Pill';
import { SignalSearchBar, createEmptySignalSearch, hasActiveSignalSearch } from '@/components/SignalSearchBar';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAppInsets } from '@/hooks/useAppInsets';
import { useMySignalsFeed, useDeleteSocialPost, type SocialPost } from '@/hooks/useLibrary';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';
import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast, showSuccessToast } from '@/utils/feedback';

export default function MySignalsScreen() {
  const { monochrome } = useInterfaceMode();
  const { topInset } = useAppInsets();

  const [searchMode, setSearchMode] = useState(false);
  const [searchValues, setSearchValues] = useState(createEmptySignalSearch);
  const deferredSearch = useDeferredValue(searchValues);

  const feedFilters = searchMode
    ? { search: deferredSearch.search, intent: deferredSearch.intent }
    : undefined;
  const feedQuery = useMySignalsFeed(feedFilters);
  const deleteMutation = useDeleteSocialPost();
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  useToastOnQueryError(feedQuery, 'Sinais indisponíveis', 'Não foi possível carregar seus sinais.');

  const refreshSignals = useCallback(() => feedQuery.refetch(), [feedQuery.refetch]);
  useRefreshOnFocus(refreshSignals);

  const feed = feedQuery.data;
  const items = feed?.items ?? [];
  const hasSearch = hasActiveSignalSearch(searchValues);

  const confirmDelete = useCallback(
    (postId: number) => {
      Alert.alert('Excluir sinal', 'Deseja remover este sinal permanentemente?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setDeletingPostId(postId);
            deleteMutation.mutate(postId, {
              onSuccess: () => showSuccessToast('Sinal removido', 'Seu sinal foi excluído.'),
              onError: (error) =>
                showErrorToast('Não foi possível excluir', extractApiErrorMessage(error, 'Tente novamente.')),
              onSettled: () => setDeletingPostId(null),
            });
          },
        },
      ]);
    },
    [deleteMutation],
  );

  const renderItem = useCallback(
    ({ item }: { item: SocialPost }) => (
      <MySignalCard
        item={item}
        monochrome={monochrome}
        deletingPostId={deletingPostId}
        onEdit={(postId) =>
          router.push({ pathname: '/(app)/signal-form', params: { postId: String(postId) } })
        }
        onDelete={confirmDelete}
      />
    ),
    [confirmDelete, deletingPostId, monochrome],
  );

  const bgClass = monochrome ? 'bg-white' : 'bg-[#F5ECD7]';
  const textClass = monochrome ? 'text-black' : 'text-[#4A3520]';
  const mutedClass = monochrome ? 'text-neutral-600' : 'text-[#8B6534]';

  const renderListHeader = useCallback(
    () => (
      <View className="gap-2 pb-2">
        <View className="flex-row flex-wrap gap-2">
          <Pill label={`${feed?.stats.need_posts ?? 0} pedidos`} tone="warning" />
          <Pill label={`${feed?.stats.donation_posts ?? 0} doações`} tone="success" />
          <Pill label={`${feed?.stats.exchange_posts ?? 0} trocas`} tone="accent" />
          <Pill label={`${feed?.stats.loan_posts ?? 0} empréstimos`} tone="danger" />
        </View>
      </View>
    ),
    [feed?.stats],
  );

  const emptyView = (
    <View className="flex-1 justify-center px-5">
      <View
        className={`rounded-[28px] border px-6 py-7 ${
          monochrome ? 'border-neutral-300 bg-neutral-50' : 'border-[#C9A96E]/30 bg-white/70'
        }`}>
        <Text className={`text-2xl font-bold ${textClass}`}>
          {hasSearch ? 'Nenhum sinal encontrado.' : 'Você ainda não publicou sinais.'}
        </Text>
        <Text className={`mt-3 text-sm leading-6 ${mutedClass}`}>
          {hasSearch
            ? 'Ajuste a busca ou limpe os filtros.'
            : 'Crie pedidos, doações ou ofertas para aparecerem aqui.'}
        </Text>
        {hasSearch ? (
          <Button
            className="mt-6"
            variant="secondary"
            onPress={() => setSearchValues(createEmptySignalSearch())}>
            Limpar busca
          </Button>
        ) : (
          <Button className="mt-6" onPress={() => router.push('/(app)/signal-form')}>
            Criar sinal
          </Button>
        )}
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${bgClass}`} style={{ paddingTop: topInset }}>
      {searchMode ? (
        <SignalSearchBar
          values={searchValues}
          onChange={setSearchValues}
          onClose={() => {
            setSearchMode(false);
            setSearchValues(createEmptySignalSearch());
          }}
          resultCount={feed ? items.length : undefined}
          variant="light"
          monochrome={monochrome}
        />
      ) : (
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <BackButton fallbackHref="/(app)/(tabs)/two" />
          <Text className={`text-lg font-extrabold ${textClass}`}>Meus sinais</Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              accessibilityLabel="Buscar sinais"
              className="h-10 w-10 items-center justify-center rounded-full"
              onPress={() => setSearchMode(true)}>
              <FontAwesome name="search" size={18} color={monochrome ? '#111111' : '#4A3520'} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Atualizar sinais"
              className="h-10 w-10 items-center justify-center rounded-full"
              disabled={feedQuery.isRefetching}
              onPress={() => void refreshSignals()}>
              <FontAwesome
                name="refresh"
                size={18}
                color={monochrome ? '#111111' : '#8B6534'}
                style={{ opacity: feedQuery.isRefetching ? 0.45 : 1 }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Criar sinal"
              className="h-10 w-10 items-center justify-center rounded-full"
              onPress={() => router.push('/(app)/signal-form')}>
              <FontAwesome name="plus" size={18} color={monochrome ? '#111111' : '#8B6534'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {feedQuery.isPending && !feed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className={`text-center text-base ${mutedClass}`}>Carregando seus sinais...</Text>
        </View>
      ) : items.length === 0 ? (
        emptyView
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={renderListHeader}
          contentContainerClassName="gap-4 px-4 py-4"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={feedQuery.isRefetching}
              tintColor="#8B6534"
              onRefresh={() => void feedQuery.refetch()}
            />
          }
        />
      )}
    </View>
  );
}
