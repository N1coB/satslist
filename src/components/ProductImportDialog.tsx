import { useState } from 'react';
import { Plus, Link, Loader2, CheckCircle2, Bell } from 'lucide-react';
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
import { useWishlist } from '@/hooks/useWishlist';
import { useProductMetadata, type ProductMetadata } from '@/hooks/useProductMetadata';
import { useNotifications } from '@/hooks/useNotifications';
import { useBitcoinPrice, formatEur } from '@/hooks/useBitcoinPrice';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface AddProductDialogProps {
  children?: React.ReactNode;
}

type Step = 'input' | 'loading' | 'confirm' | 'notification';

export function ProductImportDialog({ children }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('input');
  const [productUrl, setProductUrl] = useState('');
  const [metadata, setMetadata] = useState<ProductMetadata | null>(null);
  const [targetBtcPrice, setTargetBtcPrice] = useState('');

  const { extractMetadata, isLoading } = useProductMetadata();
  const { addItem, isSaving } = useWishlist();
  const { data: btcPrice } = useBitcoinPrice();
  const { user } = useCurrentUser();
  const {
    permission,
    requestPermission,
    notifyProductAdded,
  } = useNotifications();


interface AddProductDialogProps {
  children?: React.ReactNode;
}

type Step = 'input' | 'loading' | 'confirm' | 'notification';

export function ProductImportDialog({ children }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('input');
  const [productUrl, setProductUrl] = useState('');
  const [metadata, setMetadata] = useState<ProductMetadata | null>(null);
  const [targetBtcPrice, setTargetBtcPrice] = useState('');

  const { extractMetadata, isLoading } = useProductMetadata();
  const { addItem, isSaving } = useWishlist();
  const { data: btcPrice } = useBitcoinPrice();
  const { user } = useCurrentUser();
  const {
    permission,
    requestPermission,
    notifyProductAdded,
  } = useNotifications();

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleExtractMetadata = async () => {
    if (!isValidUrl(productUrl)) {
      return;
    }

    setStep('loading');
    const result = await extractMetadata(productUrl);

    if (result) {
      setMetadata(result);
      setStep('confirm');
    } else {
      setStep('input');
    }
  };

  const handleConfirm = async () => {
    if (!metadata || !targetBtcPrice) {
      return;
    }

    // Request notification permission before adding
    if (permission !== 'granted') {
      setStep('notification');
      return;
    }

    await addItem({
      name: metadata.title,
      url: productUrl,
      priceEur: metadata.price,
      targetBtcPrice: parseFloat(targetBtcPrice),
      imageUrl: metadata.imageUrl,
    });

    // Send notification
    notifyProductAdded(metadata.title);

    // Reset
    setOpen(false);
    setStep('input');
    setProductUrl('');
    setMetadata(null);
    setTargetBtcPrice('');
  };

  const handleNotificationPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      await handleConfirm();
    } else {
      setStep('confirm');
    }
  };

  const isFormValid = metadata && targetBtcPrice && parseFloat(targetBtcPrice) > 0;

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
        {/* Step 1: Input URL */}
        {step === 'input' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Produkt aus Link hinzufügen
              </DialogTitle>
              <DialogDescription>
                Gib den Link zu deinem Wunschprodukt ein. Wir laden automatisch den Namen, Bild und Preis.
              </DialogDescription>
            </DialogHeader>

            {!user ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  Bitte logge dich ein, um Produkte hinzuzufügen.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url" className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    Produktlink *
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://shopinbit.com/product/123"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isValidUrl(productUrl)) {
                        handleExtractMetadata();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    z.B. ShopInBit, Amazon oder jeder andere Online-Shop
                  </p>
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
                    disabled={!isValidUrl(productUrl) || isLoading}
                    onClick={handleExtractMetadata}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Laden...
                      </>
                    ) : (
                      'Weiter'
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}

        {/* Step 2: Loading */}
        {step === 'loading' && (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">
              Läde Produktdaten...
            </p>
          </div>
        )}

        {/* Step 3: Confirm metadata */}
        {step === 'confirm' && metadata && (
          <>
            <DialogHeader>
              <DialogTitle>Produktdaten bestätigen</DialogTitle>
              <DialogDescription>
                Prüfe und bestätige die Daten. Du kannst sie noch ändern.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Product preview */}
              <div className="rounded-lg bg-muted p-4 space-y-3">
                {metadata.imageUrl && (
                  <div className="w-full h-40 rounded-lg overflow-hidden bg-background">
                    <img
                      src={metadata.imageUrl}
                      alt={metadata.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div>
                  <p className="font-semibold text-sm mb-1">Produktname</p>
                  <p className="text-lg font-bold">{metadata.title}</p>
                </div>

                <div>
                  <p className="font-semibold text-sm mb-1">Preis</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatEur(metadata.price)}
                  </p>
                </div>
              </div>

              {/* Target price input */}
              <div className="space-y-2">
                <Label htmlFor="target-price">
                  Ziel-BTC-Preis (EUR) *
                </Label>
                <Input
                  id="target-price"
                  type="number"
                  step="1"
                  min="0"
                  placeholder={btcPrice ? Math.round(btcPrice.eur * 1.5).toString() : '150000'}
                  value={targetBtcPrice}
                  onChange={(e) => setTargetBtcPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Bei welchem BTC-Preis möchtest du dieses Produkt kaufen?
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('input')}
                >
                  Zurück
                </Button>
                <Button
                  disabled={!isFormValid || isSaving}
                  onClick={handleConfirm}
                >
                  {isSaving ? 'Speichern...' : 'Hinzufügen'}
                </Button>
              </DialogFooter>
            </div>
          </>
        )}

        {/* Step 4: Request notification permission */}
        {step === 'notification' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Benachrichtigungen aktivieren?
              </DialogTitle>
              <DialogDescription>
                Damit wir dich benachrichtigen können, wenn dein Zielpreis erreicht wird.
              </DialogDescription>
            </DialogHeader>

            <div className="py-8 space-y-6">
              <div className="rounded-lg bg-primary/10 p-4 flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Wichtige Benachrichtigungen</p>
                  <p className="text-sm text-muted-foreground">
                    Du wirst benachrichtigt, wenn dein Zielpreis erreicht wird oder ein Produkt hinzugefügt wurde.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('confirm')}
                >
                  Später
                </Button>
                <Button onClick={handleNotificationPermission}>
                  Ja, aktivieren
                </Button>
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
