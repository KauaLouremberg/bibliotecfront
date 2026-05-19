import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useCreateTradeRequest, useDiscoverInventory, useMyInventory } from '@/hooks/useLibrary';
import { tradeRequestSchema, type TradeRequestFormValues } from '@/schemas/library';
import { extractApiErrorMessage } from '@/utils/apiError';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function TradeFormScreen() {
  const params = useLocalSearchParams<{ requestedBookId?: string | string[] }>();
  const requestedBookId = Number(firstParam(params.requestedBookId) ?? 0) || 0;
  const discoverQuery = useDiscoverInventory();
  const inventoryQuery = useMyInventory();
  const createTradeMutation = useCreateTradeRequest();
  const [formError, setFormError] = useState<string | null>(null);

  const requestedBook = useMemo(
    () => discoverQuery.data?.items.find((item) => item.id === requestedBookId),
    [discoverQuery.data?.items, requestedBookId],
  );

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TradeRequestFormValues>({
    resolver: zodResolver(tradeRequestSchema),
    defaultValues: {
      book_requested_id: requestedBookId,
      book_offered_id: null,
      message: '',
    },
  });

  const selectedOfferedBookId = watch('book_offered_id');

  if (discoverQuery.isPending || inventoryQuery.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f8f1e7] px-6">
        <Text className="text-base text-stone-600">Carregando proposta...</Text>
      </View>
    );
  }

  if (!requestedBook) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f8f1e7] px-6">
        <Text className="text-center text-base text-stone-600">
          Livro não encontrado no discover. Atualize a lista e tente novamente.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#f8f1e7]" keyboardShouldPersistTaps="handled">
      <View className="px-5 pb-10 pt-5">
        <Text className="text-3xl font-bold text-stone-900">Proposta de troca</Text>
        <Text className="mt-2 text-sm leading-6 text-stone-600">
          Escolha um livro seu para oferecer, ou envie apenas uma mensagem se quiser negociar sem contrapartida imediata.
        </Text>

        <View className="mt-6 rounded-[28px] bg-white px-5 py-5">
          <View className="rounded-2xl bg-orange-50 px-4 py-4">
            <Text className="text-sm uppercase tracking-[1px] text-orange-700">Livro solicitado</Text>
            <Text className="mt-2 text-xl font-bold text-stone-900">{requestedBook.title}</Text>
            <Text className="mt-1 text-base text-stone-600">{requestedBook.author}</Text>
            <Text className="mt-3 text-sm text-stone-600">
              Proprietário: {requestedBook.owner.full_name || requestedBook.owner.email}
            </Text>
          </View>

          <View className="mt-5">
            <Text className="mb-3 text-sm font-medium text-stone-700">Livro oferecido</Text>
            <TouchableOpacity
              className={`mb-3 rounded-2xl border px-4 py-4 ${
                selectedOfferedBookId === null ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white'
              }`}
              onPress={() => {
                setFormError(null);
                setValue('book_offered_id', null);
              }}>
              <Text className="text-base font-semibold text-stone-900">Sem livro oferecido</Text>
              <Text className="mt-1 text-sm leading-6 text-stone-600">
                Use quando você quiser abrir a conversa primeiro.
              </Text>
            </TouchableOpacity>

            <Controller
              control={control}
              name="book_offered_id"
              render={() => (
                <View className="gap-3">
                  {inventoryQuery.data?.items.map((book) => {
                    const selected = selectedOfferedBookId === book.id;
                    return (
                      <TouchableOpacity
                        key={book.id}
                        className={`rounded-2xl border px-4 py-4 ${
                          selected ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white'
                        }`}
                        onPress={() => {
                          setFormError(null);
                          setValue('book_offered_id', book.id);
                        }}>
                        <Text className="text-base font-semibold text-stone-900">{book.title}</Text>
                        <Text className="mt-1 text-sm text-stone-600">{book.author}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </View>

          <Controller
            control={control}
            name="message"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Mensagem"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="mt-5 min-h-32"
                placeholder="Ex.: Tenho interesse para a disciplina de Algoritmos e posso oferecer outro título."
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => {
                  setFormError(null);
                  onChange(text);
                }}
                error={errors.message?.message}
              />
            )}
          />

          {formError ? <Text className="mt-2 text-sm text-red-600">{formError}</Text> : null}

          <Button
            className="mt-5"
            loading={createTradeMutation.isPending}
            onPress={handleSubmit(async (values) => {
              setFormError(null);
              try {
                await createTradeMutation.mutateAsync(values);
                router.replace('/(app)/(tabs)/trades');
              } catch (error) {
                setFormError(extractApiErrorMessage(error, 'Não foi possível enviar a proposta.'));
              }
            })}>
            Enviar proposta
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
