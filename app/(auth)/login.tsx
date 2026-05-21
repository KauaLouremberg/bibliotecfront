import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast } from '@/utils/feedback';

export default function LoginScreen() {
  const { login, loginPending } = useAuth();
  const { monochrome } = useInterfaceMode();

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
      className={`flex-1 ${monochrome ? 'bg-white' : 'bg-[#f4ead7] dark:bg-slate-950'}`}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow justify-center px-6 py-10"
        contentContainerStyle={{ flexGrow: 1 }}>
        <AnimatedReveal className={`w-full max-w-md self-center rounded-[32px] border px-6 py-8 ${monochrome ? 'border-neutral-300 bg-white' : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'}`}>
          <Text className={`text-sm font-bold uppercase tracking-[2px] ${monochrome ? 'text-neutral-500' : 'text-orange-700 dark:text-orange-400'}`}>Bibliotec</Text>
          <Text className={`mt-3 text-3xl font-black leading-tight ${monochrome ? 'text-black' : 'text-stone-900 dark:text-white'}`}>Entre no seu acervo</Text>
          <Text className={`mb-8 mt-3 text-base leading-6 ${monochrome ? 'text-neutral-700' : 'text-stone-600 dark:text-stone-300'}`}>
            Continue organizando livros, propostas e conexões da comunidade.
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
                onChangeText={onChange}
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
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          <View className="mt-2">
            <Button
              loading={loginPending}
              onPress={handleSubmit(async (v) => {
                try {
                  await login(v.email, v.password);
                } catch (e) {
                  showErrorToast('Não foi possível entrar', extractApiErrorMessage(e, 'E-mail ou palavra-passe inválidos.'));
                }
              })}>
              Entrar
            </Button>
          </View>

          <Link
            href="/(auth)/register"
            className={`mt-8 self-center text-base font-medium underline ${monochrome ? 'text-black' : 'text-stone-700 dark:text-stone-300'}`}>
            Criar conta
          </Link>
        </AnimatedReveal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
