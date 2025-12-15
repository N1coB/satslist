import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Plus, Import, Zap } from 'lucide-react';

import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useWishlist } from '@/hooks/useWishlist';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { WishlistCard } from '@/components/wishlist/WishlistCard';
import { WishlistStats } from '@/components/wishlist/WishlistStats';
import { AddProductDialog } from '@/components/wishlist/AddProductDialog';
import { ProductImportDialog } from '@/components/wishlist/ProductImportDialog';
import type { WishlistPayload } from '@/types/wishlist';

const Index = () => {
  useSeoMeta({
    title: 'SatsList – Deine Bitcoin Wunschliste',
    description: 'Verwalte deine Wunschliste mit Bitcoin. Setze Zielpreise in Sats, verfolge deinen Fortschritt und erhalte Alerts wenn der Preis stimmt.',
  });

  const { user } = useCurrentUser();
  const { wishlist, stats, addItem, isLoading } = useWishlist();
  const { data: priceData } = useBitcoinPrice();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleSave = async (payload: WishlistPayload) => {
    await addItem(payload);
  };

  // Logged-out state
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">SatsList</h1>
            <p className="text-lg text-white/70">
              Deine Bitcoin Wunschliste – dezentral auf Nostr gespeichert.
            </p>
          </div>

          <Card className="bg-white/5 border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">Jetzt starten</CardTitle>
              <CardDescription>
                Melde dich mit Nostr an, um deine Wunschliste zu verwalten. Deine Daten gehören dir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginArea className="w-full" />
            </CardContent>
          </Card>

          <p className="text-xs text-white/40">
            Vibed with{' '}
            <a href="https://shakespeare.diy" target="_blank" rel="noreferrer" className="underline hover:text-white/60">
              Shakespeare
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Logged-in state
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SatsList</span>
          </div>
          <LoginArea className="max-w-60" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <WishlistStats count={stats.count} readyCount={stats.readyCount} totalTarget={stats.totalTarget} />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neues Ziel
          </Button>
          <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="gap-2">
            <Import className="w-4 h-4" />
            Produkt importieren
          </Button>
        </div>

        {/* Wishlist Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardHeader className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <Card className="border-dashed border-white/20 bg-white/5">
            <CardContent className="py-16 text-center">
              <div className="max-w-sm mx-auto space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10">
                  <Zap className="w-6 h-6 text-orange-400" />
                </div>
                <p className="text-lg font-medium text-white">Noch keine Wünsche</p>
                <p className="text-sm text-white/60">
                  Füge dein erstes Ziel hinzu und starte deine Bitcoin-Sparreise.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((item) => (
              <WishlistCard key={item.id} item={item} bitcoinPrice={priceData} />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="pt-8 text-center text-xs text-white/40">
          Vibed with{' '}
          <a href="https://shakespeare.diy" target="_blank" rel="noreferrer" className="underline hover:text-white/60">
            Shakespeare
          </a>
        </footer>
      </main>

      {/* Dialogs */}
      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleSave}
        priceData={priceData}
      />
      <ProductImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSave={handleSave}
        priceData={priceData}
      />
    </div>
  );
};

export default Index;
