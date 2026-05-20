import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import {
  sharingStatusLabels,
  sharingStatusTones,
} from '@/constants/library';
import { useAuth } from '@/hooks/useAuth';
import { useCommunityFeed, useDiscoverInventory, useMyInventory } from '@/hooks/useLibrary';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';
import { useInterfaceMode } from '@/contexts/InterfaceContext';

function canNegotiate(status: string) {
  return status === 'loan' || status === 'exchange' || status === 'donation';
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <View className="min-w-[88px] flex-1 rounded-2xl bg-white/10 px-4 py-3">
      <Text className="text-2xl font-bold text-white">{value}</Text>
      <Text className="mt-1 text-xs uppercase tracking-[1px] text-orange-200">{label}</Text>
    </View>
  );
}

export default function InventoryScreen() {
  const { user } = useAuth();
  const { monochrome } = useInterfaceMode();
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [tradeStatusFilter, setTradeStatusFilter] = useState<'loan' | 'exchange' | 'donation' | null>(null);
  const deferredDiscoverSearch = useDeferredValue(discoverSearch.trim());
  const inventoryQuery = useMyInventory();
  const discoverQuery = useDiscoverInventory({
    search: deferredDiscoverSearch,
    trade_status: tradeStatusFilter,
  });
  const feedQuery = useCommunityFeed();
  useToastOnQueryError(inventoryQuery, 'Inventário indisponível', 'Não foi possível carregar seu inventário.');
  useToastOnQueryError(discoverQuery, 'Busca indisponível', 'Não foi possível carregar os livros públicos.');
  useToastOnQueryError(feedQuery, 'Feed indisponível', 'Não foi possível carregar os sinais da comunidade.');

  const inventory = inventoryQuery.data;
  const discover = discoverQuery.data;
  const isRefreshing =
    inventoryQuery.isRefetching || discoverQuery.isRefetching || feedQuery.isRefetching;

  return (
    <ScrollView
      className={`flex-1 ${monochrome ? 'bg-white' : 'bg-[#f4ead7] dark:bg-stone-950'}`}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          tintColor="#c2410c"
          onRefresh={() => {
            void inventoryQuery.refetch();
            void discoverQuery.refetch();
            void feedQuery.refetch();
          }}
        />
      }>
      <View className="px-5 pb-28 pt-6">
        <AnimatedReveal className={`overflow-hidden rounded-[32px] px-6 py-7 ${monochrome ? 'border border-neutral-300 bg-neutral-950' : 'bg-stone-900 dark:bg-stone-900'}`}>
          {!monochrome ? (
            <>
              <View className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/20" />
              <View className="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-amber-300/15" />
            </>
          ) : null}
          <Text className={`text-sm uppercase tracking-[1.5px] ${monochrome ? 'text-neutral-400' : 'text-orange-300'}`}>Meu acervo digital</Text>
          <Text className="mt-3 text-2xl font-bold leading-snug text-white">
            {user?.full_name ? `${user.full_name},` : 'Bibliotec,'} organize seus ebooks e sinalize o que pode circular.
          </Text>
          <Text className={`mt-3 text-sm leading-6 ${monochrome ? 'text-neutral-300' : 'text-orange-100/80'}`}>
            Cada livro entra no seu inventário pessoal. Você decide se ele fica privado, visível para outros usuários, disponível para empréstimo, troca ou doação.
          </Text>

          <View className="mt-6 flex-row flex-wrap gap-3">
            <StatTile value={inventory?.stats.total_books ?? 0} label="No inventário" />
            <StatTile value={inventory?.stats.public_books ?? 0} label="Visíveis" />
            <StatTile value={inventory?.stats.donation_books ?? 0} label="Para doar" />
            <StatTile value={inventory?.stats.demand_matches ?? 0} label="Pedidos cruzados" />
          </View>

          <View className="mt-6 gap-3">
            <Button
              className={monochrome ? '' : 'bg-orange-600'}
              onPress={() => {
                router.push('/(app)/book-form');
              }}>
              Adicionar livro
            </Button>
            <Button
              variant="secondary"
              className={monochrome ? '' : 'border-orange-300/40 bg-white/10'}
              onPress={() => {
                router.push('/(app)/signal-form');
              }}>
              Publicar um sinal para a comunidade
            </Button>
          </View>
        </AnimatedReveal>

        <AnimatedReveal delay={120} className="mt-10">
          <View className="mb-5 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className={`text-2xl font-bold ${monochrome ? 'text-black' : 'text-stone-900 dark:text-white'}`}>Inventário pessoal</Text>
              <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-700 dark:text-stone-400'}`}>
                Seus livros digitais e quais títulos físicos você também possui.
              </Text>
            </View>
            <TouchableOpacity
              className="ml-4"
              onPress={() => {
                router.push('/(app)/(tabs)/profile');
              }}>
              <Text className={`text-sm font-semibold ${monochrome ? 'text-black' : 'text-orange-700 dark:text-orange-400'}`}>Perfil</Text>
            </TouchableOpacity>
          </View>

          {inventoryQuery.isPending ? (
            <View className={`rounded-[24px] px-5 py-6 ${monochrome ? 'border border-neutral-300 bg-white' : 'bg-white dark:bg-stone-900'}`}>
              <Text className="text-base text-stone-600 dark:text-stone-400">Carregando inventário...</Text>
            </View>
          ) : inventory?.items.length ? (
            <View className="gap-5">
              {inventory.items.map((book, index) => (
                <AnimatedReveal key={book.id} delay={index * 70} className={`rounded-[24px] border p-5 ${monochrome ? 'border-neutral-300 bg-white' : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'}`}>
                  <View className="flex-row gap-4">
                    {book.cover_url ? (
                      <Image
                        source={{ uri: book.cover_url }}
                        className="h-32 w-24 rounded-2xl bg-stone-200 dark:bg-stone-700"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className={`h-32 w-24 items-center justify-center rounded-2xl ${monochrome ? 'bg-neutral-200' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                        <Text className={`text-center text-xs font-semibold uppercase tracking-[1px] ${monochrome ? 'text-neutral-900' : 'text-orange-700 dark:text-orange-300'}`}>
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

                      <Text className={`mt-3 text-xl font-bold ${monochrome ? 'text-black' : 'text-stone-900 dark:text-white'}`}>{book.title}</Text>
                      <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>{book.author}</Text>

                      {book.location_label ? (
                        <Text className={`mt-3 text-sm font-medium ${monochrome ? 'text-neutral-700' : 'text-stone-700 dark:text-stone-400'}`}>
                          Local: {book.location_label}
                        </Text>
                      ) : null}

                      {book.description ? (
                        <Text className={`mt-3 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>{book.description}</Text>
                      ) : null}

                      {book.matches_waiting > 0 ? (
                        <View className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 dark:bg-amber-900/30">
                          <Text className="text-sm font-semibold text-amber-800 dark:text-amber-200">
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
                </AnimatedReveal>
              ))}
            </View>
          ) : (
            <View className={`rounded-[24px] px-5 py-6 ${monochrome ? 'border border-neutral-300 bg-white' : 'bg-white dark:bg-stone-900'}`}>
              <Text className={`text-lg font-semibold ${monochrome ? 'text-black' : 'text-stone-900 dark:text-white'}`}>Seu inventário ainda está vazio.</Text>
              <Text className={`mt-2 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>
                Adicione seus ebooks e marque se você também possui cópia física para mostrar isso à comunidade.
              </Text>
            </View>
          )}
        </AnimatedReveal>

        <AnimatedReveal delay={180} className="mt-10">
          <Text className={`text-2xl font-bold ${monochrome ? 'text-black' : 'text-stone-900 dark:text-white'}`}>Bibliotecas abertas</Text>
          <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-700 dark:text-stone-400'}`}>
            Livros públicos de outros usuários que podem gerar contato imediato.
          </Text>

          <View className="mt-5">
            <TextInput
              value={discoverSearch}
              onChangeText={setDiscoverSearch}
              placeholder="Buscar por título ou autor"
              placeholderTextColor={monochrome ? '#737373' : '#78716c'}
              className={`w-full rounded-2xl border px-4 py-3.5 text-base ${monochrome ? 'border-neutral-400 bg-white text-black' : 'border-stone-200 bg-stone-50 text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100'}`}
            />

            <View className="mt-3 flex-row flex-wrap gap-2">
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
                    className={`rounded-full border px-4 py-2 ${selected ? (monochrome ? 'border-black bg-black' : 'border-orange-600 bg-orange-600 dark:border-orange-500 dark:bg-orange-500') : monochrome ? 'border-neutral-300 bg-white' : 'border-stone-200 bg-white dark:border-stone-600 dark:bg-stone-800'}`}
                    onPress={() => {
                      setTradeStatusFilter(option.value as 'loan' | 'exchange' | 'donation' | null);
                    }}>
                    <Text className={`text-sm font-semibold ${selected ? 'text-white' : monochrome ? 'text-neutral-700' : 'text-stone-700 dark:text-stone-300'}`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {discoverQuery.isPending ? (
            <View className={`mt-5 rounded-[24px] px-5 py-6 ${monochrome ? 'bg-white' : 'bg-white dark:bg-stone-900'}`}>
              <Text className="text-base text-stone-600 dark:text-stone-400">Carregando comunidade...</Text>
            </View>
          ) : discover?.items.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-5"
              contentContainerClassName="gap-4 pr-5">
              {discover.items.map((book) => (
                <AnimatedReveal key={book.id} className={`w-[300px] rounded-[24px] border p-5 ${monochrome ? 'border-neutral-300 bg-white' : 'border-amber-200 bg-amber-50 dark:border-stone-700 dark:bg-stone-900'}`}>
                  <View className="flex-row items-start justify-between">
                    <Pill
                      label={sharingStatusLabels[book.sharing_status]}
                      tone={sharingStatusTones[book.sharing_status]}
                    />
                    {book.has_physical_copy ? <Pill label="Tem físico" tone="success" /> : null}
                  </View>

                  <Text className={`mt-5 text-xl font-bold ${monochrome ? 'text-black' : 'text-stone-900 dark:text-white'}`}>{book.title}</Text>
                  <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-700 dark:text-stone-400'}`}>{book.author}</Text>

                  <View className={`mt-5 rounded-2xl px-4 py-4 ${monochrome ? 'bg-neutral-100' : 'bg-white dark:bg-stone-800'}`}>
                    <Text className={`text-xs uppercase tracking-[1px] ${monochrome ? 'text-neutral-500' : 'text-stone-600 dark:text-stone-400'}`}>Proprietário</Text>
                    <Text className={`mt-2 text-base font-semibold ${monochrome ? 'text-black' : 'text-stone-900 dark:text-white'}`}>
                      {book.owner.full_name || book.owner.email}
                    </Text>
                    <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-700 dark:text-stone-400'}`}>{book.owner.email}</Text>
                    {book.location_label ? (
                      <Text className={`mt-2 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-700 dark:text-stone-400'}`}>Local: {book.location_label}</Text>
                    ) : null}
                  </View>

                  {book.description ? (
                    <Text className={`mt-4 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-700 dark:text-stone-400'}`}>{book.description}</Text>
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
                </AnimatedReveal>
              ))}
            </ScrollView>
          ) : (
            <View className={`mt-5 rounded-[24px] px-5 py-6 ${monochrome ? 'bg-white' : 'bg-white dark:bg-stone-900'}`}>
              <Text className={`text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>
                Nenhum outro usuário deixou livros públicos por enquanto.
              </Text>
            </View>
          )}
        </AnimatedReveal>
      </View>
    </ScrollView>
  );
}
