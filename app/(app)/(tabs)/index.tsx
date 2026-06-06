import { Link, router } from 'expo-router';
import { useCallback, useDeferredValue, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { StarRating } from '@/components/StarRating';
import {
  sharingStatusLabels,
  sharingStatusTones,
} from '@/constants/library';
import { APP_NAME } from '@/constants/brand';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useCatalogBooks,
  useCommunityFeed,
  useDiscoverInventory,
  useMyInventory,
  useRateInventoryBook,
} from '@/hooks/useLibrary';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useShuffleOnFocus } from '@/hooks/useShuffleOnFocus';
import { useNotifications } from '@/hooks/useNotifications';
import { extractApiErrorMessage } from '@/utils/apiError';
import { openCatalogBook } from '@/utils/catalogNavigation';
import { showErrorToast } from '@/utils/feedback';

function canNegotiate(status: string) {
  return status === 'loan' || status === 'exchange' || status === 'donation';
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <View className="min-w-[88px] flex-1 rounded-2xl bg-[#E8D5B0]/25 px-4 py-3">
      <Text className="text-2xl font-bold text-[#F5ECD7]">{value}</Text>
      <Text className="mt-1 text-xs uppercase tracking-[1px] text-[#E8D5B0]">{label}</Text>
    </View>
  );
}

