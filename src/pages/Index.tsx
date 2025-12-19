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
    rateLimitWarning,
    requestNotificationPermission,
    notificationConsent,
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
      <div className="min-h-screen bg-gradient-to-b from-[#0c0c11] via-[#151521] to-[#0c0c11] text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text text-transparent">
              SatsList
            </h1>
            <p className="text-xl text-white/70">
              Deine Bitcoin Wunschliste auf Nostr
            </p>
            <LoginArea className="max-w-sm mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0c11] via-[#151521] to-[#0c0c11] text-white">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text text-transparent">
              SatsList
            </h1>
            <p className="text-sm text-white/70 mt-1">Deine Bitcoin Wunschliste</p>
          </div>
          <div className="flex items-center gap-3">
            <LoginArea className="max-w-60" />
          </div>
        </div>

        {/* Bitcoin Price */}
        {priceData && (
          <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-700/50 text-white shadow-lg">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70 uppercase tracking-wide">Bitcoin Preis</p>
                  <p className="text-3xl font-bold">
                    {priceData.satsToEuro(100000000).toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    1 BTC = 100.000.000 sats
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/60">1.000 sats</p>
                  <p className="text-2xl font-bold text-orange-300">
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
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm">Produkt hinzufügen</CardTitle>
            <CardDescription className="text-white/60 text-xs">
              Produktlink einfügen und direkt importieren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="https://shopinbit.com/produkt..."
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="bg-white/10 text-white border-white/20 placeholder:text-white/40"
              />
              <Button
                onClick={() => openImportDialog(importUrl)}
                disabled={!importUrl}
                variant="secondary"
              >
                Import
              </Button>
            </div>
            <div className="mt-2 text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDeletedItems}
                className="text-xs text-white/50 hover:text-white/80"
              >
                Gelöschte Einträge bereinigen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limit Warning */}
        {rateLimitWarning && (
          <Card className="bg-orange-500/10 border-orange-500/30">
            <CardContent className="py-3">
              <p className="text-sm text-orange-300">{rateLimitWarning}</p>
            </CardContent>
          </Card>
        )}

        {/* Publish Status */}
        {publishStatus.status === 'pending' && (
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="py-3">
              <p className="text-sm text-blue-300">Veröffentliche...</p>
            </CardContent>
          </Card>
        )}
        {publishStatus.error && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="py-3">
              <p className="text-sm text-red-300">Fehler: {publishStatus.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Delete Notice */}
        {deleteStatus.status === 'pending' && (
          <Card className="bg-orange-500/10 border-orange-500/30">
            <CardContent className="py-3">
              <p className="text-sm text-orange-300">
                Lösche Eintrag... (wird lokal ausgeblendet, während die endgültige Löschung bei den Relays verarbeitet wird)
              </p>
            </CardContent>
          </Card>
        )}
        {deleteStatus.error && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="py-3">
              <p className="text-sm text-red-300">
                Fehler beim Löschen: {(deleteStatus.error as Error)?.message || 'Unbekannter Fehler'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Wishlist Items */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/3 border-white/10">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-1/2 bg-white/10" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full bg-white/10" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <Card className="bg-white/3 border-white/10 border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-white/60">
                Noch keine Wünsche eingetragen. Erstelle dein erstes Ziel!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <summary className="cursor-pointer text-sm text-white/40 hover:text-white/60">
            Debug Info
          </summary>
          <div className="mt-4 space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  {debugEvents.length} Events
                </CardTitle>
                <CardDescription className="text-white/60 text-xs">
                  Die Liste zeigt rohe Kind-30078-Events. Wenn nichts angezeigt wird, prüfe deine Relays und Wallet-Rechte.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-white/80 overflow-x-auto">
                  {JSON.stringify(debugEvents, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  Relay Log (letzte 15)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs text-white/60 font-mono max-h-64 overflow-y-auto">
                  {relayLog.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">Relays & Rechte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-white/70">
                  {relayList.map((relay) => (
                    <div key={relay.url} className="flex items-center justify-between">
                      <span className="font-mono">{relay.url}</span>
                      <span className="text-white/50">
                        {relay.read && 'R'} / {relay.write && 'W'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">Publizieren</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60">Status:</span>
                    <span className="text-white">{publishStatus.status}</span>
                  </div>
                  {publishStatus.lastSuccessAt && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Letzter Erfolg:</span>
                      <span className="text-white">
                        {new Date(publishStatus.lastSuccessAt).toLocaleTimeString('de-DE')}
                      </span>
                    </div>
                  )}
                  {publishStatus.error && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Fehler:</span>
                      <span className="text-red-400">{publishStatus.error}</span>
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
        requestNotificationPermission={requestNotificationPermission}
        notificationConsent={notificationConsent}
      />
    </div>
  );
};

export default Index;
