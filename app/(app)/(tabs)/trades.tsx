import { ScrollView, Text, View } from 'react-native';
import { useState } from 'react';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { tradeStatusLabels, tradeStatusTones } from '@/constants/library';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useMyTrades, useUpdateTradeRequestStatus, type TradeRequest } from '@/hooks/useLibrary';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';
import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast, showSuccessToast } from '@/utils/feedback';

function TradeCard({
  trade,
  monochrome,
  onAccept,
  onReject,
  onComplete,
  loading,
  disabled,
}: {
  trade: TradeRequest;
  monochrome: boolean;
  onAccept: () => void;
  onReject: () => void;
  onComplete: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <View className={`rounded-[24px] border px-5 py-5 ${monochrome ? 'border-neutral-300 bg-white' : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-[#4A3520]'}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className={`text-xl font-bold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>{trade.book_requested.title}</Text>
          <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>{trade.book_requested.author}</Text>
        </View>
        <Pill label={tradeStatusLabels[trade.status]} tone={tradeStatusTones[trade.status]} />
      </View>

      <View className={`mt-4 rounded-2xl px-4 py-4 ${monochrome ? 'bg-neutral-100' : 'bg-stone-50 dark:bg-stone-800'}`}>
        <Text className={`text-xs uppercase tracking-[1px] ${monochrome ? 'text-neutral-500' : 'text-stone-600 dark:text-stone-400'}`}>
          {trade.is_incoming ? 'Solicitado por' : 'Enviado para'}
        </Text>
        <Text className={`mt-2 text-base font-semibold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>
          {trade.is_incoming
            ? trade.requester.full_name || trade.requester.email
            : trade.owner.full_name || trade.owner.email}
        </Text>
        <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>
          {trade.is_incoming ? trade.requester.email : trade.owner.email}
        </Text>
      </View>

      {trade.book_offered ? (
        <View className="mt-4">
          <Text className={`text-xs uppercase tracking-[1px] ${monochrome ? 'text-neutral-500' : 'text-stone-600 dark:text-stone-400'}`}>Livro oferecido</Text>
          <Text className={`mt-2 text-base font-semibold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>{trade.book_offered.title}</Text>
          <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>{trade.book_offered.author}</Text>
        </View>
      ) : null}

      {trade.message ? <Text className={`mt-4 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>{trade.message}</Text> : null}

      {trade.status === 'pending' && trade.is_incoming ? (
        <View className="mt-5 flex-row gap-3">
          <Button className="flex-1" loading={loading} disabled={disabled} onPress={onAccept}>
            Aceitar
          </Button>
          <Button variant="danger" className="flex-1" loading={loading} disabled={disabled} onPress={onReject}>
            Recusar
          </Button>
        </View>
      ) : null}

      {trade.status === 'accepted' ? (
        <Button className="mt-5" loading={loading} disabled={disabled} onPress={onComplete}>
          Marcar como concluída
        </Button>
      ) : null}
    </View>
  );
}

export default function TradesScreen() {
  const tradesQuery = useMyTrades();
  const updateTradeMutation = useUpdateTradeRequestStatus();
  const [activeTradeId, setActiveTradeId] = useState<number | null>(null);
  const { monochrome } = useInterfaceMode();
  useToastOnQueryError(tradesQuery, 'Negociações indisponíveis', 'Não foi possível carregar suas negociações.');

  const incoming = tradesQuery.data?.incoming ?? [];
  const outgoing = tradesQuery.data?.outgoing ?? [];

  async function updateStatus(id: number, status: 'accepted' | 'rejected' | 'completed') {
    if (updateTradeMutation.isPending) return;
    setActiveTradeId(id);
    try {
      await updateTradeMutation.mutateAsync({ id, status });
      const title =
        status === 'accepted'
          ? 'Proposta aceita'
          : status === 'rejected'
            ? 'Proposta recusada'
            : 'Negociação concluída';
      showSuccessToast(title, 'A lista de negociações foi atualizada.');
    } catch (updateError) {
      showErrorToast('Não foi possível atualizar', extractApiErrorMessage(updateError, 'Atualize a tela e tente novamente.'));
    } finally {
      setActiveTradeId(null);
    }
  }

  return (
    <ScrollView className={`flex-1 ${monochrome ? 'bg-white' : 'bg-[#F5ECD7] dark:bg-[#4A3520]'}`}>
      <View className="px-5 pb-32 pt-6">
        <AnimatedReveal>
          <Text className={`text-3xl font-black ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>Negociações</Text>
          <Text className={`mt-2 text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>
            Acompanhe propostas enviadas e recebidas sem sair do app.
          </Text>
        </AnimatedReveal>

        <AnimatedReveal delay={100} className="mt-8">
          <Text className={`text-xl font-bold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>Recebidas</Text>
          <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>Solicitações para livros do seu inventário.</Text>

          {tradesQuery.isPending ? (
            <View className={`mt-4 rounded-[24px] px-5 py-6 ${monochrome ? 'border border-neutral-300 bg-white' : 'bg-white dark:bg-[#4A3520]'}`}>
              <Text className={`text-base ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>Carregando negociações...</Text>
            </View>
          ) : incoming.length ? (
            <View className="mt-4 gap-4">
              {incoming.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  monochrome={monochrome}
                  loading={updateTradeMutation.isPending && activeTradeId === trade.id}
                  disabled={updateTradeMutation.isPending && activeTradeId !== trade.id}
                  onAccept={() => void updateStatus(trade.id, 'accepted')}
                  onReject={() => void updateStatus(trade.id, 'rejected')}
                  onComplete={() => void updateStatus(trade.id, 'completed')}
                />
              ))}
            </View>
          ) : (
            <View className={`mt-4 rounded-[24px] px-5 py-6 ${monochrome ? 'border border-neutral-300 bg-white' : 'bg-white dark:bg-[#4A3520]'}`}>
              <Text className={`text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>Nenhuma proposta recebida por enquanto.</Text>
            </View>
          )}
        </AnimatedReveal>

        <AnimatedReveal delay={180} className="mt-10">
          <Text className={`text-xl font-bold ${monochrome ? 'text-black' : 'text-[#4A3520] dark:text-white'}`}>Enviadas</Text>
          <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>Propostas que você abriu com outros usuários.</Text>

          {outgoing.length ? (
            <View className="mt-4 gap-4">
              {outgoing.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  monochrome={monochrome}
                  loading={updateTradeMutation.isPending && activeTradeId === trade.id}
                  disabled={updateTradeMutation.isPending && activeTradeId !== trade.id}
                  onAccept={() => undefined}
                  onReject={() => undefined}
                  onComplete={() => void updateStatus(trade.id, 'completed')}
                />
              ))}
            </View>
          ) : (
            <View className={`mt-4 rounded-[24px] px-5 py-6 ${monochrome ? 'border border-neutral-300 bg-white' : 'bg-white dark:bg-[#4A3520]'}`}>
              <Text className={`text-sm leading-6 ${monochrome ? 'text-neutral-600' : 'text-stone-600 dark:text-stone-400'}`}>Você ainda não enviou nenhuma proposta.</Text>
            </View>
          )}
        </AnimatedReveal>
      </View>
    </ScrollView>
  );
}
