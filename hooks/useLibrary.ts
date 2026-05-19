import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/services/api';

export type SharingStatus = 'private' | 'showcase' | 'loan' | 'exchange' | 'donation';
export type PostIntent = 'need' | 'donation' | 'exchange' | 'loan' | 'offer';

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

export type InventoryBookPayload = {
  title: string;
  author: string;
  description: string;
  cover_url: string;
  has_physical_copy: boolean;
  sharing_status: SharingStatus;
  location_label: string;
};

export type SocialPostPayload = {
  intent: PostIntent;
  book_title: string;
  book_author: string;
  caption: string;
  location_label: string;
  inventory_book_id: number | null;
};

const libraryQueryKey = ['library'] as const;

function invalidateLibrary(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: libraryQueryKey });
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

export function useDiscoverInventory() {
  return useQuery({
    queryKey: [...libraryQueryKey, 'inventory', 'discover'],
    queryFn: async () => {
      const { data } = await api.get<InventoryCollection>('/api/library/inventory/discover');
      return data;
    },
  });
}

export function useUpsertInventoryBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InventoryBookPayload & { id?: number }) => {
      const { id, ...body } = payload;
      if (id) {
        const { data } = await api.patch<InventoryBook>(`/api/library/inventory/${id}`, body);
        return data;
      }
      const { data } = await api.post<InventoryBook>('/api/library/inventory', body);
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