export default function InventoryScreen() {
  const { user } = useAuth();
  const { monochrome } = useInterfaceMode();
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogGenre, setCatalogGenre] = useState('');
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [discoverGenre, setDiscoverGenre] = useState('');
  const [tradeStatusFilter, setTradeStatusFilter] = useState<'loan' | 'exchange' | 'donation' | null>(null);
  const deferredCatalogSearch = useDeferredValue(catalogSearch.trim());
  const deferredDiscoverSearch = useDeferredValue(discoverSearch.trim());
  const catalogQuery = useCatalogBooks({
    search: deferredCatalogSearch,
    genre: catalogGenre,
  });
  const inventoryQuery = useMyInventory();
  const discoverQuery = useDiscoverInventory({
    search: deferredDiscoverSearch,
    genre: discoverGenre,
    trade_status: tradeStatusFilter,
  });
  const feedQuery = useCommunityFeed();
  const notificationsQuery = useNotifications();
  const rateMutation = useRateInventoryBook();
  useToastOnQueryError(catalogQuery, 'Catálogo indisponível', 'Não foi possível consultar a Open Library.');
  useToastOnQueryError(inventoryQuery, 'Inventário indisponível', 'Não foi possível carregar seu inventário.');
  useToastOnQueryError(discoverQuery, 'Busca indisponível', 'Não foi possível carregar os livros públicos.');
  useToastOnQueryError(feedQuery, 'Feed indisponível', 'Não foi possível carregar os sinais da comunidade.');

  const refreshScreen = useCallback(
    () =>
      Promise.all([
        catalogQuery.refetch(),
        inventoryQuery.refetch(),
        discoverQuery.refetch(),
        feedQuery.refetch(),
        notificationsQuery.refetch(),
      ]),
    [catalogQuery.refetch, discoverQuery.refetch, feedQuery.refetch, inventoryQuery.refetch, notificationsQuery.refetch],
  );
  useRefreshOnFocus(refreshScreen);

  const inventory = inventoryQuery.data;
  const catalog = catalogQuery.data;
  const shuffledCatalogItems = useShuffleOnFocus(catalog?.items ?? []);
  const discover = discoverQuery.data;
  const isRefreshing =
    catalogQuery.isRefetching || inventoryQuery.isRefetching || discoverQuery.isRefetching || feedQuery.isRefetching;

  async function rateBook(bookId: number, rating: number) {
    try {
      await rateMutation.mutateAsync({ bookId, rating });
    } catch (error) {
      showErrorToast('Não foi possível avaliar', extractApiErrorMessage(error, 'Tente novamente em instantes.'));
    }
  }

  const pageBg = monochrome ? 'bg-white' : 'bg-[#F5ECD7]';
  const heading = monochrome ? 'text-black' : 'text-[#4A3520]';
  const muted = monochrome ? 'text-neutral-600' : 'text-[#4A3520]/75';
  const card = monochrome ? 'border-neutral-300 bg-white' : 'border-[#C9A96E]/45 bg-[#E8D5B0]';
  const input =
    monochrome
      ? 'border-neutral-400 bg-white text-black'
      : 'border-[#C9A96E]/70 bg-[#F5ECD7] text-[#4A3520]';

  return (
    <ScrollView
      className={`flex-1 ${pageBg}`}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          tintColor={monochrome ? '#111111' : '#8B6534'}
          onRefresh={() => {
            void refreshScreen();
          }}
        />
      }>
      <View className="px-5 pb-4 pt-4">
        <AnimatedReveal className={`overflow-hidden rounded-[28px] px-6 py-7 ${monochrome ? 'border border-neutral-300 bg-neutral-950' : 'bg-[#4A3520]'}`}>
          <Text className={`text-sm uppercase tracking-[1.5px] ${monochrome ? 'text-neutral-400' : 'text-[#C9A96E]'}`}>Meu acervo digital</Text>
          <Text className="mt-3 text-2xl font-bold leading-snug text-[#F5ECD7]">
            {user?.full_name ? `${user.full_name},` : `${APP_NAME},`} pesquise livros reais e monte seu inventário.
          </Text>
          <Text className={`mt-3 text-sm leading-6 ${monochrome ? 'text-neutral-300' : 'text-[#E8D5B0]'}`}>
            Busque metadados online, salve o livro no seu acervo e defina se ele fica privado, visível, disponível para empréstimo, troca ou doação.
          </Text>

          <View className="mt-6 flex-row flex-wrap gap-3">
            <StatTile value={inventory?.stats.total_books ?? 0} label="No inventário" />
            <StatTile value={inventory?.stats.public_books ?? 0} label="Visíveis" />
            <StatTile value={inventory?.stats.donation_books ?? 0} label="Para doar" />
            <StatTile value={inventory?.stats.demand_matches ?? 0} label="Pedidos cruzados" />
          </View>

          <View className="mt-6 gap-3">
            <Button
              onPress={() => {
                router.push('/(app)/book-form');
              }}>
              Adicionar manualmente
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                router.push('/(app)/signal-form');
              }}>
              Publicar um sinal para a comunidade
            </Button>
          </View>
        </AnimatedReveal>

        <AnimatedReveal delay={100} className="mt-10">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className={`text-2xl font-bold ${heading}`}>Catálogo online</Text>
              <Text className={`mt-1 text-sm ${muted}`}>
                Busca em Open Library por título, autor ou gênero. Selecione um resultado para preencher o inventário.
              </Text>
            </View>
            <Link href="/(app)/(tabs)/catalog" asChild>
              <TouchableOpacity className={`rounded-full border px-3 py-2 ${monochrome ? 'border-neutral-300 bg-white' : 'border-[#C9A96E]/70 bg-[#E8D5B0]'}`}>
                <Text className={`text-xs font-bold ${heading}`}>Vitrine</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View className="mt-5 gap-3">
            <TextInput
              value={catalogSearch}
              onChangeText={setCatalogSearch}
              placeholder="Buscar por título, autor ou gênero"
              placeholderTextColor={monochrome ? '#737373' : '#8B6534'}
              className={`w-full rounded-2xl border px-4 py-3.5 text-base ${input}`}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-5">
              {[{ label: 'Todos', value: '' }, ...(catalog?.genres ?? []).map((genre) => ({ label: genre, value: genre }))].map((option) => {
                const selected = catalogGenre === option.value;
                return (
                  <TouchableOpacity
                    key={option.label}
                    className={`rounded-full border px-4 py-2 ${
                      selected
                        ? monochrome
                          ? 'border-black bg-black'
                          : 'border-[#8B6534] bg-[#8B6534]'
                        : monochrome
                          ? 'border-neutral-300 bg-white'
                          : 'border-[#C9A96E]/70 bg-[#E8D5B0]'
                    }`}
                    onPress={() => setCatalogGenre(option.value)}>
                    <Text className={`text-sm font-semibold ${selected ? 'text-white' : monochrome ? 'text-neutral-700' : 'text-[#4A3520]'}`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {catalogQuery.isPending && !catalog ? (
            <View className={`mt-5 rounded-[24px] border px-5 py-6 ${card}`}>
              <Text className={`text-base ${muted}`}>Consultando catálogo...</Text>
            </View>
          ) : shuffledCatalogItems.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-5"
              contentContainerClassName="gap-4 pr-5">
              {shuffledCatalogItems.map((book) => (
                <View key={book.id} className={`min-h-[430px] w-[310px] rounded-[24px] border p-5 ${card}`}>
                  <View className="flex-1">
                  <View className="flex-row gap-4">
                    {book.cover_url ? (
                      <Image source={{ uri: book.cover_url }} className="h-36 w-24 rounded-2xl bg-[#C9A96E]/30" resizeMode="cover" />
                    ) : (
                      <View className={`h-36 w-24 items-center justify-center rounded-2xl ${monochrome ? 'bg-neutral-200' : 'bg-[#F5ECD7]'}`}>
                        <Text className={`text-center text-xs font-semibold uppercase tracking-[1px] ${heading}`}>Sem capa</Text>
                      </View>
                    )}
                    <View className="flex-1">
                      {book.genre ? <Pill label={book.genre} tone="accent" /> : null}
                      <Text className={`mt-3 text-lg font-bold leading-6 ${heading}`}>{book.title}</Text>
                      <Text className={`mt-1 text-sm ${muted}`}>{book.author}</Text>
                      {book.published_year || book.publisher ? (
                        <Text className={`mt-2 text-xs ${muted}`}>
                          {[book.published_year, book.publisher].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {book.description ? (
                    <Text className={`mt-4 text-sm leading-6 ${muted}`} numberOfLines={4}>{book.description}</Text>
                  ) : (
                    <Text className={`mt-4 text-sm leading-6 ${muted}`}>Sem descrição disponível.</Text>
                  )}
                  {book.isbn ? <Text className={`mt-3 text-xs ${muted}`}>ISBN: {book.isbn}</Text> : null}
                  <Button className="mt-auto" onPress={() => openCatalogBook(book)}>
                    Adicionar ao inventário
                  </Button>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className={`mt-5 rounded-[24px] border px-5 py-6 ${card}`}>
              <Text className={`text-sm leading-6 ${muted}`}>Nenhum livro encontrado para essa busca.</Text>
            </View>
          )}
        </AnimatedReveal>

        <AnimatedReveal delay={140} className="mt-10">
          <View className="mb-5 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className={`text-2xl font-bold ${heading}`}>Inventário pessoal</Text>
              <Text className={`mt-1 text-sm ${muted}`}>
                Seus livros e quais títulos físicos você também possui.
              </Text>
            </View>
            <TouchableOpacity
              className="ml-4"
              onPress={() => {
                router.push('/(app)/(tabs)/profile');
              }}>
              <Text className={`text-sm font-semibold ${monochrome ? 'text-black' : 'text-[#8B6534]'}`}>Perfil</Text>
            </TouchableOpacity>
          </View>

          {inventoryQuery.isPending && !inventory ? (
            <View className={`rounded-[24px] border px-5 py-6 ${card}`}>
              <Text className={`text-base ${muted}`}>Carregando inventário...</Text>
            </View>
          ) : inventory?.items.length ? (
            <View className="gap-5">
              {inventory.items.map((book) => (
                <View key={book.id} className={`rounded-[24px] border p-5 ${card}`}>
                  <View className="flex-row gap-4">
                    {book.cover_url ? (
                      <Image
                        source={{ uri: book.cover_url }}
                        className="h-32 w-24 rounded-2xl bg-[#C9A96E]/30"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className={`h-32 w-24 items-center justify-center rounded-2xl ${monochrome ? 'bg-neutral-200' : 'bg-[#F5ECD7]'}`}>
                        <Text className={`text-center text-xs font-semibold uppercase tracking-[1px] ${heading}`}>
                          Ebook
                        </Text>
                      </View>
                    )}

                    <View className="flex-1">
                      <View className="flex-row flex-wrap gap-2">
                        <Pill label="Ebook" tone="accent" />
                        {book.has_physical_copy ? <Pill label="Também físico" tone="success" /> : null}
                        <Pill
                          label={sharingStatusLabels[book.sharing_status]}
                          tone={sharingStatusTones[book.sharing_status]}
                        />
                      </View>

                      <Text className={`mt-3 text-xl font-bold ${heading}`}>{book.title}</Text>
                      <Text className={`mt-1 text-sm ${muted}`}>{book.author}</Text>
                      {book.genre ? <Text className={`mt-1 text-xs font-semibold ${muted}`}>{book.genre}</Text> : null}

                      <View className="mt-3">
                        <StarRating
                          value={book.my_rating}
                          average={book.average_rating}
                          count={book.rating_count}
                          disabled={rateMutation.isPending}
                          onChange={(rating) => void rateBook(book.id, rating)}
                        />
                      </View>

                      {book.location_label ? (
                        <Text className={`mt-3 text-sm font-medium ${muted}`}>
                          Local: {book.location_label}
                        </Text>
                      ) : null}

                      {book.description ? (
                        <Text className={`mt-3 text-sm leading-6 ${muted}`}>{book.description}</Text>
                      ) : null}

                      {book.matches_waiting > 0 ? (
                        <View className="mt-4 rounded-2xl bg-[#F5ECD7] px-4 py-3">
                          <Text className="text-sm font-semibold text-[#4A3520]">
                            {book.matches_waiting} usuário(s) já procuraram exatamente este título no feed.
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View className="mt-5 flex-row gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onPress={() => {
                        router.push({
                          pathname: '/(app)/signal-form',
                          params: {
                            inventoryBookId: String(book.id),
                            bookTitle: book.title,
                            bookAuthor: book.author,
                          },
                        });
                      }}>
                      Publicar sinal
                    </Button>
                    <Button
                      className="flex-1"
                      onPress={() => {
                        router.push({
                          pathname: '/(app)/book-form',
                          params: { bookId: String(book.id) },
                        });
                      }}>
                      Editar
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={`rounded-[24px] border px-5 py-6 ${card}`}>
              <Text className={`text-lg font-semibold ${heading}`}>Seu inventário ainda está vazio.</Text>
              <Text className={`mt-2 text-sm leading-6 ${muted}`}>
                Pesquise no catálogo online para adicionar livros reais com metadados e capa.
              </Text>
            </View>
          )}
        </AnimatedReveal>

        <AnimatedReveal delay={180} className="mt-10">
          <Text className={`text-2xl font-bold ${heading}`}>Acervos abertos</Text>
          <Text className={`mt-1 text-sm ${muted}`}>
            Livros públicos de outros usuários. A busca aceita título, autor ou gênero.
          </Text>

          <View className="mt-5 gap-3">
            <TextInput
              value={discoverSearch}
              onChangeText={setDiscoverSearch}
              placeholder="Buscar por título, autor ou gênero"
              placeholderTextColor={monochrome ? '#737373' : '#8B6534'}
              className={`w-full rounded-2xl border px-4 py-3.5 text-base ${input}`}
            />
            <TextInput
              value={discoverGenre}
              onChangeText={setDiscoverGenre}
              placeholder="Filtrar por gênero"
              placeholderTextColor={monochrome ? '#737373' : '#8B6534'}
              className={`w-full rounded-2xl border px-4 py-3.5 text-base ${input}`}
            />

            <View className="flex-row flex-wrap gap-2">
              {[
                { value: null, label: 'Todos' },
                { value: 'loan', label: 'Empréstimo' },
                { value: 'exchange', label: 'Troca' },
                { value: 'donation', label: 'Doação' },
              ].map((option) => {
                const selected = tradeStatusFilter === option.value;
                return (
                  <TouchableOpacity
                    key={option.label}
                    className={`rounded-full border px-4 py-2 ${
                      selected
                        ? monochrome
                          ? 'border-black bg-black'
                          : 'border-[#8B6534] bg-[#8B6534]'
                        : monochrome
                          ? 'border-neutral-300 bg-white'
                          : 'border-[#C9A96E]/70 bg-[#E8D5B0]'
                    }`}
                    onPress={() => {
                      setTradeStatusFilter(option.value as 'loan' | 'exchange' | 'donation' | null);
                    }}>
                    <Text className={`text-sm font-semibold ${selected ? 'text-white' : monochrome ? 'text-neutral-700' : 'text-[#4A3520]'}`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {discoverQuery.isPending && !discover ? (
            <View className={`mt-5 rounded-[24px] border px-5 py-6 ${card}`}>
              <Text className={`text-base ${muted}`}>Carregando comunidade...</Text>
            </View>
          ) : discover?.items.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-5"
              contentContainerClassName="gap-4 pr-5">
              {discover.items.map((book) => (
                <View key={book.id} className={`w-[300px] rounded-[24px] border p-5 ${card}`}>
                  <View className="flex-row items-start justify-between">
                    <Pill
                      label={sharingStatusLabels[book.sharing_status]}
                      tone={sharingStatusTones[book.sharing_status]}
                    />
                    {book.has_physical_copy ? <Pill label="Tem físico" tone="success" /> : null}
                  </View>

                  <Text className={`mt-5 text-xl font-bold ${heading}`}>{book.title}</Text>
                  <Text className={`mt-1 text-sm ${muted}`}>{book.author}</Text>
                  {book.genre ? <Text className={`mt-1 text-xs font-semibold ${muted}`}>{book.genre}</Text> : null}
                  <View className="mt-3">
                    <StarRating
                      value={book.my_rating}
                      average={book.average_rating}
                      count={book.rating_count}
                      disabled={rateMutation.isPending}
                      onChange={(rating) => void rateBook(book.id, rating)}
                    />
                  </View>

                  <View className={`mt-5 rounded-2xl px-4 py-4 ${monochrome ? 'bg-neutral-100' : 'bg-[#F5ECD7]'}`}>
                    <Text className={`text-xs uppercase tracking-[1px] ${muted}`}>Proprietário</Text>
                    <Text className={`mt-2 text-base font-semibold ${heading}`}>
                      {book.owner.full_name || book.owner.email}
                    </Text>
                    <Text className={`mt-1 text-sm ${muted}`}>{book.owner.email}</Text>
                    {book.location_label ? (
                      <Text className={`mt-2 text-sm ${muted}`}>Local: {book.location_label}</Text>
                    ) : null}
                  </View>

                  {book.description ? (
                    <Text className={`mt-4 text-sm leading-6 ${muted}`}>{book.description}</Text>
                  ) : null}

                  <Button
                    className="mt-5"
                    disabled={!canNegotiate(book.sharing_status)}
                    onPress={() => {
                      router.push({
                        pathname: '/(app)/trade-form',
                        params: {
                          requestedBookId: String(book.id),
                        },
                      });
                    }}>
                    {canNegotiate(book.sharing_status) ? 'Propor troca' : 'Indisponível'}
                  </Button>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className={`mt-5 rounded-[24px] border px-5 py-6 ${card}`}>
              <Text className={`text-sm leading-6 ${muted}`}>
                Nenhum outro usuário deixou livros públicos por enquanto.
              </Text>
            </View>
          )}
        </AnimatedReveal>
      </View>
    </ScrollView>
  );
}
