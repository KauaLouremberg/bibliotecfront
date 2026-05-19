import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth';

function apiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { detail?: unknown } | undefined;
    if (data && typeof data.detail === 'string') {
      return data.detail;
    }
  }
  return 'Não foi possível criar a conta. Tente novamente.';
}

export default function RegisterScreen() {
  const { register: signUp, registerPending } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow justify-center px-5 py-8"
        contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full max-w-md self-center">
          <Text className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-50">Criar conta</Text>
          <Text className="mb-8 text-base text-slate-600 dark:text-slate-300">
            Crie a sua conta com e-mail e palavra-passe.
          </Text>

          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Nome completo"
                autoComplete="name"
                textContentType="name"
                value={value}
                onBlur={onBlur}
                onChangeText={(t) => {
                  setFormError(null);
                  onChange(t);
                }}
                error={errors.full_name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="E-mail"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                value={value}
                onBlur={onBlur}
                onChangeText={(t) => {
                  setFormError(null);
                  onChange(t);
                }}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Palavra-passe"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onBlur={onBlur}
                onChangeText={(t) => {
                  setFormError(null);
                  onChange(t);
                }}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextField
                ref={ref}
                label="Confirmar palavra-passe"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onBlur={onBlur}
                onChangeText={(t) => {
                  setFormError(null);
                  onChange(t);
                }}
                error={errors.confirm_password?.message}
              />
            )}
          />

          {formError ? (
            <Text className="mb-4 text-sm text-red-600 dark:text-red-400">{formError}</Text>
          ) : null}

          <Button
            loading={registerPending}
            onPress={handleSubmit(async (v) => {
              setFormError(null);
              try {
                await signUp({
                  email: v.email,
                  password: v.password,
                  full_name: v.full_name.trim(),
                });
                router.replace('/(app)/(tabs)');
              } catch (e) {
                setFormError(apiErrorMessage(e));
              }
            })}>
            Registar
          </Button>

          <Link
            href="/(auth)/login"
            className="mt-6 self-center text-base text-slate-700 underline dark:text-slate-200">
            Já tenho conta
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
