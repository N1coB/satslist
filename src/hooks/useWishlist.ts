import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';
import { WishlistItem, type WishlistPayload } from '@/types/wishlist';
import { getNotificationConsent, setNotificationConsent, loadNotifiedIds, persistNotifiedIds } from './useNotificationConsent';

// Constants
const WISHLIST_KIND = 30078;
const COMMUNITY_TAG = 'satslist-wishlist';
const STORAGE_KEY = 'satslist-deleted-items';
const FILTER_EVENT_KIND = 10078; // Replaceable Event (10000-19999)
const FILTER_EVENT_TAG = 'satslist-wishlist-deleted';
const FILTER_EVENT_D_TAG = 'deleted-wishlist-items';

// Helper functions defined outside the hook to avoid hoisting issues
const loadDeletedIds = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set<string>();
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set<string>(parsed);
  } catch {
    return new Set<string>();
  }
};

const persistDeletedIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch (error) {
    console.warn('Failed to persist deleted wishlist IDs', error);
  }
};

const formatSats = (sats: number): string => {
  if (sats >= 1000000) {
    return `${(sats / 1000000).toFixed(2)}M`;
  }
  if (sats >= 1000) {
    return `${(sats / 1000).toFixed(2)}K`;
  }
  return sats.toString();
};

const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

const parseFilterEventIds = (event: NostrEvent): string[] => {
  try {
    const idsTag = event.tags.find(([name]) => name === 'ids');
    if (!idsTag) return [];
    const ids = JSON.parse(idsTag[1]);
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
};

const sortIds = (ids: string[]): string[] => ids.slice().sort();
const areSameIdList = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index]);

