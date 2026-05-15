const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '');

/** Origem do backend (sem `/api`). Os pedidos em `services/api.ts` usam caminhos `/api/...`. */
export const API_URL = trimTrailingSlash(process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000');

/** Domínio institucional sem `@`, alinhado a `INSTITUTIONAL_EMAIL_DOMAIN` no Django. */
export const INSTITUTIONAL_EMAIL_DOMAIN = (
  process.env.EXPO_PUBLIC_INSTITUTIONAL_EMAIL_DOMAIN ?? 'aluno.wyden.edu.br'
)
  .trim()
  .toLowerCase();

export const INSTITUTIONAL_EMAIL_SUFFIX = `@${INSTITUTIONAL_EMAIL_DOMAIN}`;

export const SECURE_ACCESS_KEY = 'bibliotec_access_token';
export const SECURE_REFRESH_KEY = 'bibliotec_refresh_token';
