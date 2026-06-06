# Acervo (front)

Cliente mobile **Acervo** em **Expo SDK 54** com **Expo Router**, **NativeWind**, **TanStack Query**, **React Hook Form** + **Zod**, **Axios** (`services/api.ts`) e **expo-secure-store** para tokens JWT.

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

3. Instale dependências:

   ```bash
   npm install
   ```

## Rodar o projeto

```bash
npm run start
```

Ou `npx expo start`. Depois escolha **Android**, **iOS** ou **web** no terminal ou na interface do Expo.

- Em **dispositivo físico**, o app substitui automaticamente `127.0.0.1` pelo IP da máquina (o mesmo que o Metro mostra no QR). Pode forçar com `EXPO_PUBLIC_API_URL=http://SEU_IP:8000` no `.env`.
- O Django deve rodar na rede: `python manage.py runserver 0.0.0.0:8000` (PC e telemóvel na mesma Wi‑Fi).
- O APK de release sai como **`Acervo-release.apk`** (plugin em `plugins/withAcervoApkName.js`).

### Gerar APK (release)

Requisito: **JDK 17** (Java 26 quebra o Gradle).

```bash
sudo pacman -S jdk17-openjdk
```

Confirme `.env` com a URL do Render:

```
EXPO_PUBLIC_API_URL=https://acervo-api.onrender.com
```

```bash
pnpm run android:release
```

Ou manualmente:

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

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
| `constants/config.ts` | URL base da API e chaves SecureStore |

## Stack de UI e estilos

- **NativeWind v4**: `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css` importado em `app/_layout.tsx`.
