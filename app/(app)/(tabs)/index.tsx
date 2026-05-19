import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import {
  sharingStatusLabels,
  sharingStatusTones,
} from '@/constants/library';
import { useAuth } from '@/hooks/useAuth';
import { useCommunityFeed, useDiscoverInventory, useMyInventory } from '@/hooks/useLibrary';

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <View className="min-w-[92px] flex-1 rounded-2xl bg-white/10 px-4 py-3">
      <Text className="text-2xl font-bold text-white">{value}</Text>
      <Text className="mt-1 text-xs uppercase tracking-[1px] text-orange-100">{label}</Text>
    </View>
  );
}

export default function InventoryScreen() {
  const { user } = useAuth();
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [tradeStatusFilter, setTradeStatusFilter] = useState<'loan' | 'exchange' | 'donation' | null>(null);
  const deferredDiscoverSearch = useDeferredValue(discoverSearch.trim());
  const inventoryQuery = useMyInventory();
  const discoverQuery = useDiscoverInventory({
    search: deferredDiscoverSearch,
    trade_status: tradeStatusFilter,
  });
  const feedQuery = useCommunityFeed();

  const inventory = inventoryQuery.data;
  const discover = discoverQuery.data;
  const isRefreshing =
    inventoryQuery.isRefetching || discoverQuery.isRefetching || feedQuery.isRefetching;

  return (
    <ScrollView
      className="flex-1 bg-[#f8f1e7]"
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
      <View className="px-5 pb-12 pt-4">
        <View className="rounded-[32px] bg-stone-900 px-5 py-6">
          <Text className="text-sm uppercase tracking-[1.5px] text-orange-200">Meu acervo digital</Text>
          <Text className="mt-3 text-3xl font-bold text-white">
            {user?.full_name ? `${user.full_name},` : 'Bibliotec,'} organize seus ebooks e sinalize o que pode circular.
          </Text>
          <Text className="mt-3 text-base leading-6 text-orange-50">
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
              className="bg-orange-500"
              onPress={() => {
                router.push('/(app)/book-form');
              }}>
              Adicionar livro
            </Button>
            <Button
              variant="secondary"
              className="border-orange-200"
              onPress={() => {
                router.push('/(app)/signal-form');
              }}>
              Publicar um sinal para a comunidade
            </Button>
          </View>
        </View>

        <View className="mt-8">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-stone-900">Inventário pessoal</Text>
              <Text className="mt-1 text-sm text-stone-600">
                Seus livros digitais e quais títulos físicos você também possui.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                router.push('/(app)/(tabs)/profile');
              }}>
              <Text className="text-sm font-semibold text-stone-500">Perfil</Text>
            </TouchableOpacity>
          </View>

          {inventoryQuery.isPending ? (
            <View className="rounded-[28px] bg-white px-5 py-6">
              <Text className="text-base text-stone-600">Carregando inventário...</Text>
            </View>
          ) : inventory?.items.length ? (
            <View className="gap-4">
              {inventory.items.map((book) => (
                <View key={book.id} className="rounded-[28px] border border-stone-200 bg-white p-5">
                  <View className="flex-row gap-4">
                    {book.cover_url ? (
                      <Image
                        source={{ uri: book.cover_url }}
                        className="h-32 w-24 rounded-2xl bg-stone-200"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="h-32 w-24 items-center justify-center rounded-2xl bg-orange-100">
                        <Text className="text-center text-xs font-semibold uppercase tracking-[1px] text-orange-700">
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

                      <Text className="mt-3 text-2xl font-bold text-stone-900">{book.title}</Text>
                      <Text className="mt-1 text-base text-stone-600">{book.author}</Text>

                      {book.location_label ? (
                        <Text className="mt-3 text-sm font-medium text-stone-700">
                          Local: {book.location_label}
                        </Text>
                      ) : null}

                      {book.description ? (
                        <Text className="mt-3 text-sm leading-6 text-stone-600">{book.description}</Text>
                      ) : null}

                      {book.matches_waiting > 0 ? (
                        <View className="mt-4 rounded-2xl bg-amber-50 px-4 py-3">
                          <Text className="text-sm font-semibold text-amber-800">
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
            <View className="rounded-[28px] bg-white px-5 py-6">
              <Text className="text-lg font-semibold text-stone-900">Seu inventário ainda está vazio.</Text>
              <Text className="mt-2 text-sm leading-6 text-stone-600">
                Adicione seus ebooks e marque se você também possui cópia física para mostrar isso à comunidade.
              </Text>
            </View>
          )}
        </View>

        <View className="mt-10">
          <Text className="text-2xl font-bold text-stone-900">Bibliotecas abertas</Text>
          <Text className="mt-1 text-sm text-stone-600">
            Livros públicos de outros usuários que podem gerar contato imediato.
          </Text>

          <View className="mt-4">
            <TextInput
              value={discoverSearch}
              onChangeText={setDiscoverSearch}
              placeholder="Buscar por título ou autor"
              placeholderTextColor="#a8a29e"
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-900"
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
                    className={`rounded-full px-4 py-2 ${selected ? 'bg-stone-900' : 'bg-white'}`}
                    onPress={() => {
                      setTradeStatusFilter(option.value as 'loan' | 'exchange' | 'donation' | null);
                    }}>
                    <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-stone-700'}`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {discoverQuery.isPending ? (
            <View className="mt-4 rounded-[28px] bg-white px-5 py-6">
              <Text className="text-base text-stone-600">Carregando comunidade...</Text>
            </View>
          ) : discover?.items.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4"
              contentContainerClassName="gap-4 pr-5">
              {discover.items.map((book) => (
                <View key={book.id} className="w-[300px] rounded-[28px] bg-[#fff7ed] p-5">
                  <View className="flex-row items-start justify-between">
                    <Pill
                      label={sharingStatusLabels[book.sharing_status]}
                      tone={sharingStatusTones[book.sharing_status]}
                    />
                    {book.has_physical_copy ? <Pill label="Tem físico" tone="success" /> : null}
                  </View>

                  <Text className="mt-5 text-2xl font-bold text-stone-900">{book.title}</Text>
                  <Text className="mt-1 text-base text-stone-600">{book.author}</Text>

                  <View className="mt-6 rounded-2xl bg-white px-4 py-4">
                    <Text className="text-sm uppercase tracking-[1px] text-stone-500">Proprietário</Text>
                    <Text className="mt-2 text-lg font-semibold text-stone-900">
                      {book.owner.full_name || book.owner.email}
                    </Text>
                    <Text className="mt-1 text-sm text-stone-600">{book.owner.email}</Text>
                    {book.location_label ? (
                      <Text className="mt-2 text-sm text-stone-600">Local: {book.location_label}</Text>
                    ) : null}
                  </View>

                  {book.description ? (
                    <Text className="mt-4 text-sm leading-6 text-stone-600">{book.description}</Text>
                  ) : null}

                  <Button
                    className="mt-5"
                    onPress={() => {
                      router.push({
                        pathname: '/(app)/trade-form',
                        params: {
                          requestedBookId: String(book.id),
                        },
                      });
                    }}>
                    Propor troca
                  </Button>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="mt-4 rounded-[28px] bg-white px-5 py-6">
              <Text className="text-sm leading-6 text-stone-600">
                Nenhum outro usuário deixou livros públicos por enquanto.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
