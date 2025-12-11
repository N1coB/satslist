import { useSeoMeta } from '@unhead/react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { BitcoinPriceCard } from '@/components/BitcoinPriceCard';
import { WishlistCard } from '@/components/WishlistCard';
import { WishlistStats } from '@/components/WishlistStats';
import { EmptyWishlist } from '@/components/EmptyWishlist';
import { AddProductDialog } from '@/components/AddProductDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWishlist } from '@/hooks/useWishlist';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';

function WishlistSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </div>
              <Skeleton className="h-2 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NotLoggedIn() {
  return (
    <Card className="border-dashed border-2 bg-gradient-to-br from-primary/5 via-background to-amber-500/5">
      <CardContent className="py-16 px-8 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Willkommen bei SatsList!</h3>
            <p className="text-muted-foreground leading-relaxed">
              Logge dich mit Nostr ein, um deine Bitcoin-Wunschliste zu erstellen und zu speichern.
              Deine Daten werden dezentral auf Nostr-Relays gespeichert - nur du hast Zugriff.
            </p>
          </div>
          
          <div className="pt-4 flex justify-center">
            <LoginArea className="w-full max-w-xs" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const Index = () => {
  useSeoMeta({
    title: 'SatsList - Bitcoin Wunschliste',
    description: 'Erstelle deine Bitcoin-Wunschliste. Kaufe Produkte automatisch, wenn dein Zielpreis erreicht ist. HODL und belohne dich selbst!',
  });

  const { user } = useCurrentUser();
  const { wishlist, isLoading, error } = useWishlist();

  const activeItems = wishlist.items.filter((item) => !item.purchased);
  const purchasedItems = wishlist.items.filter((item) => item.purchased);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section with Bitcoin Price */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">
                Deine <span className="gradient-text">Bitcoin-Wunschliste</span>
              </h2>
              <p className="text-muted-foreground mt-1">
                HODL und kaufe, wenn dein Zielpreis erreicht ist 🚀
              </p>
            </div>
            {user && wishlist.items.length > 0 && (
              <AddProductDialog />
            )}
          </div>
          
          <BitcoinPriceCard />
        </section>

        {/* Main Content */}
        {!user ? (
          <NotLoggedIn />
        ) : isLoading ? (
          <WishlistSkeleton />
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium">Fehler beim Laden der Wunschliste</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'Unbekannter Fehler'}
              </p>
            </CardContent>
          </Card>
        ) : wishlist.items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="space-y-8">
            {/* Stats */}
            <WishlistStats wishlist={wishlist} />

            {/* Active Items */}
            {activeItems.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">
                  Aktive Wünsche ({activeItems.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeItems.map((item) => (
                    <WishlistCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Purchased Items */}
            {purchasedItems.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">
                  Bereits gekauft ({purchasedItems.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {purchasedItems.map((item) => (
                    <WishlistCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="pt-8 pb-4 border-t text-center text-sm text-muted-foreground">
          <p>
            Vibed with{' '}
            <a
              href="https://shakespeare.diy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Shakespeare
            </a>
            {' '}• Deine Daten gehören dir (Nostr)
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
