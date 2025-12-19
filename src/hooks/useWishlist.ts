import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';
import { WishlistItem, type WishlistPayload } from '@/types/wishlist';
import { getNotificationConsent, setNotificationConsent, loadNotifiedIds, persistNotifiedIds } from './useNotificationConsent';

const WISHLIST_KIND = 30078;
const COMMUNITY_TAG = 'satslist-wishlist';
const RATE_LIMIT_DELAY = 2000;
const STORAGE_KEY = 'satslist-deleted-items';
const CLEANUP_THRESHOLD = 200;
const CLEANUP_TARGET = 100;
const FILTER_EVENT_KIND = 17779;
const FILTER_EVENT_TAG = 'satslist-wishlist-deleted';
const FILTER_EVENT_D_TAG = 'deleted-list';

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

const sortIds = (ids: string[]): string[] => ids.slice().sort();
const areSameIdList = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index]);

const buildEvent = (pubkey: string, payload: WishlistPayload): Omit<NostrEvent, 'id' | 'sig'> => {
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

// rest unchanged ...