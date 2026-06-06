import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { postIntentOptions } from '@/constants/library';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAppInsets } from '@/hooks/useAppInsets';
import {
  useMyInventory,
  useMySignal,
  useDeleteSocialPost,
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
  const { topInset } = useAppInsets();
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
  const mySignalQuery = useMySignal(postId);
  const { data: inventoryData, isPending: inventoryPending } = inventoryQuery;
  const { data: post, isPending: mySignalPending, isError: mySignalError } = mySignalQuery;
  const upsertMutation = useUpsertSocialPost();
  const deleteMutation = useDeleteSocialPost();
  const actionPending = upsertMutation.isPending || deleteMutation.isPending;
  useToastOnQueryError(inventoryQuery, 'Inventário indisponível', 'Não foi possível carregar seus livros.');

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

  if ((postId && mySignalPending) || inventoryPending) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${monochrome ? 'bg-white' : 'bg-[#4A3520]'}`}>
        <Text className="text-base text-stone-400">Carregando formulário...</Text>
      </View>
    );
  }

  if (postId && !mySignalPending && (mySignalError || !post)) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${monochrome ? 'bg-white' : 'bg-[#4A3520]'}`}>
        <Text className="text-center text-base text-stone-400">
          Sinal não encontrado. Ele pode ter sido removido ou não pertence mais ao seu usuário.
        </Text>
        <BackButton className="mt-5" fallbackHref="/(app)/(tabs)/two" />
      </View>
    );
  }

  return (
    <ScrollView className={`flex-1 ${monochrome ? 'bg-white' : 'bg-[#4A3520]'}`} keyboardShouldPersistTaps="handled">
      <View className="px-5 pb-12" style={{ paddingTop: topInset }}>
        <BackButton className="mb-6" color={monochrome ? '#111111' : '#F5ECD7'} fallbackHref="/(app)/(tabs)/two" />
        <AnimatedReveal>
          <Text className={`text-3xl font-black leading-tight ${monochrome ? 'text-black' : 'text-white'}`}>
            {post ? 'Editar sinal da comunidade' : 'Publicar sinal no feed'}
          </Text>
          <Text className={`mt-2 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-400'}`}>
            Use este espaço para dizer o que você precisa, está doando, emprestando ou mantendo visível no inventário.
          </Text>
        </AnimatedReveal>

        <AnimatedReveal delay={100} className={`mt-6 rounded-[24px] border px-5 py-6 ${monochrome ? 'border-neutral-300 bg-white' : 'border-[#C9A96E]/45 bg-[#E8D5B0]'}`}>
          <Controller
            control={control}
            name="intent"
            render={({ field: { value, onChange } }) => (
              <View className="mb-4">
                <Text className={`mb-1 text-sm font-semibold ${monochrome ? 'text-neutral-900' : 'text-[#4A3520]'}`}>Tipo do sinal</Text>
                <Text className={`mb-3 text-xs leading-5 ${monochrome ? 'text-neutral-600' : 'text-[#4A3520]/70'}`}>
                  Escolha se você procura, oferece, empresta, troca ou doa um livro.
                </Text>
                <View className="gap-3">
                  {postIntentOptions.map((option) => {
                    const selected = value === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        className={`rounded-2xl border px-4 py-4 ${
                          selected
                            ? monochrome ? 'border-black bg-neutral-100' : 'border-[#8B6534] bg-[#F5ECD7]'
                            : monochrome ? 'border-neutral-300 bg-white' : 'border-[#C9A96E]/70 bg-[#E8D5B0]'
                        }`}
                        disabled={actionPending}
                        onPress={() => onChange(option.value)}>
                        <Text className={`text-base font-semibold ${monochrome ? 'text-black' : 'text-[#4A3520]'}`}>{option.label}</Text>
                        <Text className={`mt-1 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-[#4A3520]/75'}`}>{option.description}</Text>
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
                hint="Nome da obra que aparecerá no feed da comunidade."
                placeholder="Ex.: Dom Casmurro"
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
                hint="Autor principal. Ajuda outros usuários a encontrar o título certo."
                placeholder="Ex.: Machado de Assis"
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
                hint="Opcional. Bairro, campus ou ponto de encontro para facilitar combinações presenciais."
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
                hint="Conte condição do livro, prazo, se aceita troca ou qualquer detalhe útil."
                placeholder="Ex.: Tenho a edição de bolso, aceito troca por ficção científica..."
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
                  <Text className={`mb-1 text-sm font-semibold ${monochrome ? 'text-neutral-900' : 'text-[#4A3520]'}`}>Vincular ao inventário</Text>
                  <Text className={`mb-3 text-xs leading-5 ${monochrome ? 'text-neutral-600' : 'text-[#4A3520]/70'}`}>
                    Opcional. Selecione um livro do seu acervo para preencher título e autor automaticamente.
                  </Text>
                  <TouchableOpacity
                    className={`mb-3 rounded-2xl border px-4 py-4 ${
                      value === null
                        ? monochrome ? 'border-black bg-neutral-100' : 'border-[#8B6534] bg-[#F5ECD7]'
                        : monochrome ? 'border-neutral-300 bg-white' : 'border-[#C9A96E]/70 bg-[#E8D5B0]'
                    }`}
                    disabled={actionPending}
                    onPress={() => onChange(null)}>
                    <Text className={`text-base font-semibold ${monochrome ? 'text-black' : 'text-[#4A3520]'}`}>Sem vínculo</Text>
                    <Text className={`mt-1 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-[#4A3520]/75'}`}>
                      Publicar só o aviso, sem associar a um item do inventário.
                    </Text>
                  </TouchableOpacity>

                  {inventoryData?.items.length ? (
                    <View className="gap-3">
                      {inventoryData.items.map((bk) => {
                        const selected = value === bk.id;
                        return (
                          <TouchableOpacity
                            key={bk.id}
                            className={`rounded-2xl border px-4 py-4 ${
                              selected
                                ? monochrome ? 'border-black bg-neutral-100' : 'border-[#8B6534] bg-[#F5ECD7]'
                                : monochrome ? 'border-neutral-300 bg-white' : 'border-[#C9A96E]/70 bg-[#E8D5B0]'
                            }`}
                            disabled={actionPending}
                            onPress={() => {
                              onChange(bk.id);
                              setValue('book_title', bk.title);
                              setValue('book_author', bk.author);
                            }}>
                            <Text className={`text-base font-semibold ${monochrome ? 'text-black' : 'text-[#4A3520]'}`}>{bk.title}</Text>
                            <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-[#4A3520]/75'}`}>{bk.author}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <View className={`rounded-2xl border px-4 py-4 ${monochrome ? 'border-neutral-300 bg-neutral-50' : 'border-[#C9A96E]/70 bg-[#F5ECD7]'}`}>
                      <Text className={`text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-[#4A3520]/75'}`}>
                        Seu inventário está vazio. Adicione livros na aba Inventário para vinculá-los aqui.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            />
          ) : (
            <View className={`mb-4 rounded-2xl border px-4 py-4 ${monochrome ? 'border-neutral-300 bg-neutral-50' : 'border-[#C9A96E]/70 bg-[#F5ECD7]'}`}>
              <Text className={`text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-[#4A3520]/75'}`}>
                Sinais do tipo &quot;Preciso&quot; não exigem vínculo com o inventário — basta informar título, autor e mensagem.
              </Text>
            </View>
          )}

          <Button
            className="mt-6"
            loading={upsertMutation.isPending}
            disabled={deleteMutation.isPending}
            onPress={handleSubmit((values) => {
              upsertMutation.mutate(
                { id: postId, ...values },
                {
                  onSuccess: () => {
                    showSuccessToast(
                      post ? 'Sinal atualizado' : 'Sinal publicado',
                      post ? 'Suas alterações foram salvas.' : 'Seu sinal aparece em Meus sinais.',
                    );
                    router.back();
                  },
                  onError: (error) => {
                    showErrorToast(
                      'Não foi possível salvar',
                      extractApiErrorMessage(error, 'Revise os dados do sinal e tente novamente.'),
                    );
                  },
                },
              );
            })}>
            {post ? 'Salvar sinal' : 'Publicar sinal'}
          </Button>

          {post ? (
            <Button
              variant="danger"
              className="mt-3"
              loading={deleteMutation.isPending}
              disabled={upsertMutation.isPending}
              onPress={() => {
                deleteMutation.mutate(post.id, {
                  onSuccess: () => {
                    showSuccessToast('Sinal removido', 'A publicação saiu da sua lista.');
                    router.back();
                  },
                  onError: (error) => {
                    showErrorToast(
                      'Não foi possível remover',
                      extractApiErrorMessage(error, 'Tente novamente em instantes.'),
                    );
                  },
                });
              }}>
              Remover sinal
            </Button>
          ) : null}
        </AnimatedReveal>
      </View>
    </ScrollView>
  );
}
