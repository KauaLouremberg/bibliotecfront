import { z } from 'zod';

const emailField = z
  .string()
  .min(1, 'Informe o e-mail.')
  .transform((s) => s.trim().toLowerCase())
  .pipe(z.string().email('E-mail inválido.'));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(8, 'Palavra-passe: mínimo 8 caracteres.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Nome completo obrigatório.').max(255, 'Nome muito longo.'),
    email: emailField,
    password: z.string().min(8, 'Mínimo de 8 caracteres.').max(128, 'Máximo de 128 caracteres.'),
    confirm_password: z.string().min(1, 'Confirme a palavra-passe.'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'As palavras-passe não coincidem.',
    path: ['confirm_password'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
