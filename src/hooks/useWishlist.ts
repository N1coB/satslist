import { useNostr } from '@nostrify/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';
import { WishlistItem, type WishlistPayload } from '@/types/wishlist';

const WISHLIST_KIND = 30078;

type UnsignedWishlistEvent = Omit<NostrEvent, 'id' | 'sig'>;

const buildEvent = (pubkey: string, payload: WishlistPayload): UnsignedWishlistEvent => {
  const tags: [string, string][] = [
    ['d', 'satslist-wishlist'],
    ['item', JSON.stringify({
      id: payload.id ?? crypto.randomUUID(),
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
    return {
      id: payload.id,
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

export function useWishlist() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  const queryResult = useQuery({
    queryKey: ['wishlist', user?.pubkey],
    enabled: Boolean(user),
    queryFn: async ({ signal }) => {
      if (!user) return [];

      const events = await nostr.query([
        {
          kinds: [WISHLIST_KIND],
          authors: [user.pubkey],
          '#d': ['satslist-wishlist'],
          limit: 100,
        },
      ], { signal });

      return events.reduce<WishlistItem[]>((acc, event) => {
        const parsed = parseWishlistEvent(event);
        if (parsed) acc.push(parsed);
        return acc;
      }, []);
    },
    staleTime: 1000 * 60 * 5,
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
      queryResult.refetch();
    },
  });

  const wishlist: WishlistItem[] = queryResult.data ?? [];

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
  };
}
