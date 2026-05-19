import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { postIntentOptions } from '@/constants/library';
import {
  useCommunityFeed,
  useDeleteSocialPost,
  useMyInventory,
  useUpsertSocialPost,
} from '@/hooks/useLibrary';
import { socialPostSchema, type SocialPostFormValues } from '@/schemas/library';
import { extractApiErrorMessage } from '@/utils/apiError';

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
  const { data: inventoryData, isPending: inventoryPending } = useMyInventory();
  const { data: feedData, isPending: feedPending } = useCommunityFeed();
  const upsertMutation = useUpsertSocialPost();
  const deleteMutation = useDeleteSocialPost();
  const [formError, setFormError] = useState<string | null>(null);

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
      <View className="flex-1 items-center justify-center bg-stone-950 px-6">
        <Text className="text-base text-stone-300">Carregando formulário...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-stone-950" keyboardShouldPersistTaps="handled">
      <View className="px-5 pb-10 pt-5">
        <Text className="text-3xl font-bold text-white">
          {post ? 'Editar sinal da comunidade' : 'Publicar sinal no feed'}
        </Text>
        <Text className="mt-2 text-sm leading-6 text-stone-300">
          Use este espaço para dizer o que você precisa, está doando, emprestando ou mantendo visível no inventário.
        </Text>

        <View className="mt-6 rounded-[28px] bg-white px-5 py-5">
          <Controller
            control={control}
            name="intent"
            render={({ field: { value, onChange } }) => (
              <View>
                <Text className="mb-3 text-sm font-medium text-stone-700">Tipo do sinal</Text>
                <View className="gap-3">
                  {postIntentOptions.map((option) => {
                    const selected = value === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        className={`rounded-2xl border px-4 py-4 ${
                          selected ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white'
                        }`}
                        onPress={() => {
                          setFormError(null);
                          onChange(option.value);
                        }}>
                        <Text className="text-base font-semibold text-stone-900">{option.label}</Text>
                        <Text className="mt-1 text-sm leading-6 text-stone-600">{option.description}</Text>
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
                onChangeText={(text) => {
                  setFormError(null);
                  onChange(text);
                }}
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
                onChangeText={(text) => {
                  setFormError(null);
                  onChange(text);
                }}
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
                onChangeText={(text) => {
                  setFormError(null);
                  onChange(text);
                }}
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
                onChangeText={(text) => {
                  setFormError(null);
                  onChange(text);
                }}
                error={errors.caption?.message}
              />
            )}
          />

          {intent !== 'need' ? (
            <Controller
              control={control}
              name="inventory_book_id"
              render={({ field: { value, onChange } }) => (
                <View className="mb-2">
                  <Text className="mb-3 text-sm font-medium text-stone-700">Vincular ao inventário</Text>
                  <TouchableOpacity
                    className={`mb-3 rounded-2xl border px-4 py-4 ${
                      value === null ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white'
                    }`}
                    onPress={() => onChange(null)}>
                    <Text className="text-base font-semibold text-stone-900">Sem vínculo</Text>
                    <Text className="mt-1 text-sm leading-6 text-stone-600">
                      Use quando o post for apenas um pedido ou um aviso solto.
                    </Text>
                  </TouchableOpacity>

                  <View className="gap-3">
                    {inventoryData?.items.map((book) => {
                      const selected = value === book.id;
                      return (
                        <TouchableOpacity
                          key={book.id}
                          className={`rounded-2xl border px-4 py-4 ${
                            selected ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white'
                          }`}
                          onPress={() => {
                            onChange(book.id);
                            setValue('book_title', book.title);
                            setValue('book_author', book.author);
                          }}>
                          <Text className="text-base font-semibold text-stone-900">{book.title}</Text>
                          <Text className="mt-1 text-sm text-stone-600">{book.author}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            />
          ) : null}

          {formError ? <Text className="mt-4 text-sm text-red-600">{formError}</Text> : null}

          <Button
            className="mt-6"
            loading={upsertMutation.isPending}
            onPress={handleSubmit(async (values) => {
              setFormError(null);
              try {
                await upsertMutation.mutateAsync({
                  id: postId,
                  ...values,
                });
                router.back();
              } catch (error) {
                setFormError(extractApiErrorMessage(error, 'Não foi possível publicar este sinal.'));
              }
            })}>
            {post ? 'Salvar sinal' : 'Publicar sinal'}
          </Button>

          {post ? (
            <Button
              variant="danger"
              className="mt-3"
              loading={deleteMutation.isPending}
              onPress={async () => {
                setFormError(null);
                try {
                  await deleteMutation.mutateAsync(post.id);
                  router.back();
                } catch (error) {
                  setFormError(extractApiErrorMessage(error, 'Não foi possível remover este sinal.'));
                }
              }}>
              Remover sinal
            </Button>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
