import { useMemo, useState } from 'react';
import { Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { BitcoinPriceData } from '@/hooks/useBitcoinPrice';
import { formatSats, formatEuros } from '@/lib/format';
import type { WishlistPayload } from '@/types/wishlist';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: WishlistPayload) => Promise<void>;
  priceData?: BitcoinPriceData;
}

export function AddProductDialog({
  open,
  onOpenChange,
  onSave,
  priceData,
}: AddProductDialogProps) {
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [image, setImage] = useState('');
  const [notes, setNotes] = useState('');
  const [targetSats, setTargetSats] = useState<number | ''>('');
  const [targetEuro, setTargetEuro] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const convertedSats = useMemo(() => {
    if (!priceData || targetEuro === '' || targetEuro === undefined) return undefined;
    return Math.round(priceData.euroToSats(targetEuro));
  }, [priceData, targetEuro]);

  const convertedEuro = useMemo(() => {
    if (!priceData || targetSats === '' || targetSats === undefined) return undefined;
    return priceData.satsToEuro(targetSats);
  }, [priceData, targetSats]);

  const effectiveSats = targetSats && targetSats > 0 ? targetSats : convertedSats;

  const helperLabel = targetSats && targetSats > 0
    ? `≈ ${convertedEuro ? formatEuros(convertedEuro) : '—'}`
    : targetEuro && targetEuro > 0
      ? `≈ ${formatSats(convertedSats ?? 0)} sats`
      : 'EUR oder sats eingeben';

  const handleSubmit = async () => {
    if (!title || !effectiveSats) {
      setError('Bitte Titel und Zielpreis angeben.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        link: link.trim() || undefined,
        image: image.trim() || undefined,
        notes: notes.trim() || undefined,
        targetPriceSats: effectiveSats,
        targetPriceEUR: priceData && effectiveSats
          ? priceData.satsToEuro(effectiveSats)
          : undefined,
      });

      setTitle('');
      setLink('');
      setImage('');
      setNotes('');
      setTargetSats('');
      setTargetEuro('');
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError('Dein Wunsch konnte nicht gespeichert werden.');
    } finally {
      setIsSaving(false);
    }
  };

  const canSubmit = Boolean(title.trim() && effectiveSats);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(90vw,520px)] bg-[#0c0c11] border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Handmade Wunschziel</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Schreib dir deine direkten Ziele in deine SatsList. Jeder Eintrag landet als sicheres Kind-30078-Event auf deiner Identität.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-white/90">
          <div className="grid gap-3">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Produktname"
              className="bg-[#151521] text-white"
            />
            <Input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="Produktlink (optional)"
              className="bg-[#151521] text-white"
            />
            <Input
              value={image}
              onChange={(event) => setImage(event.target.value)}
              placeholder="Bild-URL (optional)"
              className="bg-[#151521] text-white"
            />
            <div className="grid gap-3 text-white/80">
              <label className="text-sm font-semibold text-white">Zielpreis</label>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <label className="text-xs text-white/60">EUR</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={targetEuro === '' ? '' : targetEuro}
                    onChange={(event) => setTargetEuro(event.target.value === '' ? '' : Number(event.target.value))}
                    placeholder="150.00"
                    className="bg-[#151521] text-white text-lg font-semibold"
                  />
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs">oder</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs text-white/60">sats</label>
                  <Input
                    type="number"
                    min={0}
                    value={targetSats === '' ? '' : targetSats}
                    onChange={(event) => setTargetSats(event.target.value === '' ? '' : Number(event.target.value))}
                    placeholder="250000"
                    className="bg-[#151521] text-white"
                  />
                </div>
                {(targetSats || targetEuro) && (
                  <p className="text-xs text-orange-300/80 text-center">
                    {helperLabel}
                  </p>
                )}
              </div>
            </div>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notizen, Wunschdatum, Details"
              className="bg-[#151521] text-white"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              <Tag className="w-3 h-3 inline" />
              <span className="ml-2">{error}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || isSaving}>
            {isSaving ? 'Speichere…' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
