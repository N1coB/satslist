import { useState } from 'react';
import { Plus, Link, Euro, Target, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWishlist } from '@/hooks/useWishlist';
import { useBitcoinPrice, formatEur, eurToSats, formatSats } from '@/hooks/useBitcoinPrice';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

interface AddProductDialogProps {
  children?: React.ReactNode;
}

export function AddProductDialog({ children }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [priceEur, setPriceEur] = useState('');
  const [targetBtcPrice, setTargetBtcPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');

  const { addItem, isSaving } = useWishlist();
  const { data: btcPrice } = useBitcoinPrice();
  const { user } = useCurrentUser();

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
    
    await addItem({
      name,
      url: url || '',
      priceEur: priceEurNum,
      targetBtcPrice: targetBtcPriceNum,
      imageUrl: imageUrl || undefined,
      notes: notes || undefined,
    });
    
    // Reset form
    setName('');
    setUrl('');
    setPriceEur('');
    setTargetBtcPrice('');
    setImageUrl('');
    setNotes('');
    setOpen(false);
  };

  const isValid = name && priceEurNum > 0 && targetBtcPriceNum > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Produkt hinzufügen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Neues Produkt
          </DialogTitle>
          <DialogDescription>
            Füge ein Produkt zu deiner Bitcoin-Wunschliste hinzu. Es wird gekauft, wenn dein Zielpreis erreicht ist.
          </DialogDescription>
        </DialogHeader>
        
        {!user ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Bitte logge dich ein, um Produkte hinzuzufügen.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Produktname *
              </Label>
              <Input
                id="name"
                placeholder="z.B. Sony WH-1000XM5 Kopfhörer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url" className="flex items-center gap-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                Link (ShopInBit oder andere)
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://shopinbit.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceEur" className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  Preis in EUR *
                </Label>
                <Input
                  id="priceEur"
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
                <Label htmlFor="targetBtcPrice" className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Ziel-BTC-Preis (EUR) *
                </Label>
                <Input
                  id="targetBtcPrice"
                  type="number"
                  step="1"
                  min="0"
                  placeholder={btcPrice ? Math.round(btcPrice.eur * 1.5).toString() : '150000'}
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
              <Label htmlFor="imageUrl" className="flex items-center gap-2">
                <Image className="h-4 w-4 text-muted-foreground" />
                Bild-URL (optional)
              </Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen (optional)</Label>
              <Textarea
                id="notes"
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
                onClick={() => setOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSaving}
                className={cn(!isValid && "opacity-50")}
              >
                {isSaving ? 'Speichern...' : 'Hinzufügen'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
