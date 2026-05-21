import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { postIntentOptions } from '@/constants/library';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import {
  useCommunityFeed,
  useDeleteSocialPost,
  useMyInventory,
  useUpsertSocialPost,
} from '@/hooks/useLibrary';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';
import { socialPostSchema, type SocialPostFormValues } from '@/schemas/library';
import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast, showSuccessToast } from '@/utils/feedback';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const emptyValues: SocialPostFormValues = {
  intent: 'need',
  book_title: '',
  book_author: '',
  caption: '',
  location_label: '',
  inventory_book_id: null,
};

export default function SignalFormScreen() {
  const { monochrome } = useInterfaceMode();
  const params = useLocalSearchParams<{
    postId?: string | string[];
    inventoryBookId?: string | string[];
    bookTitle?: string | string[];
    bookAuthor?: string | string[];
  }>();
  const postId = Number(firstParam(params.postId) ?? 0) || undefined;
  const inventoryBookId = Number(firstParam(params.inventoryBookId) ?? 0) || null;
  const routeBookTitle = firstParam(params.bookTitle) ?? '';
  const routeBookAuthor = firstParam(params.bookAuthor) ?? '';
  const inventoryQuery = useMyInventory();
  const feedQuery = useCommunityFeed();
  const { data: inventoryData, isPending: inventoryPending } = inventoryQuery;
  const { data: feedData, isPending: feedPending } = feedQuery;
  const upsertMutation = useUpsertSocialPost();
  const deleteMutation = useDeleteSocialPost();
  const actionPending = upsertMutation.isPending || deleteMutation.isPending;
  useToastOnQueryError(inventoryQuery, 'Inventário indisponível', 'Não foi possível carregar seus livros.');
  useToastOnQueryError(feedQuery, 'Feed indisponível', 'Não foi possível carregar seus sinais.');

  const post = useMemo(() => feedData?.items.find((item) => item.id === postId), [feedData?.items, postId]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SocialPostFormValues>({
    resolver: zodResolver(socialPostSchema),
    defaultValues: emptyValues,
  });

  const intent = watch('intent');
  const selectedInventoryBookId = watch('inventory_book_id');

  useEffect(() => {
    if (post) {
      reset({
        intent: post.intent,
        book_title: post.book_title,
        book_author: post.book_author,
        caption: post.caption,
        location_label: post.location_label,
        inventory_book_id: post.inventory_book?.id ?? null,
      });
      return;
    }

    reset({
      ...emptyValues,
      book_title: routeBookTitle,
      book_author: routeBookAuthor,
      inventory_book_id: inventoryBookId,
      intent: inventoryBookId ? 'offer' : 'need',
    });
  }, [inventoryBookId, post, reset, routeBookAuthor, routeBookTitle]);

  useEffect(() => {
    if (intent === 'need' && selectedInventoryBookId !== null) {
      setValue('inventory_book_id', null);
    }
  }, [intent, selectedInventoryBookId, setValue]);

  if ((postId && feedPending) || inventoryPending) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${monochrome ? 'bg-white' : 'bg-[#4A3520]'}`}>
        <Text className="text-base text-stone-400">Carregando formulário...</Text>
      </View>
    );
  }

  if (postId && !post) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${monochrome ? 'bg-white' : 'bg-[#4A3520]'}`}>
        <Text className="text-center text-base text-stone-400">
          Sinal não encontrado. Ele pode ter sido removido ou não pertence mais ao seu usuário.
        </Text>
        <Button className="mt-5 max-w-[200px]" onPress={() => router.back()}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <ScrollView className={`flex-1 ${monochrome ? 'bg-white' : 'bg-[#4A3520]'}`} keyboardShouldPersistTaps="handled">
      <View className="px-5 pb-12 pt-6">
        <TouchableOpacity className={`mb-6 self-start rounded-full border px-4 py-2 ${monochrome ? 'border-neutral-300' : 'border-white/20'}`} onPress={() => router.back()}>
          <Text className={`text-sm font-bold ${monochrome ? 'text-black' : 'text-white'}`}>Fechar</Text>
        </TouchableOpacity>
        <AnimatedReveal>
          <Text className={`text-3xl font-black leading-tight ${monochrome ? 'text-black' : 'text-white'}`}>
            {post ? 'Editar sinal da comunidade' : 'Publicar sinal no feed'}
          </Text>
          <Text className={`mt-2 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-400'}`}>
            Use este espaço para dizer o que você precisa, está doando, emprestando ou mantendo visível no inventário.
          </Text>
        </AnimatedReveal>

        <AnimatedReveal delay={100} className={`mt-6 rounded-[24px] border px-5 py-6 ${monochrome ? 'border-neutral-300 bg-white' : 'border-stone-700 bg-[#4A3520]'}`}>
          <Controller
            control={control}
            name="intent"
            render={({ field: { value, onChange } }) => (
              <View className="mb-4">
                <Text className={`mb-3 text-sm font-semibold ${monochrome ? 'text-neutral-900' : 'text-stone-300'}`}>Tipo do sinal</Text>
                <View className="gap-3">
                  {postIntentOptions.map((option) => {
                    const selected = value === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        className={`rounded-2xl border px-4 py-4 ${
                          selected
                            ? monochrome ? 'border-black bg-neutral-100' : 'border-[#8B6534] bg-[#F5ECD7]'
                            : monochrome ? 'border-neutral-300 bg-white' : 'border-stone-600 bg-stone-800'
                        }`}
                        disabled={actionPending}
                        onPress={() => onChange(option.value)}>
                        <Text className={`text-base font-semibold ${monochrome ? 'text-black' : 'text-white'}`}>{option.label}</Text>
                        <Text className={`mt-1 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-400'}`}>{option.description}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="book_title"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Título do livro"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.book_title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="book_author"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Autor"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.book_author?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="location_label"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Local de referência"
                placeholder="Ex.: Campus centro, bloco A"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.location_label?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="caption"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Mensagem"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="min-h-32"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.caption?.message}
              />
            )}
          />

          {intent !== 'need' ? (
            <Controller
              control={control}
              name="inventory_book_id"
              render={({ field: { value, onChange } }) => (
                <View className="mb-4">
                  <Text className={`mb-3 text-sm font-semibold ${monochrome ? 'text-neutral-900' : 'text-stone-300'}`}>Vincular ao inventário</Text>
                  <TouchableOpacity
                    className={`mb-3 rounded-2xl border px-4 py-4 ${
                      value === null
                        ? monochrome ? 'border-black bg-neutral-100' : 'border-[#8B6534] bg-[#F5ECD7]'
                        : monochrome ? 'border-neutral-300 bg-white' : 'border-stone-600 bg-stone-800'
                    }`}
                    disabled={actionPending}
                    onPress={() => onChange(null)}>
                    <Text className={`text-base font-semibold ${monochrome ? 'text-black' : 'text-white'}`}>Sem vínculo</Text>
                    <Text className={`mt-1 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-400'}`}>
                      Use quando o post for apenas um pedido ou um aviso solto.
                    </Text>
                  </TouchableOpacity>

                  <View className="gap-3">
                    {inventoryData?.items.map((bk) => {
                      const selected = value === bk.id;
                      return (
                        <TouchableOpacity
                          key={bk.id}
                          className={`rounded-2xl border px-4 py-4 ${
                            selected
                              ? monochrome ? 'border-black bg-neutral-100' : 'border-[#8B6534] bg-[#F5ECD7]'
                              : monochrome ? 'border-neutral-300 bg-white' : 'border-stone-600 bg-stone-800'
                          }`}
                          disabled={actionPending}
                          onPress={() => {
                            onChange(bk.id);
                            setValue('book_title', bk.title);
                            setValue('book_author', bk.author);
                          }}>
                          <Text className={`text-base font-semibold ${monochrome ? 'text-black' : 'text-white'}`}>{bk.title}</Text>
                          <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-400'}`}>{bk.author}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            />
          ) : null}

          <Button
            className="mt-6"
            loading={upsertMutation.isPending}
            disabled={deleteMutation.isPending}
            onPress={handleSubmit(async (values) => {
              try {
                await upsertMutation.mutateAsync({
                  id: postId,
                  ...values,
                });
                showSuccessToast(post ? 'Sinal atualizado' : 'Sinal publicado', 'A comunidade já pode ver essa informação.');
                router.back();
              } catch (error) {
                showErrorToast('Não foi possível salvar', extractApiErrorMessage(error, 'Revise os dados do sinal e tente novamente.'));
              }
            })}>
            {post ? 'Salvar sinal' : 'Publicar sinal'}
          </Button>

          {post ? (
            <Button
              variant="danger"
              className="mt-3"
              loading={deleteMutation.isPending}
              disabled={upsertMutation.isPending}
              onPress={async () => {
                try {
                  await deleteMutation.mutateAsync(post.id);
                  showSuccessToast('Sinal removido', 'A publicação saiu do feed.');
                  router.back();
                } catch (error) {
                  showErrorToast('Não foi possível remover', extractApiErrorMessage(error, 'Tente novamente em instantes.'));
                }
              }}>
              Remover sinal
            </Button>
          ) : null}
        </AnimatedReveal>
      </View>
    </ScrollView>
  );
}
