import { Link } from 'expo-router';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { Button } from '@/components/Button';
import { CatalogPosterCard } from '@/components/CatalogPosterCard';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useInfiniteCatalogBooks } from '@/hooks/useLibrary';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';
import { openCatalogBook } from '@/utils/catalogNavigation';
import { formatGenreLabel } from '@/utils/genreLabels';

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 20;
const GRID_GAP = 12;
const GRID_COLS = 3;
const GRID_POSTER_WIDTH = Math.floor((SCREEN_WIDTH - H_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS);
const ROW_POSTER_WIDTH = Math.round((SCREEN_WIDTH - 48) / 3.2);
const LOAD_MORE_THRESHOLD = 240;

function groupByGenre<T extends { genre: string }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = formatGenreLabel(item.genre) || 'Descobertas';
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return Array.from(groups.entries()).map(([genre, books]) => ({ genre, books }));
}

function formatCount(count: number) {
  return count.toLocaleString('pt-BR');
}

function allResultsLabel(search: string, genre: string, total: number) {
  const suffix = total === 1 ? '1 livro' : `${formatCount(total)} livros`;
  if (search) return `Resultados para "${search}" · ${suffix}`;
  if (genre) return `Resultados em ${formatGenreLabel(genre)} · ${suffix}`;
  return `Todos os livros · ${suffix}`;
}

