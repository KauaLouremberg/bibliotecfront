# Bibliotec (front)

Cliente mobile em **Expo SDK 54** com **Expo Router**, **NativeWind**, **TanStack Query**, **React Hook Form** + **Zod**, **Axios** (`services/api.ts`) e **expo-secure-store** para tokens JWT.

## Pré-requisitos

- Node.js LTS
- Backend Django com API em `/api/` (por defeito em `http://127.0.0.1:8000`)

## Configuração

1. Copie as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

2. Ajuste `.env` se necessário:

   - `EXPO_PUBLIC_API_URL` — origem do servidor (sem `/api`; o cliente chama `${URL}/api/auth/...`).
   - `EXPO_PUBLIC_INSTITUTIONAL_EMAIL_DOMAIN` — domínio institucional **sem** `@` (igual a `INSTITUTIONAL_EMAIL_DOMAIN` no Django; por defeito `aluno.wyden.edu.br`).

3. Instale dependências:

   ```bash
   npm install
   ```

## Correr o projeto

```bash
npm run start
```

Ou `npx expo start`. Depois escolha **Android**, **iOS** ou **web** no terminal ou na interface do Expo.

- Em **dispositivo físico Android**, use o IP da máquina em `EXPO_PUBLIC_API_URL` em vez de `127.0.0.1`, para o telemóvel alcançar o Django na rede local.
- Confirme **CORS** no backend para a origem do Metro (por exemplo `http://localhost:8081` em desenvolvimento web).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run start` | Metro / Expo |
| `npm run typecheck` | `tsc --noEmit` |

## Estrutura relevante

| Caminho | Função |
|---------|--------|
| `app/(auth)/` | Login e registo |
| `app/(app)/` | Área autenticada (tabs, modal) |
| `app/index.tsx` | Redireciona para login ou tabs conforme a sessão |
| `components/` | UI base (`Button`, `TextField`, …) |
| `contexts/AuthContext.tsx` | Sessão, mutações de auth, pedido `/me` |
| `hooks/useAuth.ts` | Reexporta `useAuth` e `AuthProvider` |
| `services/api.ts` | Cliente Axios, refresh automático, SecureStore |
| `schemas/` | Schemas Zod dos formulários |
| `constants/config.ts` | URL base e domínio de e-mail institucional |

## Stack de UI e estilos

- **NativeWind v4**: `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css` importado em `app/_layout.tsx`.
