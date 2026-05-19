import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { sharingStatusLabels, sharingStatusOptions } from '@/constants/library';
import { useDeleteInventoryBook, useMyInventory, useUpsertInventoryBook } from '@/hooks/useLibrary';
import { inventoryBookSchema, type InventoryBookFormValues } from '@/schemas/library';
import { extractApiErrorMessage } from '@/utils/apiError';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const emptyValues: InventoryBookFormValues = {
  title: '',
  author: '',
  description: '',
  cover_url: '',
  location_label: '',
  has_physical_copy: false,
  sharing_status: 'private',
};

export default function BookFormScreen() {
  const params = useLocalSearchParams<{ bookId?: string | string[] }>();
  const bookId = Number(firstParam(params.bookId) ?? 0) || undefined;
  const { data, isPending } = useMyInventory();
  const upsertMutation = useUpsertInventoryBook();
  const deleteMutation = useDeleteInventoryBook();
  const [formError, setFormError] = useState<string | null>(null);

  const book = useMemo(
    () => data?.items.find((item) => item.id === bookId),
    [bookId, data?.items],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryBookFormValues>({
    resolver: zodResolver(inventoryBookSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (book) {
      reset({
        title: book.title,
        author: book.author,
        description: book.description,
        cover_url: book.cover_url,
        location_label: book.location_label,
        has_physical_copy: book.has_physical_copy,
        sharing_status: book.sharing_status,
      });
      return;
    }

    reset(emptyValues);
  }, [book, reset]);

  if (bookId && isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f8f1e7] px-6">
        <Text className="text-base text-stone-600">Carregando livro...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#f8f1e7]" keyboardShouldPersistTaps="handled">
      <View className="px-5 pb-10 pt-5">
        <Text className="text-3xl font-bold text-stone-900">
          {book ? 'Editar livro do inventário' : 'Adicionar livro ao inventário'}
        </Text>
        <Text className="mt-2 text-sm leading-6 text-stone-600">
          Todo item nasce como ebook. Se você também tiver a cópia física, marque isso abaixo para exibição aos outros usuários.
        </Text>

        <View className="mt-6 rounded-[28px] bg-white px-5 py-5">
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Título"
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => {
                  setFormError(null);
                  onChange(text);
                }}
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="author"
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
                error={errors.author?.message}
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
                placeholder="Ex.: Biblioteca central, bloco B"
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
            name="cover_url"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="URL da capa"
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => {
                  setFormError(null);
                  onChange(text);
                }}
                error={errors.cover_url?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Observações"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="min-h-28"
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => {
                  setFormError(null);
                  onChange(text);
                }}
                error={errors.description?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="has_physical_copy"
            render={({ field: { onChange, value } }) => (
              <View className="mb-5 flex-row items-center justify-between rounded-2xl bg-stone-100 px-4 py-4">
                <View className="mr-4 flex-1">
                  <Text className="text-base font-semibold text-stone-900">Também possuo a cópia física</Text>
                  <Text className="mt-1 text-sm text-stone-600">
                    Outros usuários verão que você tem o ebook e o exemplar físico.
                  </Text>
                </View>
                <Switch value={value} onValueChange={onChange} trackColor={{ true: '#fb923c' }} />
              </View>
            )}
          />

          <Controller
            control={control}
            name="sharing_status"
            render={({ field: { value, onChange } }) => (
              <View>
                <Text className="mb-3 text-sm font-medium text-stone-700">Disponibilidade</Text>
                <View className="gap-3">
                  {sharingStatusOptions.map((option) => {
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
                {errors.sharing_status?.message ? (
                  <Text className="mt-2 text-sm text-red-600">{errors.sharing_status.message}</Text>
                ) : null}
              </View>
            )}
          />

          {formError ? <Text className="mt-5 text-sm text-red-600">{formError}</Text> : null}

          <Button
            className="mt-6"
            loading={upsertMutation.isPending}
            onPress={handleSubmit(async (values) => {
              setFormError(null);
              try {
                await upsertMutation.mutateAsync({
                  id: bookId,
                  ...values,
                });
                router.back();
              } catch (error) {
                setFormError(extractApiErrorMessage(error, 'Não foi possível salvar este livro.'));
              }
            })}>
            {book ? 'Salvar alterações' : 'Adicionar livro'}
          </Button>

          {book ? (
            <Button
              variant="danger"
              className="mt-3"
              loading={deleteMutation.isPending}
              onPress={async () => {
                setFormError(null);
                try {
                  await deleteMutation.mutateAsync(book.id);
                  router.back();
                } catch (error) {
                  setFormError(extractApiErrorMessage(error, 'Não foi possível remover este livro.'));
                }
              }}>
              Remover do inventário
            </Button>
          ) : null}

          {book ? (
            <TouchableOpacity
              className="mt-5"
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
              <Text className="text-center text-sm font-semibold text-orange-700">
                Criar um sinal público usando {sharingStatusLabels[book.sharing_status].toLowerCase()}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
