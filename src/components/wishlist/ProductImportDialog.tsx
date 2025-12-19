import { useEffect, useMemo, useState } from 'react';
import { Link2, Sparkles, BellRing } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { WishlistPayload } from '@/types/wishlist';
import { useProductMetadata } from '@/hooks/useProductMetadata';
import type { BitcoinPriceData } from '@/hooks/useBitcoinPrice';
import { formatEuros, formatSats } from '@/lib/format';
import { setNotificationConsent } from '@/hooks/useNotificationConsent';

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: WishlistPayload) => Promise<void>;
  priceData?: BitcoinPriceData;
  /** Optional URL to prefill when the dialog opens */
  initialUrl?: string;
  requestNotificationPermission: () => void;
  notificationConsent: NotificationPermission;
}

function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function ProductImportDialog({
  open,
  onOpenChange,
  onSave,
  priceData,
  initialUrl,
  requestNotificationPermission,
  notificationConsent,
}: ProductImportDialogProps) {
  const [url, setUrl] = useState('');
  const [submittedUrl, setSubmittedUrl] = useState('');
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [targetEuro, setTargetEuro] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const metadataQuery = useProductMetadata(submittedUrl);
  const metadata = metadataQuery.data;

  useEffect(() => {
    if (!metadata) return;

    setTitle((previous) => previous || metadata.title);

    if (metadata.image) {
      setImage(metadata.image);
    }

    if (typeof metadata.priceEUR === 'number' && !targetEuro) {
      setTargetEuro(metadata.priceEUR.toFixed(2));
    }
  }, [metadata, targetEuro]);

  useEffect(() => {
    if (!initialUrl) return;
    setUrl(initialUrl);
    setSubmittedUrl(initialUrl);
  }, [initialUrl]);

  const recommendedPriceEUR = metadata?.priceEUR;

  const targetEuroValue = targetEuro ? Number(targetEuro.replace(',', '.')) : undefined;

  const targetSats = useMemo(() => {
    if (!priceData || !targetEuroValue || targetEuroValue <= 0) return undefined;
    return Math.round(priceData.euroToSats(targetEuroValue));
  }, [priceData, targetEuroValue]);

  const canSave = Boolean(title && targetEuroValue && targetSats);

  const applyDiscount = (percent: number) => {
    if (!recommendedPriceEUR) return;
    const discounted = recommendedPriceEUR * (1 - percent / 100);
    setTargetEuro(discounted.toFixed(2));
  };

  const handleSubmit = async () => {
    if (!canSave || !targetEuroValue || !targetSats) {
      setErrorMessage('Bitte Zielpreis in EUR angeben.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onSave({
        title: title.trim(),
        link: submittedUrl || url,
        image,
        notes: notes.trim() || undefined,
        targetPriceSats: targetSats,
        targetPriceEUR: targetEuroValue,
        sourcePriceEUR: recommendedPriceEUR, // Aktueller Preis vom Shop
        source: metadata?.source,
      });

      setUrl('');
      setSubmittedUrl('');
      setTitle('');
      setImage(undefined);
      setNotes('');
      setTargetEuro('');
      onOpenChange(false);
      // Show toast if notifications are granted and not yet notified
      if (notificationConsent === 'granted') {
        toast({
          title: 'Benachrichtigungen aktiviert',
          description: 'Ich benachrichtige dich, sobald dein Zielpreis erreicht ist.',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Fehler beim Speichern deiner Wunschliste.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = () => {
    if (!url) return;
    setSubmittedUrl(url);
    setErrorMessage(null);
  };

  const statusLabel = metadataQuery.isFetching
    ? 'Lade Metadaten…'
    : metadata
      ? 'Metadaten geladen'
      : 'URL eingeben und Metadaten laden';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(90vw,520px)] bg-[#0c0c11] border border-white/10 shadow-2xl shadow-orange-500/40">
        <DialogHeader>
          <DialogTitle className="text-white">Produkt importieren</DialogTitle>
          <DialogDescription className="text-sm text-white/70">
            Links einfügen, Zielpreis in EUR setzen und SatsList erstellt dir ein sicheres Nostr-Event.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-white/90">
          <div className="flex gap-2">
            <Input
              placeholder="Produkt-URL"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleLoad()}
              className="bg-white/10 text-white placeholder:text-white/60"
            />
            <Button variant="outline" onClick={handleLoad} size="sm" className="px-4">
              <Link2 className="h-4 w-4" />
              Metadaten laden
            </Button>
          </div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">{statusLabel}</p>

          {isNotificationSupported() && notificationConsent === 'default' && (
            <Card className="bg-card border-border p-4">
              <div className="flex items-center space-x-3">
                <BellRing className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-white text-base">Benachrichtigung wenn Zielpreis erreicht</CardTitle>
                  <CardDescription className="text-white/70 text-sm">
                    Ich benachrichtige dich, wenn dein Ziel-Preis erreicht ist.
                  </CardDescription>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => {
                    requestNotificationPermission();
                  }}
                  className="flex-1 bg-primary text-white hover:bg-primary/90"
                  size="sm"
                >
                  Benachrichtige mich
                </Button>
                <Button
                  onClick={() => {
                    setNotificationConsent('denied');
                  }}
                  variant="secondary"
                  className="flex-1 border-border text-white hover:bg-muted/50"
                  size="sm"
                >
                  Manuell prüfen
                </Button>
              </div>
            </Card>
          )}

          {isNotificationSupported() && notificationConsent === 'denied' && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-xs text-red-300">
              Benachrichtigungen sind deaktiviert. Du kannst sie in deinen Browser-Einstellungen aktivieren.
            </div>
          )}

          {!isNotificationSupported() && (
            <div className="rounded-lg border border-gray-500/50 bg-gray-500/10 p-3 text-xs text-gray-300">
              Dein Browser unterstützt keine Benachrichtigungen oder sie sind blockiert.
            </div>
          )}

          {metadata && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{metadata.title}</p>
                  <a
                    href={submittedUrl || url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-orange-300 hover:text-orange-200"
                  >
                    {submittedUrl || url}
                  </a>
                </div>
                <Badge variant="outline" className="text-[10px] text-white/80">
                  <Sparkles className="h-3 w-3" />
                  {metadata.source}
                </Badge>
              </div>
              {metadata.image && (
                <img src={metadata.image} alt={metadata.title} className="mt-3 h-32 w-full rounded-2xl object-cover" loading="lazy" />
              )}
              {metadata.description && (
                <p className="mt-3 text-xs text-white/70">{metadata.description}</p>
              )}
              <p className="mt-2 text-[11px] text-white/60">
                Empfohlener Zielpreis: {recommendedPriceEUR ? formatEuros(recommendedPriceEUR) : '–'}
              </p>
            </div>
          )}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white">Zielpreis</label>
            <div className="grid gap-3">
              {recommendedPriceEUR && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDiscount(10)}
                    className="flex-1 text-xs border-white/20 text-white hover:bg-white/10"
                  >
                    -10%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDiscount(20)}
                    className="flex-1 text-xs border-white/20 text-white hover:bg-white/10"
                  >
                    -20%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDiscount(50)}
                    className="flex-1 text-xs border-white/20 text-white hover:bg-white/10"
                  >
                    -50%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDiscount(80)}
                    className="flex-1 text-xs border-white/20 text-white hover:bg-white/10"
                  >
                    -80%
                  </Button>
                </div>
              )}
              <div className="grid gap-2">
                <label className="text-xs text-white/60">EUR</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="150.00"
                  value={targetEuro}
                  onChange={(event) => setTargetEuro(event.target.value)}
                  className="bg-white/10 text-white text-lg font-semibold placeholder:text-white/40"
                />
                {targetSats && (
                  <p className="text-xs text-orange-300/80">
                    ≈ {formatSats(targetSats)} sats
                  </p>
                )}
              </div>
            </div>
          </div>
          <Textarea
            placeholder="Notizen, Wunschdatum oder Sonderwünsche"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="bg-white/10 text-white placeholder:text-white/60"
          />
          {errorMessage && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMessage}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost" size="sm" className="text-white">
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave || isSaving} size="sm" className="text-white">
            {isSaving ? 'Speichere...' : 'Importieren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
