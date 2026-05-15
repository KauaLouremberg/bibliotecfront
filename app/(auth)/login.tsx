import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { INSTITUTIONAL_EMAIL_SUFFIX } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';

function apiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { detail?: unknown } | undefined;
    if (data && typeof data.detail === 'string') {
      return data.detail;
    }
    return 'Credenciais inválidas ou servidor indisponível.';
  }
  return 'Ocorreu um erro inesperado.';
}

export default function LoginScreen() {
  const { login, loginPending } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
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
          <Text className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-50">Bibliotec</Text>
          <Text className="mb-8 text-base text-slate-600 dark:text-slate-300">
            Entre com o seu e-mail institucional ({INSTITUTIONAL_EMAIL_SUFFIX})
          </Text>

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
                autoComplete="password"
                textContentType="password"
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

          {formError ? (
            <Text className="mb-4 text-sm text-red-600 dark:text-red-400">{formError}</Text>
          ) : null}

          <Button
            loading={loginPending}
            onPress={handleSubmit(async (v) => {
              setFormError(null);
              try {
                await login(v.email, v.password);
                router.replace('/(app)/(tabs)');
              } catch (e) {
                setFormError(apiErrorMessage(e));
              }
            })}>
            Entrar
          </Button>

          <Link
            href="/(auth)/register"
            className="mt-6 self-center text-base text-slate-700 underline dark:text-slate-200">
            Criar conta
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
