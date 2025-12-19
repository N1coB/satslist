import { useMemo, useState, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';

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
import { ProductImportDialog } from '@/components/wishlist/ProductImportDialog';
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
    deleteItem,
    clearDeletedItems,
    isLoading,
    publishStatus,
    deleteStatus,
  } = useWishlist({ logRelay });
  const { data: priceData } = useBitcoinPrice();

  // Import Dialog State
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h1 className="text-5xl font-bold text-accent">
              SatsList
            </h1>
            <p className="text-xl text-foreground/70">
              Deine Bitcoin Wunschliste auf Nostr
            </p>
            <LoginArea className="max-w-sm mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-accent">
              SatsList
            </h1>
            <p className="text-sm text-foreground/70 mt-1">Deine Bitcoin Wunschliste</p>
          </div>
          <div className="flex items-center gap-3">
            <LoginArea className="max-w-60" />
          </div>
        </div>

        {/* Bitcoin Price */}
        {priceData && (
          <Card className="bg-card border border-border text-foreground shadow-lg">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-foreground/70 uppercase tracking-wide">Bitcoin Preis</p>
                  <p className="text-3xl font-bold">
                    {priceData.satsToEuro(100000000).toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-foreground/50 mt-1">
                    1 BTC = 100.000.000 sats
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/60">1.000 sats</p>
                  <p className="text-2xl font-bold text-accent">
                    {priceData.satsToEuro(1000).toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <WishlistStats
          count={stats.count}
          readyCount={stats.readyCount}
          totalTarget={stats.totalTarget}
        />

        {/* Import from URL */}
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-sm">Produkt hinzufügen</CardTitle>
            <CardDescription className="text-foreground/60 text-xs">
              Produktlink einfügen und direkt importieren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="https://shopinbit.com/produkt..."
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="bg-muted text-foreground border border-input placeholder:text-muted-foreground"
              />
              <Button
                onClick={() => openImportDialog(importUrl)}
                disabled={!importUrl}
                variant="secondary"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Import
              </Button>
            </div>
            <div className="mt-2 text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDeletedItems}
                className="text-xs text-foreground/50 hover:text-foreground/80"
              >
                Gelöschte Einträge bereinigen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Publish Status */}
        {publishStatus.status === 'pending' && (
          <Card className="bg-info/10 border-info/30">
            <CardContent className="py-3">
              <p className="text-sm text-info">Veröffentliche...</p>
            </CardContent>
          </Card>
        )}
        {publishStatus.error && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="py-3">
              <p className="text-sm text-destructive">Fehler: {publishStatus.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Delete Notice */}
        {deleteStatus.status === 'pending' && (
          <Card className="bg-warning/10 border-warning/30">
            <CardContent className="py-3">
              <p className="text-sm text-warning">
                Lösche Eintrag... (wird lokal ausgeblendet, während die endgültige Löschung bei den Relays verarbeitet wird)
              </p>
            </CardContent>
          </Card>
        )}
        {deleteStatus.error && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="py-3">
              <p className="text-sm text-destructive">
                Fehler beim Löschen: {(deleteStatus.error as Error)?.message || 'Unbekannter Fehler'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Wishlist Items */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border border-border">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 bg-muted" />
                  <Skeleton className="h-4 w-1/2 bg-muted" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <Card className="bg-card border border-border border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-foreground/60">
                Noch keine Wünsche eingetragen. Erstelle dein erstes Ziel!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((item) => (
              <WishlistCard
                key={item.id}
                item={item}
                bitcoinPrice={priceData}
                onDelete={deleteItem}
              />
            ))}
          </div>
        )}

        {/* Debug Info */}
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-foreground/40 hover:text-foreground/60">
            Debug Info
          </summary>
          <div className="mt-4 space-y-4">
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-sm">
                  {debugEvents.length} Events
                </CardTitle>
                <CardDescription className="text-foreground/60 text-xs">
                  Die Liste zeigt rohe Kind-30078-Events. Wenn nichts angezeigt wird, prüfe deine Relays und Wallet-Rechte.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-foreground/80 overflow-x-auto">
                  {JSON.stringify(debugEvents, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-sm">
                  Relay Log (letzte 15)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs text-foreground/60 font-mono max-h-64 overflow-y-auto">
                  {relayLog.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-sm">Relays & Rechte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-foreground/70">
                  {relayList.map((relay) => (
                    <div key={relay.url} className="flex items-center justify-between">
                      <span className="font-mono">{relay.url}</span>
                      <span className="text-foreground/50">
                        {relay.read && 'R'} / {relay.write && 'W'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-sm">Publizieren</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Status:</span>
                    <span className="text-foreground">{publishStatus.status}</span>
                  </div>
                  {publishStatus.lastSuccessAt && (
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Letzter Erfolg:</span>
                      <span className="text-foreground">
                        {new Date(publishStatus.lastSuccessAt).toLocaleTimeString('de-DE')}
                      </span>
                    </div>
                  )}
                  {publishStatus.error && (
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Fehler:</span>
                      <span className="text-destructive">{publishStatus.error}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </details>
      </div>

      {/* Dialogs */}
      <ProductImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSave={handleSave}
        priceData={priceData}
        initialUrl={importUrl}
      />
    </div>
  );
};

export default Index;
