import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { tradeStatusLabels, tradeStatusTones } from '@/constants/library';
import { useMyTrades, useUpdateTradeRequestStatus, type TradeRequest } from '@/hooks/useLibrary';
import { extractApiErrorMessage } from '@/utils/apiError';
import { useState } from 'react';

function TradeCard({
  trade,
  onAccept,
  onReject,
  onComplete,
  loading,
}: {
  trade: TradeRequest;
  onAccept: () => void;
  onReject: () => void;
  onComplete: () => void;
  loading: boolean;
}) {
  return (
    <View className="rounded-[28px] bg-white px-5 py-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xl font-bold text-stone-900">{trade.book_requested.title}</Text>
          <Text className="mt-1 text-sm text-stone-600">{trade.book_requested.author}</Text>
        </View>
        <Pill label={tradeStatusLabels[trade.status]} tone={tradeStatusTones[trade.status]} />
      </View>

      <View className="mt-4 rounded-2xl bg-stone-100 px-4 py-4">
        <Text className="text-sm uppercase tracking-[1px] text-stone-500">
          {trade.is_incoming ? 'Solicitado por' : 'Enviado para'}
        </Text>
        <Text className="mt-2 text-base font-semibold text-stone-900">
          {trade.is_incoming
            ? trade.requester.full_name || trade.requester.email
            : trade.owner.full_name || trade.owner.email}
        </Text>
        <Text className="mt-1 text-sm text-stone-600">
          {trade.is_incoming ? trade.requester.email : trade.owner.email}
        </Text>
      </View>

      {trade.book_offered ? (
        <View className="mt-4">
          <Text className="text-sm uppercase tracking-[1px] text-stone-500">Livro oferecido</Text>
          <Text className="mt-2 text-base font-semibold text-stone-900">{trade.book_offered.title}</Text>
          <Text className="mt-1 text-sm text-stone-600">{trade.book_offered.author}</Text>
        </View>
      ) : null}

      {trade.message ? <Text className="mt-4 text-sm leading-6 text-stone-600">{trade.message}</Text> : null}

      {trade.status === 'pending' && trade.is_incoming ? (
        <View className="mt-5 flex-row gap-3">
          <Button className="flex-1" loading={loading} onPress={onAccept}>
            Aceitar
          </Button>
          <Button variant="danger" className="flex-1" loading={loading} onPress={onReject}>
            Recusar
          </Button>
        </View>
      ) : null}

      {trade.status === 'accepted' ? (
        <Button className="mt-5" loading={loading} onPress={onComplete}>
          Marcar como concluída
        </Button>
      ) : null}
    </View>
  );
}

export default function TradesScreen() {
  const tradesQuery = useMyTrades();
  const updateTradeMutation = useUpdateTradeRequestStatus();
  const [error, setError] = useState<string | null>(null);

  const incoming = tradesQuery.data?.incoming ?? [];
  const outgoing = tradesQuery.data?.outgoing ?? [];

  async function updateStatus(id: number, status: 'accepted' | 'rejected' | 'completed') {
    setError(null);
    try {
      await updateTradeMutation.mutateAsync({ id, status });
    } catch (updateError) {
      setError(extractApiErrorMessage(updateError, 'Não foi possível atualizar a negociação.'));
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#f8f1e7]">
      <View className="px-5 pb-10 pt-5">
        <Text className="text-3xl font-bold text-stone-900">Negociações</Text>
        <Text className="mt-2 text-sm leading-6 text-stone-600">
          Acompanhe propostas enviadas e recebidas sem sair do app.
        </Text>

        {error ? <Text className="mt-4 text-sm text-red-600">{error}</Text> : null}

        <View className="mt-6">
          <Text className="text-2xl font-bold text-stone-900">Recebidas</Text>
          <Text className="mt-1 text-sm text-stone-600">Solicitações para livros do seu inventário.</Text>

          {tradesQuery.isPending ? (
            <View className="mt-4 rounded-[28px] bg-white px-5 py-6">
              <Text className="text-base text-stone-600">Carregando negociações...</Text>
            </View>
          ) : incoming.length ? (
            <View className="mt-4 gap-4">
              {incoming.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  loading={updateTradeMutation.isPending}
                  onAccept={() => void updateStatus(trade.id, 'accepted')}
                  onReject={() => void updateStatus(trade.id, 'rejected')}
                  onComplete={() => void updateStatus(trade.id, 'completed')}
                />
              ))}
            </View>
          ) : (
            <View className="mt-4 rounded-[28px] bg-white px-5 py-6">
              <Text className="text-sm leading-6 text-stone-600">Nenhuma proposta recebida por enquanto.</Text>
            </View>
          )}
        </View>

        <View className="mt-10">
          <Text className="text-2xl font-bold text-stone-900">Enviadas</Text>
          <Text className="mt-1 text-sm text-stone-600">Propostas que você abriu com outros usuários.</Text>

          {outgoing.length ? (
            <View className="mt-4 gap-4">
              {outgoing.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  loading={updateTradeMutation.isPending}
                  onAccept={() => undefined}
                  onReject={() => undefined}
                  onComplete={() => void updateStatus(trade.id, 'completed')}
                />
              ))}
            </View>
          ) : (
            <View className="mt-4 rounded-[28px] bg-white px-5 py-6">
              <Text className="text-sm leading-6 text-stone-600">Você ainda não enviou nenhuma proposta.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
