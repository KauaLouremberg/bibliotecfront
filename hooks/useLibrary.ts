import { useInfiniteQuery, useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { api } from '@/services/api';
import { mutationRetryDelay, shouldRetryServerMutation } from '@/utils/mutationRetry';

export type SharingStatus = 'private' | 'showcase' | 'loan' | 'exchange' | 'donation';
export type PostIntent = 'need' | 'donation' | 'exchange' | 'loan' | 'offer';
export type DiscoverTradeStatus = 'loan' | 'exchange' | 'donation';
export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export type OwnerSummary = {
  id: number;
  full_name: string;
  email: string;
};

export type InventoryBook = {
  id: number;
  title: string;
  author: string;
  description: string;
  genre: string;
  published_year: number | null;
  publisher: string;
  isbn: string;
  page_count: number | null;
  cover_url: string;
  has_physical_copy: boolean;
  sharing_status: SharingStatus;
  location_label: string;
  owner: OwnerSummary;
  is_owner: boolean;
  matches_waiting: number;
  average_rating: number;
  rating_count: number;
  my_rating: number | null;
  created_at: string;
  updated_at: string;
};

export type InventoryStats = {
  total_books: number;
  public_books: number;
  donation_books: number;
  demand_matches: number;
};

export type InventoryCollection = {
  items: InventoryBook[];
  stats: InventoryStats;
};

export type CatalogBook = {
  id: string;
  title: string;
  author: string;
  description: string;
  genre: string;
  cover_url: string;
  published_year: number | null;
  publisher: string;
  isbn: string;
  page_count: number | null;
};

export type CatalogCollection = {
  items: CatalogBook[];
  genres: string[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
};

export const CATALOG_PAGE_SIZE = 24;

export type InventoryBookPreview = {
  id: number;
  title: string;
  author: string;
  cover_url: string;
  has_physical_copy: boolean;
  sharing_status: SharingStatus;
};

export type SocialPost = {
  id: number;
  intent: PostIntent;
  book_title: string;
  book_author: string;
  caption: string;
  location_label: string;
  owner: OwnerSummary;
  is_owner: boolean;
  inventory_book: InventoryBookPreview | null;
  created_at: string;
  updated_at: string;
};

export type FeedStats = {
  need_posts: number;
  donation_posts: number;
  exchange_posts: number;
  loan_posts: number;
};

export type FeedCollection = {
  items: SocialPost[];
  stats: FeedStats;
};

export type TradeRequest = {
  id: number;
  status: TradeStatus;
  message: string;
  requester: OwnerSummary;
  owner: OwnerSummary;
  book_requested: InventoryBookPreview;
  book_offered: InventoryBookPreview | null;
  is_incoming: boolean;
  created_at: string;
  updated_at: string;
};

export type TradeRequestCollection = {
  incoming: TradeRequest[];
  outgoing: TradeRequest[];
};

export type InventoryBookPayload = {
  title: string;
  author: string;
  description: string;
  genre: string;
  published_year: string;
  publisher: string;
  isbn: string;
  page_count: string;
  cover_url: string;
  has_physical_copy: boolean;
  sharing_status: SharingStatus;
  location_label: string;
  cover?: UploadFileLike | null;
  remove_cover?: boolean;
};

export type SocialPostPayload = {
  intent: PostIntent;
  book_title: string;
  book_author: string;
  caption: string;
  location_label: string;
  inventory_book_id: number | null;
};

export type SignalFeedFilters = {
  search?: string;
  author?: string;
  bookTitle?: string;
  intent?: PostIntent | null;
};

export type TradeRequestPayload = {
  book_requested_id: number;
  book_offered_id: number | null;
  message: string;
};

export type UploadFileLike = {
  uri: string;
  name: string;
  type: string;
};

const libraryQueryKey = ['library'] as const;

const feedQueryKey = [...libraryQueryKey, 'feed'] as const;
const feedMineQueryKey = [...libraryQueryKey, 'feed', 'mine'] as const;

function feedStatsFromItems(items: SocialPost[]): FeedStats {
  return {
    need_posts: items.filter((item) => item.intent === 'need').length,
    donation_posts: items.filter((item) => item.intent === 'donation').length,
    exchange_posts: items.filter((item) => item.intent === 'exchange').length,
    loan_posts: items.filter((item) => item.intent === 'loan').length,
  };
}

function upsertFeedPostInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  post: SocialPost,
) {
  queryClient.setQueriesData<FeedCollection>({ queryKey: feedQueryKey }, (current) => {
    if (!current) return current;
    const index = current.items.findIndex((item) => item.id === post.id);
    const items =
      index >= 0
        ? current.items.map((item) => (item.id === post.id ? post : item))
        : [post, ...current.items];
    return { items, stats: feedStatsFromItems(items) };
  });
}

function upsertFeedMinePostInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  post: SocialPost,
) {
  queryClient.setQueriesData<FeedCollection>({ queryKey: feedMineQueryKey }, (current) => {
    if (!current) return current;
    const index = current.items.findIndex((item) => item.id === post.id);
    const items =
      index >= 0
        ? current.items.map((item) => (item.id === post.id ? post : item))
        : [post, ...current.items];
    return { items, stats: feedStatsFromItems(items) };
  });
}

function removeFeedPostFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  postId: number,
) {
  queryClient.setQueriesData<FeedCollection>({ queryKey: feedQueryKey }, (current) => {
    if (!current) return current;
    const items = current.items.filter((item) => item.id !== postId);
    return { items, stats: feedStatsFromItems(items) };
  });
}

function removeFeedMinePostFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  postId: number,
) {
  queryClient.setQueriesData<FeedCollection>({ queryKey: feedMineQueryKey }, (current) => {
    if (!current) return current;
    const items = current.items.filter((item) => item.id !== postId);
    return { items, stats: feedStatsFromItems(items) };
  });
}

function mySignalDetailKey(postId: number) {
  return [...feedMineQueryKey, 'detail', postId] as const;
}

function isFeedListQuery(query: { queryKey: readonly unknown[] }) {
  return !query.queryKey.includes('detail');
}

function assertSocialPost(data: unknown): SocialPost {
  if (!data || typeof data !== 'object') {
    throw new Error('Resposta inválida ao salvar o sinal.');
  }
  const post = data as SocialPost;
  if (typeof post.id !== 'number' || !post.intent || !post.book_title) {
    throw new Error('Resposta inválida ao salvar o sinal.');
  }
  return post;
}

function syncSocialPostCaches(queryClient: ReturnType<typeof useQueryClient>, post: SocialPost) {
  if (!post?.id) return;

  queryClient.setQueryData(mySignalDetailKey(post.id), post);

  if (post.is_owner) {
    upsertFeedMinePostInCache(queryClient, post);
    removeFeedPostFromCache(queryClient, post.id);
    return;
  }

  upsertFeedPostInCache(queryClient, post);
}

async function invalidateFeedListQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({
    queryKey: feedQueryKey,
    predicate: isFeedListQuery,
  });
  await queryClient.invalidateQueries({
    queryKey: feedMineQueryKey,
    predicate: isFeedListQuery,
  });
}

const tradesQueryKey = [...libraryQueryKey, 'trades', 'mine'] as const;

function upsertTradeInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  trade: TradeRequest,
) {
  queryClient.setQueryData<TradeRequestCollection>(tradesQueryKey, (current) => {
    const incoming = current?.incoming ?? [];
    const outgoing = current?.outgoing ?? [];

    if (trade.is_incoming) {
      const nextIncoming = incoming.some((item) => item.id === trade.id)
        ? incoming.map((item) => (item.id === trade.id ? trade : item))
        : [trade, ...incoming];
      return {
        incoming: nextIncoming,
        outgoing: outgoing.map((item) => (item.id === trade.id ? trade : item)),
      };
    }

    const nextOutgoing = outgoing.some((item) => item.id === trade.id)
      ? outgoing.map((item) => (item.id === trade.id ? trade : item))
      : [trade, ...outgoing];
    return {
      incoming: incoming.map((item) => (item.id === trade.id ? trade : item)),
      outgoing: nextOutgoing,
    };
  });
}

async function refreshTrades(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: tradesQueryKey });
}

const inventoryMineKey = [...libraryQueryKey, 'inventory', 'mine'] as const;
const inventoryDiscoverKey = [...libraryQueryKey, 'inventory', 'discover'] as const;
const catalogKey = [...libraryQueryKey, 'catalog'] as const;
const catalogInfiniteKey = [...libraryQueryKey, 'catalog-infinite'] as const;

async function invalidateInventoryQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: inventoryMineKey });
  await queryClient.invalidateQueries({ queryKey: inventoryDiscoverKey });
}

async function invalidateCatalogQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: catalogKey });
  await queryClient.invalidateQueries({ queryKey: catalogInfiniteKey });
}

async function invalidateTradeAndDiscoverQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: tradesQueryKey });
  await queryClient.invalidateQueries({ queryKey: inventoryDiscoverKey });
}

