import { useState, useEffect } from 'react';
import { Edit, Link, Euro, Target, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWishlist } from '@/hooks/useWishlist';
import { useBitcoinPrice, formatEur, eurToSats, formatSats } from '@/hooks/useBitcoinPrice';
import { WishlistItem } from '@/types/wishlist';
import { cn } from '@/lib/utils';

interface EditProductDialogProps {
  item: WishlistItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProductDialog({ item, open, onOpenChange }: EditProductDialogProps) {
  const [name, setName] = useState(item.name);
  const [url, setUrl] = useState(item.url);
  const [priceEur, setPriceEur] = useState(item.priceEur.toString());
  const [targetBtcPrice, setTargetBtcPrice] = useState(item.targetBtcPrice.toString());
  const [imageUrl, setImageUrl] = useState(item.imageUrl || '');
  const [notes, setNotes] = useState(item.notes || '');

  const { updateItem, isSaving } = useWishlist();
  const { data: btcPrice } = useBitcoinPrice();

  // Reset form when item changes
  useEffect(() => {
    setName(item.name);
    setUrl(item.url);
    setPriceEur(item.priceEur.toString());
    setTargetBtcPrice(item.targetBtcPrice.toString());
    setImageUrl(item.imageUrl || '');
    setNotes(item.notes || '');
  }, [item]);

  const priceEurNum = parseFloat(priceEur) || 0;
  const targetBtcPriceNum = parseFloat(targetBtcPrice) || 0;

  // Calculate current cost in sats
  const currentSats = btcPrice ? eurToSats(priceEurNum, btcPrice.eur) : 0;
  
  // Calculate cost at target price in sats
  const targetSats = targetBtcPriceNum > 0 ? eurToSats(priceEurNum, targetBtcPriceNum) : 0;
  
  // Savings percentage
  const savingsPercent = currentSats > 0 && targetSats > 0 && targetSats < currentSats
    ? ((currentSats - targetSats) / currentSats) * 100
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !priceEurNum || !targetBtcPriceNum) return;
    
    await updateItem(item.id, {
      name,
      url: url || '',
      priceEur: priceEurNum,
      targetBtcPrice: targetBtcPriceNum,
      imageUrl: imageUrl || undefined,
      notes: notes || undefined,
    });
    
    onOpenChange(false);
  };

  const isValid = name && priceEurNum > 0 && targetBtcPriceNum > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Produkt bearbeiten
          </DialogTitle>
          <DialogDescription>
            Ändere die Details für "{item.name}".
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Produktname *
            </Label>
            <Input
              id="edit-name"
              placeholder="z.B. Sony WH-1000XM5 Kopfhörer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-url" className="flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              Link (ShopInBit oder andere)
            </Label>
            <Input
              id="edit-url"
              type="url"
              placeholder="https://shopinbit.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-priceEur" className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                Preis in EUR *
              </Label>
              <Input
                id="edit-priceEur"
                type="number"
                step="0.01"
                min="0"
                placeholder="299.00"
                value={priceEur}
                onChange={(e) => setPriceEur(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-targetBtcPrice" className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                Ziel-BTC-Preis (EUR) *
              </Label>
              <Input
                id="edit-targetBtcPrice"
                type="number"
                step="1"
                min="0"
                placeholder="150000"
                value={targetBtcPrice}
                onChange={(e) => setTargetBtcPrice(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Price preview */}
          {priceEurNum > 0 && btcPrice && (
            <div className="rounded-lg bg-accent/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Aktueller Preis:</span>
                <span className="font-medium">
                  {formatSats(currentSats)} ({formatEur(priceEurNum)})
                </span>
              </div>
              {targetBtcPriceNum > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bei Zielpreis:</span>
                    <span className="font-medium text-primary">
                      {formatSats(targetSats)}
                    </span>
                  </div>
                  {savingsPercent > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Du sparst:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {savingsPercent.toFixed(1)}% weniger Sats!
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-imageUrl" className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              Bild-URL (optional)
            </Label>
            <Input
              id="edit-imageUrl"
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notizen (optional)</Label>
            <Textarea
              id="edit-notes"
              placeholder="Warum möchtest du dieses Produkt?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSaving}
              className={cn(!isValid && "opacity-50")}
            >
              {isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
