import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth';
import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast, showSuccessToast } from '@/utils/feedback';

export default function RegisterScreen() {
  const { register: signUp, registerPending } = useAuth();
  const { monochrome } = useInterfaceMode();

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
      className={`flex-1 ${monochrome ? 'bg-white' : 'bg-[#f4ead7] dark:bg-slate-950'}`}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow justify-center px-6 py-10"
        contentContainerStyle={{ flexGrow: 1 }}>
        <AnimatedReveal className={`w-full max-w-md self-center rounded-[32px] border px-6 py-8 ${monochrome ? 'border-neutral-300 bg-white' : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'}`}>
          <Text className={`text-sm font-bold uppercase tracking-[2px] ${monochrome ? 'text-neutral-500' : 'text-orange-700 dark:text-orange-400'}`}>Novo acesso</Text>
          <Text className={`mt-3 text-3xl font-black leading-tight ${monochrome ? 'text-black' : 'text-stone-900 dark:text-white'}`}>Crie sua biblioteca</Text>
          <Text className={`mb-8 mt-3 text-base leading-6 ${monochrome ? 'text-neutral-700' : 'text-stone-600 dark:text-stone-300'}`}>
            Cadastre seus dados e comece a trocar livros com a comunidade.
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
                onChangeText={onChange}
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
                autoComplete="new-password"
                textContentType="newPassword"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
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
                onChangeText={onChange}
                error={errors.confirm_password?.message}
              />
            )}
          />

          <View className="mt-2">
            <Button
              loading={registerPending}
              onPress={handleSubmit(async (v) => {
                try {
                  await signUp({
                    email: v.email,
                    password: v.password,
                    full_name: v.full_name.trim(),
                  });
                  showSuccessToast('Conta criada', 'Seu acesso foi liberado.');
                } catch (e) {
                  showErrorToast('Não foi possível criar a conta', extractApiErrorMessage(e, 'Revise os dados e tente novamente.'));
                }
              })}>
              Registar
            </Button>
          </View>

          <Link
            href="/(auth)/login"
            className={`mt-8 self-center text-base font-medium underline ${monochrome ? 'text-black' : 'text-stone-700 dark:text-stone-300'}`}>
            Já tenho conta
          </Link>
        </AnimatedReveal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
