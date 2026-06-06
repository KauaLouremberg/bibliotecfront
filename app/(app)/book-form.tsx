import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { sharingStatusLabels, sharingStatusOptions } from '@/constants/library';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAppInsets } from '@/hooks/useAppInsets';
import { useDeleteInventoryBook, useMyInventory, useUpsertInventoryBook } from '@/hooks/useLibrary';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';
import { inventoryBookSchema, type InventoryBookFormValues } from '@/schemas/library';
import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/utils/feedback';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const emptyValues: InventoryBookFormValues = {
  title: '',
  author: '',
  description: '',
  genre: '',
  published_year: '',
  publisher: '',
  isbn: '',
  page_count: '',
  cover_url: '',
  location_label: '',
  has_physical_copy: false,
  sharing_status: 'private',
};

const maxCoverSize = 5 * 1024 * 1024;

export default function BookFormScreen() {
  const { monochrome } = useInterfaceMode();
  const { topInset } = useAppInsets();
  const params = useLocalSearchParams<{
    bookId?: string | string[];
    title?: string | string[];
    author?: string | string[];
    description?: string | string[];
    genre?: string | string[];
    publishedYear?: string | string[];
    publisher?: string | string[];
    isbn?: string | string[];
    pageCount?: string | string[];
    coverUrl?: string | string[];
  }>();
  const bookId = Number(firstParam(params.bookId) ?? 0) || undefined;
  const inventoryQuery = useMyInventory();
  const { data, isPending } = inventoryQuery;
  const upsertMutation = useUpsertInventoryBook();
  const deleteMutation = useDeleteInventoryBook();
  const [selectedCover, setSelectedCover] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const actionPending = upsertMutation.isPending || deleteMutation.isPending;
  useToastOnQueryError(inventoryQuery, 'Inventário indisponível', 'Não foi possível carregar seu inventário.');

  const book = useMemo(
    () => data?.items.find((item) => item.id === bookId),
    [bookId, data?.items],
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
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
        genre: book.genre,
        published_year: book.published_year ? String(book.published_year) : '',
        publisher: book.publisher,
        isbn: book.isbn,
        page_count: book.page_count ? String(book.page_count) : '',
        cover_url: book.cover_url,
        location_label: book.location_label,
        has_physical_copy: book.has_physical_copy,
        sharing_status: book.sharing_status,
      });
      setSelectedCover(null);
      setRemoveCover(false);
      return;
    }

    reset({
      ...emptyValues,
      title: firstParam(params.title) ?? '',
      author: firstParam(params.author) ?? '',
      description: firstParam(params.description) ?? '',
      genre: firstParam(params.genre) ?? '',
      published_year: firstParam(params.publishedYear) ?? '',
      publisher: firstParam(params.publisher) ?? '',
      isbn: firstParam(params.isbn) ?? '',
      page_count: firstParam(params.pageCount) ?? '',
      cover_url: firstParam(params.coverUrl) ?? '',
    });
    setSelectedCover(null);
    setRemoveCover(false);
  }, [
    book,
    params.author,
    params.coverUrl,
    params.description,
    params.genre,
    params.isbn,
    params.pageCount,
    params.publishedYear,
    params.publisher,
    params.title,
    reset,
  ]);

  async function selectCover() {
    if (actionPending) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showWarningToast('Permissão necessária', 'Permita acesso às fotos para enviar a capa.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (result.canceled) {
      return;
    }
    const asset = result.assets[0];
    if (asset.mimeType && !asset.mimeType.startsWith('image/')) {
      showWarningToast('Arquivo inválido', 'Selecione uma imagem para usar como capa.');
      return;
    }
    if (asset.fileSize && asset.fileSize > maxCoverSize) {
      showWarningToast('Imagem muito grande', 'A capa deve ter no máximo 5 MB.');
      return;
    }
    setSelectedCover({
      uri: asset.uri,
      name: asset.fileName ?? `cover-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    });
    setValue('cover_url', '');
    setRemoveCover(false);
  }

  const remoteCoverUrl = watch('cover_url');
  const previewUri = removeCover ? '' : selectedCover?.uri ?? book?.cover_url ?? remoteCoverUrl ?? '';

  if (bookId && isPending) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${monochrome ? 'bg-white' : 'bg-[#F5ECD7]'}`}>
        <Text className={`text-base ${monochrome ? 'text-neutral-600' : 'text-[#4A3520]'}`}>Carregando livro...</Text>
      </View>
    );
  }

  if (bookId && !book) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${monochrome ? 'bg-white' : 'bg-[#F5ECD7]'}`}>
        <Text className={`text-center text-base ${monochrome ? 'text-neutral-600' : 'text-[#4A3520]'}`}>
          Livro não encontrado no seu inventário. Atualize a lista e tente novamente.
        </Text>
        <BackButton className="mt-5" fallbackHref="/(app)/(tabs)" />
      </View>
    );
  }

  return (
    <ScrollView className={`flex-1 ${monochrome ? 'bg-white' : 'bg-[#F5ECD7]'}`} keyboardShouldPersistTaps="handled">
      <View className="px-5 pb-12" style={{ paddingTop: topInset }}>
        <BackButton className="mb-6" fallbackHref="/(app)/(tabs)" />
        <AnimatedReveal>
          <Text className={`text-3xl font-black leading-tight ${monochrome ? 'text-black' : 'text-[#4A3520]'}`}>
            {book ? 'Editar livro do inventário' : 'Adicionar livro ao inventário'}
          </Text>
          <Text className={`mt-2 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-[#4A3520]/75'}`}>
            Todo item nasce como ebook. Se você também tiver a cópia física, marque isso abaixo para exibição aos outros usuários.
          </Text>
        </AnimatedReveal>

        <AnimatedReveal delay={100} className={`mt-6 rounded-[24px] border px-5 py-6 ${monochrome ? 'border-neutral-300 bg-white' : 'border-[#C9A96E]/45 bg-[#E8D5B0]'}`}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Título"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
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
                onChangeText={onChange}
                error={errors.author?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="genre"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Gênero"
                placeholder="Ex.: Romance, Fantasia, História"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.genre?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="publisher"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Editora"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.publisher?.message}
              />
            )}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="published_year"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <TextField
                    ref={ref}
                    label="Ano"
                    keyboardType="number-pad"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.published_year?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="page_count"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <TextField
                    ref={ref}
                    label="Páginas"
                    keyboardType="number-pad"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.page_count?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="isbn"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="ISBN"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.isbn?.message}
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
                onChangeText={onChange}
                error={errors.location_label?.message}
              />
            )}
          />

          <View className="mb-6">
            <Text className={`mb-3 text-sm font-semibold ${monochrome ? 'text-neutral-900' : 'text-[#4A3520]'}`}>Capa do livro</Text>
            {previewUri ? (
              <Image source={{ uri: previewUri }} className="mb-3 h-56 w-40 rounded-3xl bg-[#C9A96E]/30" resizeMode="cover" />
            ) : (
              <View className={`mb-3 h-56 w-40 items-center justify-center rounded-3xl ${monochrome ? 'bg-neutral-200' : 'bg-[#F5ECD7]'}`}>
                <Text className={`text-sm font-semibold ${monochrome ? 'text-neutral-900' : 'text-[#4A3520]'}`}>Sem capa</Text>
              </View>
            )}
            <View className="gap-3">
              <Button variant="secondary" disabled={actionPending} onPress={() => void selectCover()}>
                {previewUri ? 'Trocar capa' : 'Selecionar capa'}
              </Button>
              {previewUri ? (
                <Button
                  variant="danger"
                  disabled={actionPending}
                  onPress={() => {
                    setSelectedCover(null);
                    setRemoveCover(true);
                    setValue('cover_url', '');
                  }}>
                  Remover capa
                </Button>
              ) : null}
            </View>
          </View>

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Sinopse/descrição"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="min-h-28"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.description?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="has_physical_copy"
            render={({ field: { onChange, value } }) => (
              <View className={`mb-6 flex-row items-center justify-between rounded-2xl px-4 py-4 ${monochrome ? 'bg-neutral-100' : 'bg-[#F5ECD7]'}`}>
                <View className="mr-4 flex-1">
                  <Text className={`text-base font-semibold ${monochrome ? 'text-black' : 'text-[#4A3520]'}`}>Também possuo a cópia física</Text>
                  <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-[#4A3520]/75'}`}>
                    Outros usuários verão que você tem o ebook e o exemplar físico.
                  </Text>
                </View>
                <Switch value={value} onValueChange={onChange} trackColor={{ true: '#8B6534' }} />
              </View>
            )}
          />

          <Controller
            control={control}
            name="sharing_status"
            render={({ field: { value, onChange } }) => (
              <View>
                <Text className={`mb-3 text-sm font-semibold ${monochrome ? 'text-neutral-900' : 'text-[#4A3520]'}`}>Disponibilidade</Text>
                <View className="gap-3">
                  {sharingStatusOptions.map((option) => {
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
                {errors.sharing_status?.message ? (
                  <Text className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.sharing_status.message}</Text>
                ) : null}
              </View>
            )}
          />

          <Button
            className="mt-8"
            loading={upsertMutation.isPending}
            disabled={deleteMutation.isPending}
            onPress={handleSubmit(async (values) => {
              try {
                await upsertMutation.mutateAsync({
                  id: bookId,
                  ...values,
                  cover: selectedCover,
                  remove_cover: removeCover,
                });
                showSuccessToast(book ? 'Livro atualizado' : 'Livro adicionado', 'Seu inventário foi salvo.');
                router.back();
              } catch (error) {
                showErrorToast('Não foi possível salvar', extractApiErrorMessage(error, 'Revise os dados do livro e tente novamente.'));
              }
            })}>
            {book ? 'Salvar alterações' : 'Adicionar livro'}
          </Button>

          {book ? (
            <Button
              variant="danger"
              className="mt-3"
              loading={deleteMutation.isPending}
              disabled={upsertMutation.isPending}
              onPress={async () => {
                try {
                  await deleteMutation.mutateAsync(book.id);
                  showSuccessToast('Livro removido', 'O item saiu do seu inventário.');
                  router.back();
                } catch (error) {
                  showErrorToast('Não foi possível remover', extractApiErrorMessage(error, 'Tente novamente em instantes.'));
                }
              }}>
              Remover do inventário
            </Button>
          ) : null}

          {book ? (
            <TouchableOpacity
              className="mt-6"
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
              <Text className={`text-center text-sm font-semibold ${monochrome ? 'text-black' : 'text-[#8B6534]'}`}>
                Criar um sinal público usando {sharingStatusLabels[book.sharing_status].toLowerCase()}
              </Text>
            </TouchableOpacity>
          ) : null}
        </AnimatedReveal>
      </View>
    </ScrollView>
  );
}
