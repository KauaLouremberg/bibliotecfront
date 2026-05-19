import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/services/api';

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
  cover_url: string;
  has_physical_copy: boolean;
  sharing_status: SharingStatus;
  location_label: string;
  owner: OwnerSummary;
  is_owner: boolean;
  matches_waiting: number;
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

export type InventoryBookPreview = {
  id: number;
  title: string;
  author: string;
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

function invalidateLibrary(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: libraryQueryKey });
}

function appendIfPresent(formData: FormData, key: string, value: string | boolean | number | null | undefined) {
  if (value === null || value === undefined) {
    return;
  }
  formData.append(key, String(value));
}

export function useMyInventory() {
  return useQuery({
    queryKey: [...libraryQueryKey, 'inventory', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<InventoryCollection>('/api/library/inventory/mine');
      return data;
    },
  });
}

export function useDiscoverInventory(filters?: { search?: string; trade_status?: DiscoverTradeStatus | null }) {
  return useQuery({
    queryKey: [...libraryQueryKey, 'inventory', 'discover', filters?.search ?? '', filters?.trade_status ?? 'all'],
    queryFn: async () => {
      const { data } = await api.get<InventoryCollection>('/api/library/inventory/discover', {
        params: {
          search: filters?.search ?? '',
          trade_status: filters?.trade_status ?? undefined,
        },
      });
      return data;
    },
  });
}

export function useUpsertInventoryBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InventoryBookPayload & { id?: number }) => {
      const { id, cover, remove_cover, ...body } = payload;
      const formData = new FormData();
      appendIfPresent(formData, 'title', body.title);
      appendIfPresent(formData, 'author', body.author);
      appendIfPresent(formData, 'description', body.description);
      appendIfPresent(formData, 'location_label', body.location_label);
      appendIfPresent(formData, 'has_physical_copy', body.has_physical_copy);
      appendIfPresent(formData, 'sharing_status', body.sharing_status);
      if (remove_cover) {
        appendIfPresent(formData, 'remove_cover', true);
      }
      if (cover) {
        formData.append('cover_image', {
          uri: cover.uri,
          name: cover.name,
          type: cover.type,
        } as never);
      }
      if (id) {
        const { data } = await api.patch<InventoryBook>(`/api/library/inventory/${id}`, formData);
        return data;
      }
      const { data } = await api.post<InventoryBook>('/api/library/inventory', formData);
      return data;
    },
    onSuccess: async () => {
      await invalidateLibrary(queryClient);
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
      await invalidateLibrary(queryClient);
    },
  });
}

export function useCommunityFeed() {
  return useQuery({
    queryKey: [...libraryQueryKey, 'feed'],
    queryFn: async () => {
      const { data } = await api.get<FeedCollection>('/api/library/feed');
      return data;
    },
  });
}

export function useMyTrades() {
  return useQuery({
    queryKey: [...libraryQueryKey, 'trades', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<TradeRequestCollection>('/api/library/trades/mine');
      return data;
    },
  });
}

export function useCreateTradeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TradeRequestPayload) => {
      const { data } = await api.post<TradeRequest>('/api/library/trades', payload);
      return data;
    },
    onSuccess: async () => {
      await invalidateLibrary(queryClient);
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
    onSuccess: async () => {
      await invalidateLibrary(queryClient);
    },
  });
}

export function useUpsertSocialPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SocialPostPayload & { id?: number }) => {
      const { id, ...body } = payload;
      if (id) {
        const { data } = await api.patch<SocialPost>(`/api/library/feed/${id}`, body);
        return data;
      }
      const { data } = await api.post<SocialPost>('/api/library/feed', body);
      return data;
    },
    onSuccess: async () => {
      await invalidateLibrary(queryClient);
    },
  });
}

export function useDeleteSocialPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      await api.delete(`/api/library/feed/${postId}`);
    },
    onSuccess: async () => {
      await invalidateLibrary(queryClient);
    },
  });
}
