import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/hooks/useAuth';
import { profileSchema, type ProfileFormValues } from '@/schemas/auth';
import { extractApiErrorMessage } from '@/utils/apiError';

function fallbackAvatar(name: string | undefined) {
  const letter = name?.trim().charAt(0).toUpperCase();
  return letter || 'B';
}

export default function ProfileScreen() {
  const { user, logout, updateAvatar, updateProfile, avatarPending, profilePending } = useAuth();
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permita acesso às fotos para enviar o avatar.');
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
    try {
      await updateAvatar({
        file: {
          uri: asset.uri,
          name: asset.fileName ?? `avatar-${Date.now()}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        },
      });
    } catch (uploadError) {
      setError(extractApiErrorMessage(uploadError, 'Não foi possível atualizar a foto.'));
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#f8f1e7]" keyboardShouldPersistTaps="handled">
      <View className="px-5 pb-10 pt-5">
        <Text className="text-3xl font-bold text-stone-900">Perfil</Text>
        <Text className="mt-2 text-sm leading-6 text-stone-600">
          Atualize seus dados públicos, informações acadêmicas e a palavra-passe da conta.
        </Text>

        <View className="mt-6 rounded-[32px] bg-white px-5 py-6">
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} className="h-28 w-28 rounded-full bg-stone-100" resizeMode="cover" />
          ) : (
            <View className="h-28 w-28 items-center justify-center rounded-full bg-orange-100">
              <Text className="text-4xl font-bold text-orange-700">{fallbackAvatar(user?.full_name)}</Text>
            </View>
          )}

          <Text className="mt-5 text-2xl font-bold text-stone-900">{user?.email}</Text>

          <View className="mt-5 gap-3">
            <Button loading={avatarPending} onPress={() => void pickAvatar()}>
              {user?.avatar_url ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
            </Button>
            {user?.avatar_url ? (
              <Button
                variant="secondary"
                loading={avatarPending}
                onPress={async () => {
                  setError(null);
                  try {
                    await updateAvatar({ remove: true });
                  } catch (uploadError) {
                    setError(extractApiErrorMessage(uploadError, 'Não foi possível remover a foto.'));
                  }
                }}>
                Remover foto
              </Button>
            ) : null}
          </View>

          <View className="mt-6">
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <TextField
                  ref={ref}
                  label="Nome completo"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    setError(null);
                    onChange(text);
                  }}
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
                  onChangeText={(text) => {
                    setError(null);
                    onChange(text);
                  }}
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
                  onChangeText={(text) => {
                    setError(null);
                    onChange(text);
                  }}
                  error={errors.semester?.message}
                />
              )}
            />

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
                  onChangeText={(text) => {
                    setError(null);
                    onChange(text);
                  }}
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
                  onChangeText={(text) => {
                    setError(null);
                    onChange(text);
                  }}
                  error={errors.new_password?.message}
                />
              )}
            />
          </View>

          {error ? <Text className="mt-2 text-sm text-red-600">{error}</Text> : null}

          <View className="mt-6 gap-3">
            <Button
              loading={profilePending}
              onPress={handleSubmit(async (values) => {
                setError(null);
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
                } catch (updateError) {
                  setError(extractApiErrorMessage(updateError, 'Não foi possível atualizar o perfil.'));
                }
              })}>
              Salvar perfil
            </Button>
            <Button
              variant="danger"
              onPress={() => {
                void logout();
              }}>
              Sair
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
