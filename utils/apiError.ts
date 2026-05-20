import { isAxiosError } from 'axios';

function messageFromDetail(detail: unknown): string | null {
  if (typeof detail === 'string' && detail.trim()) {
    const normalized = detail.trim().toLowerCase();
    if (normalized === 'unauthorized') {
      return 'Você precisa entrar novamente para continuar.';
    }
    if (normalized === 'forbidden') {
      return 'Você não tem permissão para realizar esta ação.';
    }
    if (
      normalized.includes('token') ||
      normalized.includes('credentials') ||
      normalized.includes('authentication')
    ) {
      return 'Sua sessão expirou. Entre novamente para continuar.';
    }
    if (normalized === 'not found' || normalized.includes('not found')) {
      return 'O item solicitado não foi encontrado ou não está mais disponível.';
    }
    return detail;
  }

  if (Array.isArray(detail)) {
    return null;
  }

  return null;
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
    }

    const data = error.response.data as { detail?: unknown; message?: unknown } | undefined;
    const detailMessage = messageFromDetail(data?.detail ?? data?.message);
    if (detailMessage) {
      return detailMessage;
    }

    switch (error.response.status) {
      case 400:
        return fallback;
      case 401:
        return 'Sua sessão expirou. Entre novamente para continuar.';
      case 403:
        return 'Você não tem permissão para realizar esta ação.';
      case 404:
        return 'O item solicitado não foi encontrado ou não está mais disponível.';
      case 409:
        return 'Essa ação conflita com o estado atual dos dados. Atualize a tela e tente novamente.';
      case 413:
        return 'O arquivo enviado é muito grande.';
      case 415:
        return 'Formato de arquivo não permitido.';
      case 422:
        return fallback;
      case 500:
      case 502:
      case 503:
      case 504:
        return 'O servidor está indisponível no momento. Tente novamente em instantes.';
      default:
        return fallback;
    }
  }

  return fallback;
}
