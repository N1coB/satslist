import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';
import { WishlistItem, type WishlistPayload } from '@/types/wishlist';

const WISHLIST_KIND = 30078;
const COMMUNITY_TAG = 'satslist-wishlist';
const RATE_LIMIT_DELAY = 2000;

let queryQueue: Promise<unknown> = Promise.resolve();
let lastQueryTime = 0;

async function enqueueQuery<T>(fn: () => Promise<T>, log?: (message: string) => void) {
  queryQueue = queryQueue.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, RATE_LIMIT_DELAY - (now - lastQueryTime));
    if (wait > 0) {
      log?.(`Throttling query for ${wait}ms`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastQueryTime = Date.now();
    return fn();
  });

  return queryQueue as Promise<T>;
}

type UnsignedWishlistEvent = Omit<NostrEvent, 'id' | 'sig'>;

interface UseWishlistOptions {
  logRelay?: (message: string) => void;
}

const noOpLog = () => {};

const buildEvent = (pubkey: string, payload: WishlistPayload): UnsignedWishlistEvent => {
  const itemId = payload.id ?? crypto.randomUUID();
  const tags: [string, string][] = [
    ['d', itemId],
    ['t', COMMUNITY_TAG],
    ['item', JSON.stringify({
      id: itemId,
      title: payload.title,
      link: payload.link ?? null,
      image: payload.image ?? null,
      notes: payload.notes ?? null,
      targetPriceSats: payload.targetPriceSats,
      targetPriceEUR: payload.targetPriceEUR ?? null,
      sourcePriceEUR: payload.sourcePriceEUR ?? null,
      source: payload.source ?? null,
    })],
  ];

  return {
    kind: WISHLIST_KIND,
    content: '',
    tags,
    created_at: Math.floor(Date.now() / 1000),
    pubkey,
  };
};

const parseWishlistEvent = (event: NostrEvent): WishlistItem | null => {
  const itemTag = event.tags.find(([name]) => name === 'item');
  if (!itemTag) return null;

  try {
    const payload = JSON.parse(itemTag[1]);
    const id = payload.id ?? event.id;

    return {
      id,
      title: payload.title,
      link: payload.link ?? undefined,
      image: payload.image ?? undefined,
      notes: payload.notes ?? undefined,
      targetPriceSats: payload.targetPriceSats,
      targetPriceEUR: payload.targetPriceEUR ?? undefined,
      currentPriceSats: payload.currentPriceSats ?? undefined,
      sourcePriceEUR: payload.sourcePriceEUR ?? undefined,
      source: payload.source ?? undefined,
      status: payload.status ?? 'dreaming',
      createdAt: event.created_at ?? Math.floor(Date.now() / 1000),
      eventId: event.id,
    };
  } catch (error) {
    console.warn('Failed to parse wishlist event', event, error);
    return null;
  }
};

export function useWishlist(options?: UseWishlistOptions) {
  const logRelay = options?.logRelay ?? noOpLog;
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [lastPublishError, setLastPublishError] = useState<string | null>(null);
  const [lastPublishSuccess, setLastPublishSuccess] = useState<number | null>(null);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);

  const queryResult = useQuery({
    queryKey: ['wishlist', user?.pubkey],
    enabled: Boolean(user),
    queryFn: async ({ signal }) => {
      if (!user) return [];

      const filters = [
        {
          kinds: [WISHLIST_KIND],
          authors: [user.pubkey],
          '#t': [COMMUNITY_TAG],
          limit: 100,
        },
      ];

      logRelay(`REQ filters: ${JSON.stringify(filters)}`);

      try {
        const events = await enqueueQuery(() => nostr.query(filters, { signal }), logRelay);
        logRelay(`Queried ${events.length} events`);
        setRateLimitWarning(null);

        const map = events.reduce<Map<string, WishlistItem>>((acc, event) => {
          const parsed = parseWishlistEvent(event);
          if (parsed) {
            acc.set(parsed.id, parsed);
          }
          return acc;
        }, new Map());

        return Array.from(map.values()).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logRelay(`Query failed: ${message}`);
        if (message.toLowerCase().includes('rate')) {
          setRateLimitWarning('Relays melden Rate-Limits. Bitte kurz warten oder weniger Relays verwenden.');
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const mutationResult = useMutation({
    mutationFn: async (payload: WishlistPayload) => {
      if (!user) throw new Error('Not logged in');

      const eventDraft = buildEvent(user.pubkey, payload);
      const signed = await user.signer.signEvent(eventDraft as NostrEvent);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });
      return signed;
    },
    onSuccess: () => {
      setLastPublishError(null);
      setLastPublishSuccess(Date.now());
      logRelay('Publish succeeded');
      queryResult.refetch();
    },
    onError: (error) => {
      console.error('Wishlist publish failed', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLastPublishError(message);
      logRelay(`Publish failed: ${message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error('Not logged in');

      // Create a deletion event with kind 5 (Event Deletion)
      const deleteEvent = {
        kind: 5,
        content: 'Deleted wishlist item',
        tags: [
          ['a', `${WISHLIST_KIND}:${user.pubkey}:${itemId}`],
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: user.pubkey,
      };

      const signed = await user.signer.signEvent(deleteEvent as NostrEvent);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });
      return { itemId, event: signed };
    },
    onMutate: async (itemId: string) => {
      // Cancel outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ['wishlist', user?.pubkey] });

      // Snapshot the previous value
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist', user?.pubkey]);

      // Optimistically remove the item
      if (previousWishlist) {
        const updated = previousWishlist.filter(item => item.id !== itemId);
        queryClient.setQueryData(['wishlist', user?.pubkey], updated);
      }

      return { previousWishlist };
    },
    onSuccess: () => {
      logRelay('Delete succeeded');
      // Refetch to ensure consistency with relays
      setTimeout(() => queryResult.refetch(), 1000);
    },
    onError: (error, _itemId, context) => {
      console.error('Wishlist delete failed', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      logRelay(`Delete failed: ${message}`);

      // Rollback on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist', user?.pubkey], context.previousWishlist);
      }
    },
  });

  const wishlist: WishlistItem[] = useMemo(() => queryResult.data ?? [], [queryResult.data]);

  const stats = useMemo(() => {
    const totalTarget = wishlist.reduce((sum, item) => sum + item.targetPriceSats, 0);
    const readyCount = wishlist.filter((item) => (item.currentPriceSats ?? Infinity) <= item.targetPriceSats).length;

    return {
      count: wishlist.length,
      readyCount,
      totalTarget,
    };
  }, [wishlist]);

  return {
    ...queryResult,
    wishlist,
    stats,
    addItem: mutationResult.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    publishStatus: {
      status: mutationResult.status,
      error: lastPublishError,
      lastSuccessAt: lastPublishSuccess,
    },
    rateLimitWarning,
    refetch: queryResult.refetch,
  };
}
