import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, ScrollView, Switch, Text, View } from 'react-native';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAuth } from '@/hooks/useAuth';
import { profileSchema, type ProfileFormValues } from '@/schemas/auth';
import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/utils/feedback';

function fallbackAvatar(name: string | undefined) {
  const letter = name?.trim().charAt(0).toUpperCase();
  return letter || 'B';
}

const maxAvatarSize = 5 * 1024 * 1024;

export default function ProfileScreen() {
  const { user, logout, updateAvatar, updateProfile, avatarPending, profilePending } = useAuth();
  const { monochrome, setMonochromeMode } = useInterfaceMode();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      course: '',
      semester: '',
      current_password: '',
      new_password: '',
    },
  });

  useEffect(() => {
    reset({
      full_name: user?.full_name ?? '',
      course: user?.course ?? '',
      semester: user?.semester ?? '',
      current_password: '',
      new_password: '',
    });
  }, [reset, user?.course, user?.full_name, user?.semester]);

  async function pickAvatar() {
    if (avatarPending || profilePending) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showWarningToast('Permissão necessária', 'Permita acesso às fotos para enviar o avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) {
      return;
    }
    const asset = result.assets[0];
    if (asset.mimeType && !asset.mimeType.startsWith('image/')) {
      showWarningToast('Arquivo inválido', 'Selecione uma imagem para usar como foto.');
      return;
    }
    if (asset.fileSize && asset.fileSize > maxAvatarSize) {
      showWarningToast('Imagem muito grande', 'A foto deve ter no máximo 5 MB.');
      return;
    }
    try {
      await updateAvatar({
        file: {
          uri: asset.uri,
          name: asset.fileName ?? `avatar-${Date.now()}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        },
      });
      showSuccessToast('Foto atualizada', 'Seu avatar foi salvo.');
    } catch (uploadError) {
      showErrorToast('Não foi possível atualizar a foto', extractApiErrorMessage(uploadError, 'Tente escolher outra imagem.'));
    }
  }

  return (
    <ScrollView className={`flex-1 ${monochrome ? 'bg-white' : 'bg-[#F5ECD7] dark:bg-[#4A3520]'}`} keyboardShouldPersistTaps="handled">
      <View className="px-5 pb-32 pt-6">
        <AnimatedReveal>
          <Text className={`text-3xl font-black ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>Perfil</Text>
          <Text className={`mt-2 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>
            Atualize seus dados públicos, informações acadêmicas e a palavra-passe da conta.
          </Text>
        </AnimatedReveal>

        <AnimatedReveal delay={80} className={`mt-6 rounded-[24px] border px-5 py-5 ${monochrome ? 'border-neutral-300 bg-neutral-50' : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-[#4A3520]'}`}>
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className={`text-base font-bold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>Modo preto e branco</Text>
              <Text className={`mt-1 text-sm leading-5 ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>
                Reduz cores e aumenta previsibilidade de contraste.
              </Text>
            </View>
            <Switch
              value={monochrome}
              onValueChange={setMonochromeMode}
              trackColor={{ false: '#d6d3d1', true: '#111111' }}
              thumbColor={monochrome ? '#ffffff' : '#fafaf9'}
            />
          </View>
        </AnimatedReveal>

        <AnimatedReveal delay={130} className={`mt-6 rounded-[28px] border px-5 py-7 ${monochrome ? 'border-neutral-300 bg-white' : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-[#4A3520]'}`}>
          <View className="items-center">
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} className="h-24 w-24 rounded-full bg-stone-200 dark:bg-stone-700" resizeMode="cover" />
            ) : (
              <View className={`h-24 w-24 items-center justify-center rounded-full ${monochrome ? 'bg-neutral-200' : 'bg-amber-100 dark:bg-orange-900/30'}`}>
                <Text className={`text-3xl font-bold ${monochrome ? 'text-neutral-950' : 'text-amber-800 dark:text-orange-300'}`}>{fallbackAvatar(user?.full_name)}</Text>
              </View>
            )}

            <Text className={`mt-4 text-lg font-bold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>
              {user?.full_name || 'Seu nome'}
            </Text>
            <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>{user?.email}</Text>
          </View>

          <View className="mt-6 gap-3">
            <Button loading={avatarPending} disabled={profilePending} onPress={() => void pickAvatar()}>
              {user?.avatar_url ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
            </Button>
            {user?.avatar_url ? (
              <Button
                variant="secondary"
                loading={avatarPending}
                disabled={profilePending}
                onPress={async () => {
                  try {
                    await updateAvatar({ remove: true });
                    showSuccessToast('Foto removida', 'Seu perfil voltou ao avatar padrão.');
                  } catch (uploadError) {
                    showErrorToast('Não foi possível remover a foto', extractApiErrorMessage(uploadError, 'Tente novamente em instantes.'));
                  }
                }}>
                Remover foto
              </Button>
            ) : null}
          </View>

          <View className={`my-6 h-px ${monochrome ? 'bg-neutral-200' : 'bg-stone-100 dark:bg-stone-700'}`} />

          <Text className={`mb-5 text-lg font-bold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>Dados pessoais</Text>

          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Nome completo"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.full_name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="course"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Curso"
                placeholder="Ex.: Engenharia de Software"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.course?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="semester"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Semestre"
                placeholder="Ex.: 5º semestre"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.semester?.message}
              />
            )}
          />

          <View className={`my-4 h-px ${monochrome ? 'bg-neutral-200' : 'bg-stone-100 dark:bg-stone-700'}`} />

          <Text className={`mb-5 text-lg font-bold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>Segurança</Text>

          <Controller
            control={control}
            name="current_password"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Palavra-passe atual"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.current_password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="new_password"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Nova palavra-passe"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.new_password?.message}
              />
            )}
          />

          <View className="mt-4 gap-3">
            <Button
              loading={profilePending}
              disabled={avatarPending}
              onPress={handleSubmit(async (values) => {
                try {
                  await updateProfile({
                    full_name: values.full_name,
                    course: values.course,
                    semester: values.semester,
                    current_password: values.current_password || undefined,
                    new_password: values.new_password || undefined,
                  });
                  reset({
                    ...values,
                    current_password: '',
                    new_password: '',
                  });
                  showSuccessToast('Perfil atualizado', 'Suas informações foram salvas.');
                } catch (updateError) {
                  showErrorToast('Não foi possível atualizar o perfil', extractApiErrorMessage(updateError, 'Revise os dados e tente novamente.'));
                }
              })}>
              Salvar perfil
            </Button>
          </View>

          <View className={`my-6 h-px ${monochrome ? 'bg-neutral-200' : 'bg-stone-100 dark:bg-stone-700'}`} />

          <Button
            variant="danger"
            disabled={avatarPending || profilePending}
            onPress={() => {
              void logout();
            }}>
            Sair da conta
          </Button>
        </AnimatedReveal>
      </View>
    </ScrollView>
  );
}
