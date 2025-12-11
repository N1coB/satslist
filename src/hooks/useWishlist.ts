import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { WishlistData, WishlistItem, createEmptyWishlist, generateItemId } from '@/types/wishlist';

const WISHLIST_D_TAG = 'satslist-wishlist-v1';
const WISHLIST_KIND = 30078;

export function useWishlist() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: createEvent } = useNostrPublish();

  // Fetch wishlist from Nostr
  const query = useQuery({
    queryKey: ['wishlist', user?.pubkey],
    queryFn: async (c) => {
      if (!user) return createEmptyWishlist();
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query([
        {
          kinds: [WISHLIST_KIND],
          authors: [user.pubkey],
          '#d': [WISHLIST_D_TAG],
          limit: 1,
        },
      ], { signal });
      
      if (events.length === 0) {
        return createEmptyWishlist();
      }
      
      try {
        const data = JSON.parse(events[0].content) as WishlistData;
        return data;
      } catch {
        return createEmptyWishlist();
      }
    },
    enabled: !!user,
  });

  // Save wishlist to Nostr
  const saveMutation = useMutation({
    mutationFn: async (wishlist: WishlistData) => {
      if (!user) throw new Error('Not logged in');
      
      await createEvent({
        kind: WISHLIST_KIND,
        content: JSON.stringify(wishlist),
        tags: [
          ['d', WISHLIST_D_TAG],
          ['alt', 'SatsList Bitcoin Wishlist'],
        ],
      });
      
      return wishlist;
    },
    onSuccess: (wishlist) => {
      queryClient.setQueryData(['wishlist', user?.pubkey], wishlist);
    },
    onError: (error) => {
      toast({
        title: 'Fehler beim Speichern',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    },
  });

  // Add item
  const addItem = async (item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const currentData = query.data || createEmptyWishlist();
    const now = Date.now();
    
    const newItem: WishlistItem = {
      ...item,
      id: generateItemId(),
      createdAt: now,
      updatedAt: now,
    };
    
    const newData: WishlistData = {
      ...currentData,
      items: [...currentData.items, newItem],
    };
    
    await saveMutation.mutateAsync(newData);
    
    toast({
      title: 'Produkt hinzugefügt',
      description: `"${item.name}" wurde zu deiner Wunschliste hinzugefügt.`,
    });
    
    return newItem;
  };

  // Update item
  const updateItem = async (id: string, updates: Partial<WishlistItem>) => {
    const currentData = query.data || createEmptyWishlist();
    
    const newData: WishlistData = {
      ...currentData,
      items: currentData.items.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: Date.now() }
          : item
      ),
    };
    
    await saveMutation.mutateAsync(newData);
    
    toast({
      title: 'Produkt aktualisiert',
      description: 'Die Änderungen wurden gespeichert.',
    });
  };

  // Remove item
  const removeItem = async (id: string) => {
    const currentData = query.data || createEmptyWishlist();
    const item = currentData.items.find((i) => i.id === id);
    
    const newData: WishlistData = {
      ...currentData,
      items: currentData.items.filter((i) => i.id !== id),
    };
    
    await saveMutation.mutateAsync(newData);
    
    toast({
      title: 'Produkt entfernt',
      description: item ? `"${item.name}" wurde von deiner Liste entfernt.` : 'Produkt entfernt.',
    });
  };

  // Mark as purchased
  const markPurchased = async (id: string) => {
    await updateItem(id, { purchased: true, purchasedAt: Date.now() });
    
    toast({
      title: '🎉 Gekauft!',
      description: 'Glückwunsch zum Kauf! Das Produkt wurde als gekauft markiert.',
    });
  };

  return {
    wishlist: query.data || createEmptyWishlist(),
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
    error: query.error,
    addItem,
    updateItem,
    removeItem,
    markPurchased,
    refetch: query.refetch,
  };
}