export function useWishlist(options?: { logRelay?: (message: string) => void }) {
  const logRelay = useMemo(() => options?.logRelay ?? (() => {}), [options?.logRelay]);
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [lastPublishError, setLastPublishError] = useState<string | null>(null);
  const [lastPublishSuccess, setLastPublishSuccess] = useState<number | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => loadDeletedIds());
  const lastPublishedIdsRef = useRef<string[]>([]);
  const publishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notificationConsent, setNotificationPermission] = useState<NotificationPermission>(() => getNotificationConsent());
  const [notifiedItems, setNotifiedItems] = useState<Set<string>>(() => loadNotifiedIds());

  useEffect(() => {
    if (!isNotificationSupported()) return;
    const consent = getNotificationConsent();
    setNotificationPermission(consent);
  }, []);

  const addDeletedId = useCallback((itemId: string) => {
    setDeletedIds(prev => {
      const updated = new Set(prev);
      updated.add(itemId);
      persistDeletedIds(updated);
      return updated;
    });
  }, []);

  const notifyUser = useCallback((item: WishlistItem) => {
    if (!isNotificationSupported()) return;
    if (notificationConsent !== 'granted') return;
    if (notifiedItems.has(item.id)) return;
    const title = 'Dein Zielpreis ist erreicht';
    const options: NotificationOptions = {
      body: `${item.title} ist jetzt bei ${formatSats(item.targetPriceSats)} sats.`,
      icon: item.image ?? '/favicon.ico',
    };
    try {
      new Notification(title, options);
      setNotifiedItems(prev => {
        const updated = new Set(prev);
        updated.add(item.id);
        persistNotifiedIds(updated);
        return updated;
      });
    } catch (error) {
      console.warn('Notification failed', error);
    }
  }, [notificationConsent, notifiedItems]);

  useEffect(() => {
    if (!user) return;
    const filters = [
      {
        kinds: [WISHLIST_KIND],
        authors: [user.pubkey],
        '#t': [COMMUNITY_TAG],
        limit: 100,
      },
    ];

    logRelay(`REQ filters: ${JSON.stringify(filters)}`);
  }, [user, logRelay]);

  const triggerNotificationForWishlist = useCallback((items: WishlistItem[]) => {
    const ready = items.filter(item => {
      const currentPriceSats = item.currentPriceSats;
      if (!currentPriceSats) return false;
      return currentPriceSats <= item.targetPriceSats;
    });
    ready.forEach(notifyUser);
  }, [notifyUser]);

  // Simple query wrapper without rate limiting
  // Modern relays handle rate limiting on their end
  const enqueueQuery = useCallback(<T>(fn: () => Promise<T>, _log?: (message: string) => void) => {
    return fn();
  }, []);

  // Event builders and parsers
  const buildEvent = useCallback((pubkey: string, payload: WishlistPayload): Omit<NostrEvent, 'id' | 'sig'> => {
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
  }, []);

  const parseWishlistEvent = useCallback((event: NostrEvent): WishlistItem | null => {
    const itemTag = event.tags.find(([name]) => name === 'item');
    if (!itemTag) return null;

    try {
      const payload = JSON.parse(itemTag[1]);
      const id = payload.id ?? event.id;

      // Skip deleted events during parsing
      if (deletedIds.has(id)) {
        return null;
      }

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
  }, [deletedIds]);

  // Load filter event first to get deleted IDs before loading wishlist
  const filterEventQuery = useQuery({
    queryKey: ['wishlist-filter-event', user?.pubkey],
    enabled: Boolean(user),
    queryFn: async ({ signal }) => {
      if (!user) return [];
      const filters = [{ kinds: [FILTER_EVENT_KIND], authors: [user.pubkey], '#d': [FILTER_EVENT_D_TAG], limit: 1 }];
      return enqueueQuery(() => nostr.query(filters, { signal }), logRelay);
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const queryResult = useQuery({
    queryKey: ['wishlist', user?.pubkey],
    enabled: Boolean(user),
    queryFn: async ({ signal }) => {
      if (!user) return [];

      const keys = [
        {
          kinds: [WISHLIST_KIND],
          authors: [user.pubkey],
          '#t': [COMMUNITY_TAG],
          limit: 100,
        },
      ];

      const events = await enqueueQuery(() => nostr.query(keys, { signal }), logRelay);
      const map = events.reduce<Map<string, WishlistItem>>((acc, event) => {
        const parsed = parseWishlistEvent(event);
        if (parsed) acc.set(parsed.id, parsed);
        return acc;
      }, new Map());

      const result = Array.from(map.values()).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      triggerNotificationForWishlist(result);
      return result;
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
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLastPublishError(message);
      logRelay(`Publish failed: ${message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error('Not logged in');

      // Find the item to get its eventId from current query data
      const currentWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist', user.pubkey]) ?? [];
      const item = currentWishlist.find(i => i.id === itemId);

      // NIP-09 Delete Event
      const deleteEvent = {
        kind: 5,
        content: 'Item removed from wishlist',
        tags: [
          ['a', `${WISHLIST_KIND}:${user.pubkey}:${itemId}`],
          ['k', String(WISHLIST_KIND)],
          ...(item?.eventId ? [['e', item.eventId]] : []), // Include event ID if available
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: user.pubkey,
      };
      const signed = await user.signer.signEvent(deleteEvent as NostrEvent);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });

      // Filter Event will be published automatically via useEffect
      return { itemId, event: signed };
    },
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist', user?.pubkey] });
      addDeletedId(itemId);
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist', user?.pubkey]);
      if (previousWishlist) {
        const updated = previousWishlist.filter(item => item.id !== itemId);
        queryClient.setQueryData(['wishlist', user?.pubkey], updated);
      }
      return { previousWishlist };
    },
    onSuccess: () => {
      logRelay('Delete succeeded');
      // No refetch needed - optimistic update handles UI
      // Filter event will sync to other devices
    },
    onError: (error, itemId, context) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logRelay(`Delete failed: ${message}`);
      setDeletedIds(prev => {
        const updated = new Set(prev);
        updated.delete(itemId);
        persistDeletedIds(updated);
        return updated;
      });
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist', user?.pubkey], context.previousWishlist);
      }
    },
  });

  const filterEventMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error('Not logged in');

      const eventDraft = {
        kind: FILTER_EVENT_KIND,
        content: '',
        tags: [
          ['d', FILTER_EVENT_D_TAG],
          ['t', FILTER_EVENT_TAG],
          ['ids', JSON.stringify(ids)],
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: user.pubkey,
      };

      const signed = await user.signer.signEvent(eventDraft as NostrEvent);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });
      return signed;
    },
    onSuccess: (_data) => {
      logRelay('Filter event published successfully');
      lastPublishedIdsRef.current = sortIds(Array.from(deletedIds));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logRelay(`Filter event publish failed: ${message}`);
    },
  });

  const latestFilterEvent = filterEventQuery.data?.[0];

  // Smart Merge: Combine relay data with local data
  useEffect(() => {
    if (!latestFilterEvent) return;

    const relayIds = parseFilterEventIds(latestFilterEvent);
    const localIds = Array.from(loadDeletedIds());

    // Merge: Relay is source of truth, but keep local IDs until synced
    const merged = new Set([...relayIds, ...localIds]);

    lastPublishedIdsRef.current = sortIds(relayIds);
    setDeletedIds(merged);

    // Sync localStorage with relay data (source of truth)
    persistDeletedIds(merged);
  }, [latestFilterEvent]);

  useEffect(() => {
    if (!user) return;
    const ids = sortIds(Array.from(deletedIds));
    if (areSameIdList(ids, lastPublishedIdsRef.current)) return;
    if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
    publishTimerRef.current = setTimeout(() => filterEventMutation.mutate(ids), 2000);
    return () => {
      if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
    };
  }, [deletedIds, filterEventMutation, user]);

  const rawWishlist: WishlistItem[] = useMemo(() => queryResult.data ?? [], [queryResult.data]);
  const wishlist: WishlistItem[] = useMemo(
    () => rawWishlist.filter(item => !deletedIds.has(item.id)),
    [deletedIds, rawWishlist]
  );

  const stats = useMemo(() => {
    const totalTarget = wishlist.reduce((sum, item) => sum + item.targetPriceSats, 0);
    const readyCount = wishlist.filter((item) => (item.currentPriceSats ?? Infinity) <= item.targetPriceSats).length;
    return { count: wishlist.length, readyCount, totalTarget };
  }, [wishlist]);

  return {
    ...queryResult,
    wishlist,
    stats,
    addItem: mutationResult.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    publishStatus: { status: mutationResult.status, error: lastPublishError, lastSuccessAt: lastPublishSuccess },
    deleteStatus: { status: deleteMutation.status, error: deleteMutation.error },
    refetch: queryResult.refetch,
    clearDeletedItems: () => {
      localStorage.removeItem(STORAGE_KEY);
      setDeletedIds(new Set());
    },
    requestNotificationPermission: () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        setNotificationConsent(permission);
      });
    },
    notificationConsent,
  };
}