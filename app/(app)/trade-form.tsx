import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAppInsets } from '@/hooks/useAppInsets';
import { useCreateTradeRequest, useDiscoverInventory, useMyInventory } from '@/hooks/useLibrary';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';
import { tradeRequestSchema, type TradeRequestFormValues } from '@/schemas/library';
import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast, showSuccessToast } from '@/utils/feedback';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function canNegotiate(status: string) {
  return status === 'loan' || status === 'exchange' || status === 'donation';
}

export default function TradeFormScreen() {
  const { monochrome } = useInterfaceMode();
  const { topInset } = useAppInsets();
  const params = useLocalSearchParams<{ requestedBookId?: string | string[] }>();
  const requestedBookId = Number(firstParam(params.requestedBookId) ?? 0) || 0;
  const discoverQuery = useDiscoverInventory();
  const inventoryQuery = useMyInventory();
  const createTradeMutation = useCreateTradeRequest();
  useToastOnQueryError(discoverQuery, 'Livro indisponível', 'Não foi possível carregar os livros públicos.');
  useToastOnQueryError(inventoryQuery, 'Inventário indisponível', 'Não foi possível carregar seus livros para oferta.');

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
      <View className={`flex-1 items-center justify-center px-6 ${monochrome ? 'bg-white' : 'bg-[#F5ECD7] dark:bg-[#4A3520]'}`}>
        <Text className={`text-base ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>Carregando proposta...</Text>
      </View>
    );
  }

  if (!requestedBook) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${monochrome ? 'bg-white' : 'bg-[#F5ECD7] dark:bg-[#4A3520]'}`}>
        <Text className={`text-center text-base ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>
          Livro não encontrado na busca. Atualize a lista e tente novamente.
        </Text>
      </View>
    );
  }

  if (!canNegotiate(requestedBook.sharing_status)) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${monochrome ? 'bg-white' : 'bg-[#F5ECD7] dark:bg-[#4A3520]'}`}>
        <Text className={`text-center text-base ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>
          Este livro está apenas visível no perfil e não está disponível para negociação.
        </Text>
        <BackButton className="mt-5" fallbackHref="/(app)/(tabs)/trades" />
      </View>
    );
  }

  return (
    <ScrollView className={`flex-1 ${monochrome ? 'bg-white' : 'bg-[#F5ECD7] dark:bg-[#4A3520]'}`} keyboardShouldPersistTaps="handled">
      <View className="px-5 pb-12" style={{ paddingTop: topInset }}>
        <BackButton className="mb-6" fallbackHref="/(app)/(tabs)/trades" />
        <AnimatedReveal>
          <Text className={`text-3xl font-black leading-tight ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>Proposta de troca</Text>
          <Text className={`mt-2 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>
            Escolha um livro seu para oferecer, ou envie apenas uma mensagem se quiser negociar sem contrapartida imediata.
          </Text>
        </AnimatedReveal>

        <AnimatedReveal delay={100} className={`mt-6 rounded-[24px] border px-5 py-6 ${monochrome ? 'border-neutral-300 bg-white' : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-[#4A3520]'}`}>
          <View className={`rounded-2xl px-4 py-4 ${monochrome ? 'bg-neutral-100' : 'bg-[#F5ECD7] dark:bg-[#F5ECD7]'}`}>
            <Text className={`text-xs uppercase tracking-[1px] ${monochrome ? 'text-neutral-500' : 'text-[#8B6534] dark:text-[#C9A96E]'}`}>Livro solicitado</Text>
            <Text className={`mt-2 text-xl font-bold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>{requestedBook.title}</Text>
            <Text className={`mt-1 text-base ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>{requestedBook.author}</Text>
            <Text className={`mt-3 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>
              Proprietário: {requestedBook.owner.full_name || requestedBook.owner.email}
            </Text>
          </View>

          <View className="mt-6">
            <Text className={`mb-3 text-sm font-semibold ${monochrome ? 'text-neutral-900' : 'text-stone-800 dark:text-stone-300'}`}>Livro oferecido</Text>
            <TouchableOpacity
              className={`mb-3 rounded-2xl border px-4 py-4 ${
                selectedOfferedBookId === null
                  ? monochrome ? 'border-black bg-neutral-100' : 'border-[#8B6534] bg-[#F5ECD7] dark:border-[#8B6534] dark:bg-[#F5ECD7]'
                  : monochrome ? 'border-neutral-300 bg-white' : 'border-stone-200 bg-white dark:border-stone-600 dark:bg-stone-800'
              }`}
              disabled={createTradeMutation.isPending}
              onPress={() => {
                setValue('book_offered_id', null);
              }}>
              <Text className={`text-base font-semibold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>Sem livro oferecido</Text>
              <Text className={`mt-1 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>
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
                          selected
                            ? monochrome ? 'border-black bg-neutral-100' : 'border-[#8B6534] bg-[#F5ECD7] dark:border-[#8B6534] dark:bg-[#F5ECD7]'
                            : monochrome ? 'border-neutral-300 bg-white' : 'border-stone-200 bg-white dark:border-stone-600 dark:bg-stone-800'
                        }`}
                        disabled={createTradeMutation.isPending}
                        onPress={() => {
                          setValue('book_offered_id', book.id);
                        }}>
                        <Text className={`text-base font-semibold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>{book.title}</Text>
                        <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>{book.author}</Text>
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
              <View className="mt-6">
                <TextField
                  ref={ref}
                  label="Mensagem"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  className="min-h-32"
                  placeholder="Ex.: Tenho interesse para a disciplina de Algoritmos e posso oferecer outro título."
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.message?.message}
                />
              </View>
            )}
          />

          <Button
            className="mt-6"
            loading={createTradeMutation.isPending}
            disabled={!requestedBookId}
            onPress={handleSubmit(async (values) => {
              try {
                await createTradeMutation.mutateAsync(values);
                showSuccessToast('Proposta enviada', 'A negociação apareceu na aba Negociações.');
                router.replace('/(app)/(tabs)/trades');
              } catch (error) {
                showErrorToast('Não foi possível enviar', extractApiErrorMessage(error, 'Revise a proposta e tente novamente.'));
              }
            })}>
            Enviar proposta
          </Button>
        </AnimatedReveal>
      </View>
    </ScrollView>
  );
}
