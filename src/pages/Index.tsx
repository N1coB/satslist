import { useMemo, useState, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Plus, SlidersHorizontal, Zap, RefreshCcw } from 'lucide-react';

import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useWishlist } from '@/hooks/useWishlist';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';
import { useAppContext } from '@/hooks/useAppContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { WishlistCard } from '@/components/wishlist/WishlistCard';
import { WishlistStats } from '@/components/wishlist/WishlistStats';
import { AddProductDialog } from '@/components/wishlist/AddProductDialog';
import { ProductImportDialog } from '@/components/wishlist/ProductImportDialog';
import { NostrSettingsDialog } from '@/components/NostrSettingsDialog';
import type { WishlistPayload } from '@/types/wishlist';

const Index = () => {
  useSeoMeta({
    title: 'SatsList – Deine Bitcoin Wunschliste',
    description: 'Verwalte deine Wunschliste mit Bitcoin. Setze Zielpreise in Sats, verfolge deinen Fortschritt und erhalte Alerts wenn der Preis stimmt.',
  });

  const { config } = useAppContext();
  const [relayLog, setRelayLog] = useState<string[]>([]);
  const logRelay = useCallback((message: string) => {
    setRelayLog((prev) => [message, ...prev].slice(0, 15));
  }, []);

  const { user } = useCurrentUser();
  const {
    wishlist,
    stats,
    addItem,
    isLoading,
    publishStatus,
    rateLimitWarning,
    refetch,
  } = useWishlist({ logRelay });
  const { data: priceData } = useBitcoinPrice();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [nostrSettingsOpen, setNostrSettingsOpen] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const handleSave = async (payload: WishlistPayload) => {
    await addItem(payload);
    setImportUrl('');
  };

  const openImportDialog = (prefillUrl?: string) => {
    if (prefillUrl) setImportUrl(prefillUrl);
    setImportDialogOpen(true);
  };

  const debugEvents = useMemo(
    () => wishlist.map((item) => ({
      id: item.id,
      title: item.title,
      sats: item.targetPriceSats,
    })),
    [wishlist]
  );

  const relayList = config.relayMetadata.relays;

  const handleRefetch = async () => {
    try {
      setIsRefetching(true);
      await refetch();
    } finally {
      setIsRefetching(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h...
