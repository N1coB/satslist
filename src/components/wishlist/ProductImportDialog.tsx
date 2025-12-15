import { useEffect, useMemo, useState } from 'react';
import { Link2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WishlistPayload } from '@/types/wishlist';
import { useProductMetadata } from '@/hooks/useProductMetadata';
import type { BitcoinPriceData } from '@/hooks/useBitcoinPrice';
import { formatEuros } from '@/lib/format';

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: WishlistPayload) => Promise<void>;
  priceData?: BitcoinPriceData;
}

export function ProductImportDialog({
  open,
  onOpenChange,
  onSave,
  priceData,
}: ProductImportDialogProps) {
  const [url, setUrl] = useState('');
  const [submittedUrl, setSubmittedUrl] = useState('');
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [targetPrice, setTargetPrice] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const metadataQuery = useProductMetadata(submittedUrl);
  const metadata = metadataQuery.data;

  useEffect(() => {
    if (!metadata) return;

    setTitle((previous) => previous || metadata.title);

    if (metadata.image) {
      setImage(metadata.image);
    }

    if (metadata.priceEUR && priceData) {
      setTargetPrice((prev) => (prev > 0 ? prev : Math.round(priceData.euroToSats(metadata.priceEUR))));
    }
  }, [metadata, priceData]);

  const recommendedPriceEUR = metadata?.priceEUR;

  const targetEuro = useMemo(() => {
    if (targetPrice <= 0 || !priceData) return undefined;
    return priceData.satsToEuro(targetPrice);
  }, [targetPrice, priceData]);

  const canSave = Boolean(title && targetPrice > 0);

  const handleSubmit = async () => {
    if (!canSave) {
      setErrorMessage('Bitte Titel und Zielpreis definieren.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onSave({
        title: title.trim(),
        link: submittedUrl,
        image,
        notes: notes.trim() || undefined,
        targetPriceSats: targetPrice,
        targetPriceEUR: targetEuro,
        source: metadata?.source,
      });

      setUrl('');
      setSubmittedUrl('');
      setTitle('');
      setImage(undefined);
      setNotes('');
      setTargetPrice(0);
      onOpenChange(false);
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
      <DialogContent className="w-[min(90vw,520px)] bg-[#0c0c11] border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Produkt importieren</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Mit Nostr & SatsList verwaltest du deine Wunschliste direkt auf deiner eigenen Identität. Jede Speicherung erzeugt ein sicheres Kind-30078-Event.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-white/90">
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Produkt-URL"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleLoad()}
              className="bg-[#151521] text-white"
            />
            <Button variant="outline" onClick={handleLoad} size="sm">
              <Link2 className="h-4 w-4" />
              <span>Metadaten laden</span>
            </Button>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">{statusLabel}</p>
          </div>
          {metadata && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.45em] text-orange-200">Preview</span>
                <Badge variant="outline" className="text-[10px]">
                  <Sparkles className="h-3 w-3" />
                  {metadata.source}
                </Badge>
              </div>
              <div className="mt-3 grid gap-3">
                <p className="font-semibold text-white">{metadata.title}</p>
                {metadata.description && (
                  <p className="text-xs text-white/70">{metadata.description}</p>
                )}
                {metadata.image && (
                  <img src={metadata.image} alt={metadata.title} className="h-32 w-full rounded-2xl object-cover" loading="lazy" />
                )}
                {typeof recommendedPriceEUR === 'number' && (
                  <p className="text-xs uppercase text-white/60">{formatEuros(recommendedPriceEUR)} (empfohlen)</p>
                )}
              </div>
            </div>
          )}
          <div className="grid gap-3">
            <Input
              placeholder="Produktname (optional überschreiben)"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="bg-[#151521] text-white"
            />
            <div className="grid gap-3">
              <Input
                type="number"
                min={0}
                placeholder="Zielpreis in Sats"
                value={targetPrice === 0 ? '' : targetPrice}
                onChange={(event) => setTargetPrice(Number(event.target.value))}
                className="bg-[#151521] text-white"
              />
              {targetEuro !== undefined && (
                <p className="text-[11px] text-white/60">≈ {formatEuros(targetEuro)}</p>
              )}
            </div>
            <Textarea
              placeholder="Notizen & Wunschdatum"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="bg-[#151521] text-white"
            />
          </div>
          {errorMessage && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMessage}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost" size="sm">
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave || isSaving} size="sm">
            {isSaving ? 'Speichere...' : 'In Wishlist speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