export default function CatalogScreen() {
  const { monochrome } = useInterfaceMode();
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const deferredSearch = useDeferredValue(search.trim());

  const catalogQuery = useInfiniteCatalogBooks({ search: deferredSearch, genre });
  useRefreshOnFocus(catalogQuery.refetch);
  useToastOnQueryError(catalogQuery, 'Catálogo indisponível', 'Não foi possível consultar a Open Library.');

  const firstPage = catalogQuery.data?.pages[0];
  const loadedItems = useMemo(
    () => catalogQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [catalogQuery.data],
  );
  const total = firstPage?.total ?? loadedItems.length;
  const genres = firstPage?.genres ?? [];
  const featured = loadedItems[0];
  const rows = useMemo(() => groupByGenre(loadedItems), [loadedItems]);
  const hasMore = catalogQuery.hasNextPage;
  const isInitialLoading = catalogQuery.isPending && !catalogQuery.data;

  const loadMore = useCallback(() => {
    if (!hasMore || catalogQuery.isFetchingNextPage) return;
    catalogQuery.fetchNextPage();
  }, [catalogQuery, hasMore]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
      if (distanceFromBottom < LOAD_MORE_THRESHOLD) {
        loadMore();
      }
    },
    [loadMore],
  );

  const screenBg = monochrome ? 'bg-white' : 'bg-[#2A1F14]';
  const heading = monochrome ? 'text-black' : 'text-[#F5ECD7]';
  const muted = monochrome ? 'text-neutral-600' : 'text-[#E8D5B0]/80';
  const input = monochrome
    ? 'border-neutral-300 bg-white text-black'
    : 'border-[#C9A96E]/40 bg-[#4A3520] text-[#F5ECD7]';
  const chipIdle = monochrome ? 'border-neutral-300 bg-white' : 'border-[#C9A96E]/40 bg-[#4A3520]';
  const chipActive = monochrome ? 'border-black bg-black' : 'border-[#C9A96E] bg-[#8B6534]';

  return (
    <ScrollView
      className={`flex-1 ${screenBg}`}
      contentContainerClassName="pb-10"
      onScroll={handleScroll}
      scrollEventThrottle={160}
      refreshControl={
        <RefreshControl
          refreshing={catalogQuery.isRefetching && !catalogQuery.isFetchingNextPage}
          onRefresh={() => catalogQuery.refetch()}
          tintColor={monochrome ? '#000' : '#C9A96E'}
        />
      }>
      <AnimatedReveal>
        <View className="px-5 pt-2">
          <Text className={`text-3xl font-bold ${heading}`}>Vitrine</Text>
          <Text className={`mt-1 text-sm leading-6 ${muted}`}>
            Capas em destaque, como num catálogo de filmes. A ordem muda a cada visita.
          </Text>
          <Link href="/(app)/(tabs)" asChild>
            <TouchableOpacity className="mt-3 self-start">
              <Text className={`text-sm font-semibold underline ${monochrome ? 'text-neutral-700' : 'text-[#C9A96E]'}`}>
                Ver modo detalhado no Inventário
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </AnimatedReveal>

      <AnimatedReveal delay={60} className="mt-6 px-5">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por título, autor ou gênero"
          placeholderTextColor={monochrome ? '#737373' : '#8B6534'}
          className={`w-full rounded-2xl border px-4 py-3.5 text-base ${input}`}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerClassName="gap-2 pr-5">
          {[{ label: 'Todos', value: '' }, ...genres.map((g) => ({ label: formatGenreLabel(g), value: g }))].map((option) => {
            const selected = genre === option.value;
            return (
              <TouchableOpacity
                key={option.label}
                className={`rounded-full border px-4 py-2 ${selected ? chipActive : chipIdle}`}
                onPress={() => setGenre(option.value)}>
                <Text className={`text-sm font-semibold ${selected ? 'text-white' : monochrome ? 'text-neutral-700' : 'text-[#E8D5B0]'}`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </AnimatedReveal>

      {isInitialLoading ? (
        <View className="mt-8 px-5">
          <Text className={muted}>Montando vitrine...</Text>
        </View>
      ) : loadedItems.length ? (
        <>
          {featured ? (
            <AnimatedReveal delay={100} className="mt-8 px-5">
              <Text className={`mb-3 text-xs font-bold uppercase tracking-[2px] ${muted}`}>Em destaque</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openCatalogBook(featured)}
                className={`overflow-hidden rounded-[28px] border ${monochrome ? 'border-neutral-200 bg-neutral-100' : 'border-[#C9A96E]/30 bg-[#4A3520]'}`}>
                <View className="relative">
                  {featured.cover_url ? (
                    <Image source={{ uri: featured.cover_url }} className="h-72 w-full" resizeMode="cover" />
                  ) : (
                    <View className={`h-72 items-center justify-center ${monochrome ? 'bg-neutral-200' : 'bg-[#3A2A18]'}`}>
                      <Text className={`text-sm font-bold uppercase ${heading}`}>Sem capa</Text>
                    </View>
                  )}
                  <View
                    className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-16"
                    style={{ backgroundColor: monochrome ? 'rgba(0,0,0,0.55)' : 'rgba(26,18,8,0.82)' }}>
                    {featured.genre ? (
                      <Text className="text-xs font-bold uppercase tracking-[1px] text-[#C9A96E]">
                        {formatGenreLabel(featured.genre)}
                      </Text>
                    ) : null}
                    <Text className="mt-2 text-2xl font-bold leading-8 text-white">{featured.title}</Text>
                    <Text className="mt-1 text-sm text-[#E8D5B0]/90">{featured.author}</Text>
                    <Button className="mt-4 self-start" onPress={() => openCatalogBook(featured)}>
                      Adicionar ao inventário
                    </Button>
                  </View>
                </View>
              </TouchableOpacity>
            </AnimatedReveal>
          ) : null}

          <AnimatedReveal delay={120} className="mt-8">
            <Text className={`mb-1 px-5 text-lg font-bold ${heading}`}>
              {allResultsLabel(deferredSearch, genre, total)}
            </Text>
            <Text className={`mb-3 px-5 text-sm ${muted}`}>
              Mostrando {formatCount(loadedItems.length)} de {formatCount(total)}
            </Text>
            <View className="flex-row flex-wrap px-5" style={{ columnGap: GRID_GAP, rowGap: GRID_GAP }}>
              {loadedItems.map((book, index) => (
                <CatalogPosterCard
                  key={`all-${book.id}-${index}`}
                  book={book}
                  width={GRID_POSTER_WIDTH}
                  monochrome={monochrome}
                  onPress={openCatalogBook}
                  compact
                />
              ))}
            </View>

            <View className="mt-6 items-center px-5">
              {catalogQuery.isFetchingNextPage ? (
                <ActivityIndicator color={monochrome ? '#000' : '#C9A96E'} />
              ) : hasMore ? (
                <Button variant="secondary" onPress={loadMore}>
                  Carregar mais ({formatCount(loadedItems.length)} de {formatCount(total)})
                </Button>
              ) : (
                <Text className={`text-sm ${muted}`}>Todos os resultados disponíveis foram carregados.</Text>
              )}
            </View>
          </AnimatedReveal>

          {rows.map(({ genre: rowGenre, books }, index) => (
            <AnimatedReveal key={rowGenre} delay={140 + index * 40} className="mt-8">
              <Text className={`mb-3 px-5 text-lg font-bold ${heading}`}>{rowGenre}</Text>
              <FlatList
                horizontal
                nestedScrollEnabled
                data={books}
                keyExtractor={(book, bookIndex) => `${rowGenre}-${book.id}-${bookIndex}`}
                renderItem={({ item }) => (
                  <CatalogPosterCard
                    book={item}
                    width={ROW_POSTER_WIDTH}
                    monochrome={monochrome}
                    onPress={openCatalogBook}
                  />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: H_PADDING }}
              />
            </AnimatedReveal>
          ))}
        </>
      ) : (
        <View className="mt-8 px-5">
          <Text className={muted}>Nenhum livro encontrado para essa busca.</Text>
        </View>
      )}
    </ScrollView>
  );
}
