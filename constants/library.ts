export const sharingStatusOptions = [
  {
    value: 'private',
    label: 'Privado',
    description: 'Só aparece no seu inventário.',
  },
  {
    value: 'showcase',
    label: 'Vitrine',
    description: 'Outros usuários veem que você possui este título.',
  },
  {
    value: 'loan',
    label: 'Empréstimo',
    description: 'Você aceita emprestar este livro.',
  },
  {
    value: 'exchange',
    label: 'Troca',
    description: 'Você quer trocar este livro por outro.',
  },
  {
    value: 'donation',
    label: 'Doação',
    description: 'Você quer doar este livro.',
  },
] as const;

export const postIntentOptions = [
  {
    value: 'need',
    label: 'Preciso',
    description: 'Estou procurando este livro.',
  },
  {
    value: 'donation',
    label: 'Doando',
    description: 'Quero doar este título.',
  },
  {
    value: 'exchange',
    label: 'Troca',
    description: 'Busco troca com outros usuários.',
  },
  {
    value: 'loan',
    label: 'Empresto',
    description: 'Posso emprestar para leitura.',
  },
  {
    value: 'offer',
    label: 'Disponível',
    description: 'Tenho este livro no meu inventário.',
  },
] as const;

export const sharingStatusLabels = Object.fromEntries(
  sharingStatusOptions.map((option) => [option.value, option.label]),
) as Record<(typeof sharingStatusOptions)[number]['value'], string>;

export const postIntentLabels = Object.fromEntries(
  postIntentOptions.map((option) => [option.value, option.label]),
) as Record<(typeof postIntentOptions)[number]['value'], string>;

export const sharingStatusTones: Record<
  (typeof sharingStatusOptions)[number]['value'],
  'neutral' | 'accent' | 'success' | 'warning'
> = {
  private: 'neutral',
  showcase: 'accent',
  loan: 'accent',
  exchange: 'warning',
  donation: 'success',
};

export const postIntentTones: Record<
  (typeof postIntentOptions)[number]['value'],
  'accent' | 'success' | 'warning' | 'danger'
> = {
  need: 'warning',
  donation: 'success',
  exchange: 'accent',
  loan: 'accent',
  offer: 'danger',
};

export const tradeStatusLabels = {
  pending: 'Pendente',
  accepted: 'Aceita',
  rejected: 'Recusada',
  completed: 'Concluída',
} as const;

export const tradeStatusTones: Record<
  keyof typeof tradeStatusLabels,
  'warning' | 'accent' | 'danger' | 'success'
> = {
  pending: 'warning',
  accepted: 'accent',
  rejected: 'danger',
  completed: 'success',
};