function feedFilterQueryKey(filters?: SignalFeedFilters) {
  return [
    filters?.search?.trim() ?? '',
    filters?.author?.trim() ?? '',
    filters?.bookTitle?.trim() ?? '',
    filters?.intent ?? '',
  ] as const;
}

function feedFilterParams(filters?: SignalFeedFilters) {
  const search = filters?.search?.trim() ?? '';
  const author = filters?.author?.trim() ?? '';
  const bookTitle = filters?.bookTitle?.trim() ?? '';
  return {
    search,
    author,
    book_title: bookTitle,
    intent: filters?.intent ?? undefined,
  };
}

export function useMyInventory() {
  return useQuery({
    queryKey: [...libraryQueryKey, 'inventory', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<InventoryCollection>('/api/library/inventory/mine');
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCatalogBooks(filters?: { search?: string; genre?: string }) {
  return useQuery({
    queryKey: [...libraryQueryKey, 'catalog', filters?.search ?? '', filters?.genre ?? ''],
    queryFn: async () => {
      const { data } = await api.get<CatalogCollection>('/api/library/catalog', {
        params: {
          search: filters?.search ?? '',
          genre: filters?.genre ?? '',
          page: 1,
          limit: CATALOG_PAGE_SIZE,
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useInfiniteCatalogBooks(filters?: { search?: string; genre?: string }) {
  return useInfiniteQuery({
    queryKey: [...libraryQueryKey, 'catalog-infinite', filters?.search ?? '', filters?.genre ?? ''],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<CatalogCollection>('/api/library/catalog', {
        params: {
          search: filters?.search ?? '',
          genre: filters?.genre ?? '',
          page: pageParam,
          limit: CATALOG_PAGE_SIZE,
        },
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
  });
}

export function useDiscoverInventory(filters?: { search?: string; trade_status?: DiscoverTradeStatus | null; genre?: string }) {
  return useQuery({
    queryKey: [
      ...libraryQueryKey,
      'inventory',
      'discover',
      filters?.search ?? '',
      filters?.trade_status ?? 'all',
      filters?.genre ?? '',
    ],
    queryFn: async () => {
      const { data } = await api.get<InventoryCollection>('/api/library/inventory/discover', {
        params: {
          search: filters?.search ?? '',
          trade_status: filters?.trade_status ?? undefined,
          genre: filters?.genre ?? '',
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function inventoryJsonBody(body: InventoryBookPayload) {
  return {
    title: body.title,
    author: body.author,
    description: body.description,
    genre: body.genre,
    published_year: parseOptionalInt(body.published_year),
    publisher: body.publisher,
    isbn: body.isbn,
    page_count: parseOptionalInt(body.page_count),
    cover_url: body.cover_url,
    has_physical_copy: body.has_physical_copy,
    sharing_status: body.sharing_status,
    location_label: body.location_label,
  };
}

async function uploadInventoryCover(
  bookId: number,
  cover: UploadFileLike | null | undefined,
  removeCover: boolean | undefined,
) {
  if (!cover && !removeCover) return;

  const formData = new FormData();
  if (removeCover) {
    formData.append('remove_cover', 'true');
  }
  if (cover) {
    formData.append('cover_image', {
      uri: cover.uri,
      name: cover.name,
      type: cover.type,
    } as never);
  }
  await api.patch(`/api/library/inventory/${bookId}/cover`, formData);
}

export function useUpsertInventoryBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InventoryBookPayload & { id?: number }) => {
      const { id, cover, remove_cover, ...body } = payload;
      const jsonBody = inventoryJsonBody(body);

      if (id) {
        const { data } = await api.patch<InventoryBook>(`/api/library/inventory/${id}`, jsonBody);
        if (cover || remove_cover) {
          await uploadInventoryCover(id, cover, remove_cover);
          const { data: refreshed } = await api.get<InventoryCollection>('/api/library/inventory/mine');
          const updated = refreshed.items.find((item) => item.id === id);
          return updated ?? data;
        }
        return data;
      }

      const { data } = await api.post<InventoryBook>('/api/library/inventory', jsonBody);
      if (cover) {
        await uploadInventoryCover(data.id, cover, false);
        const { data: refreshed } = await api.get<InventoryCollection>('/api/library/inventory/mine');
        const created = refreshed.items.find((item) => item.id === data.id);
        return created ?? data;
      }
      return data;
    },
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient);
      await invalidateCatalogQueries(queryClient);
      await invalidateTradeAndDiscoverQueries(queryClient);
      await invalidateFeedListQueries(queryClient);
    },
  });
}

export function useRateInventoryBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { bookId: number; rating: number }) => {
      const { data } = await api.put<InventoryBook>(`/api/library/inventory/${payload.bookId}/rating`, {
        rating: payload.rating,
      });
      return data;
    },
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: inventoryDiscoverKey });
    },
  });
}

export function useDeleteInventoryBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: number) => {
      await api.delete(`/api/library/inventory/${bookId}`);
    },
    onSuccess: async () => {
      await invalidateInventoryQueries(queryClient);
      await invalidateCatalogQueries(queryClient);
      await invalidateTradeAndDiscoverQueries(queryClient);
      await invalidateFeedListQueries(queryClient);
    },
  });
}

export function useCommunityFeed(filters?: SignalFeedFilters) {
  const filterKey = feedFilterQueryKey(filters);

  return useQuery({
    queryKey: [...feedQueryKey, ...filterKey],
    queryFn: async () => {
      const { data } = await api.get<FeedCollection>('/api/library/feed', {
        params: feedFilterParams(filters),
      });
      return data;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useMySignalsFeed(filters?: SignalFeedFilters) {
  const filterKey = feedFilterQueryKey(filters);

  return useQuery({
    queryKey: [...feedMineQueryKey, ...filterKey],
    queryFn: async () => {
      const { data } = await api.get<FeedCollection>('/api/library/feed/mine', {
        params: feedFilterParams(filters),
      });
      return data;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export function useMySignal(postId?: number) {
  return useQuery({
    queryKey: [...feedMineQueryKey, 'detail', postId],
    queryFn: async () => {
      const { data } = await api.get<SocialPost>(`/api/library/feed/mine/${postId}`);
      return assertSocialPost(data);
    },
    enabled: !!postId,
    retry: (failureCount, error) => shouldRetryServerMutation(failureCount, error),
    retryDelay: mutationRetryDelay,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
}

export function useMyTrades() {
  return useQuery({
    queryKey: tradesQueryKey,
    queryFn: async () => {
      const { data } = await api.get<TradeRequestCollection>('/api/library/trades/mine');
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateTradeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TradeRequestPayload) => {
      const { data } = await api.post<TradeRequest>('/api/library/trades', payload);
      return data;
    },
    onSuccess: async (trade) => {
      upsertTradeInCache(queryClient, trade);
      await refreshTrades(queryClient);
      await queryClient.invalidateQueries({ queryKey: inventoryDiscoverKey });
      await invalidateFeedListQueries(queryClient);
    },
  });
}

export function useUpdateTradeRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: number; status: Exclude<TradeStatus, 'pending'> }) => {
      const { data } = await api.patch<TradeRequest>(`/api/library/trades/${payload.id}/status`, {
        status: payload.status,
      });
      return data;
    },
    retry: (failureCount, error) => shouldRetryServerMutation(failureCount, error),
    retryDelay: mutationRetryDelay,
    onSuccess: async (trade) => {
      upsertTradeInCache(queryClient, trade);
      await refreshTrades(queryClient);
      await queryClient.invalidateQueries({ queryKey: inventoryDiscoverKey });
      await invalidateFeedListQueries(queryClient);
    },
  });
}

export function useUpsertSocialPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SocialPostPayload & { id?: number }) => {
      const { id, ...body } = payload;
      const response = id
        ? await api.patch<SocialPost>(`/api/library/feed/${id}`, body)
        : await api.post<SocialPost>('/api/library/feed', body);
      return assertSocialPost(response.data);
    },
    retry: (failureCount, error) => shouldRetryServerMutation(failureCount, error),
    retryDelay: mutationRetryDelay,
    onSuccess: (post) => {
      try {
        syncSocialPostCaches(queryClient, post);
      } catch {
        // Falha de cache não deve invalidar uma resposta 200 do servidor.
      }
    },
    onSettled: () => {
      void invalidateFeedListQueries(queryClient);
    },
  });
}

export function useDeleteSocialPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      await api.delete(`/api/library/feed/${postId}`);
      return postId;
    },
    retry: (failureCount, error) => shouldRetryServerMutation(failureCount, error),
    retryDelay: mutationRetryDelay,
    onSuccess: (postId) => {
      try {
        removeFeedPostFromCache(queryClient, postId);
        removeFeedMinePostFromCache(queryClient, postId);
        queryClient.removeQueries({ queryKey: mySignalDetailKey(postId) });
      } catch {
        // Falha de cache não deve invalidar uma resposta 200 do servidor.
      }
    },
    onSettled: () => {
      void invalidateFeedListQueries(queryClient);
    },
  });
}
