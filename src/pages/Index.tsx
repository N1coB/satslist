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
