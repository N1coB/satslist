import { useState } from 'react';
import {
  ExternalLink,
  Trash2,
  Edit,
  Check,
  Target,
  TrendingUp,
  Bell,
  ShoppingCart,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WishlistItem } from '@/types/wishlist';
import { useBitcoinPrice, formatEur, eurToSats, formatSats } from '@/hooks/useBitcoinPrice';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { EditProductDialog } from './EditProductDialog';

interface WishlistCardProps {
  item: WishlistItem;
}

export function WishlistCard({ item }: WishlistCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { data: btcPrice } = useBitcoinPrice();
  const { removeItem, markPurchased, isSaving } = useWishlist();

  const currentBtcPrice = btcPrice?.eur || 0;
  const currentSats = currentBtcPrice > 0 ? eurToSats(item.priceEur, currentBtcPrice) : 0;
  const targetSats = eurToSats(item.priceEur, item.targetBtcPrice);

  // Progress to target price
  const priceProgress = currentBtcPrice > 0
    ? Math.min((currentBtcPrice / item.targetBtcPrice) * 100, 100)
    : 0;

  const isTargetReached = currentBtcPrice >= item.targetBtcPrice;
  const savingsPercent = currentSats > 0 && targetSats < currentSats
    ? ((currentSats - targetSats) / currentSats) * 100
    : 0;

  const handleDelete = async () => {
    await removeItem(item.id);
    setShowDeleteDialog(false);
  };

  const handleMarkPurchased = async () => {
    await markPurchased(item.id);
  };

  if (item.purchased) {
    return (
      <Card className="opacity-60 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <Check className="h-3 w-3 mr-1" />
                Gekauft
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex gap-4">
            {item.imageUrl && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover grayscale"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold line-through text-muted-foreground">{item.name}</h3>
              <p className="text-sm text-muted-foreground">
                Gekauft am {item.purchasedAt ? new Date(item.purchasedAt).toLocaleDateString('de-DE') : 'Unbekannt'}
              </p>
            </div>
          </div>
        </CardContent>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Produkt löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchtest du "{item.name}" wirklich von deiner Liste entfernen?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn(
        "card-hover overflow-hidden",
        isTargetReached && "ring-2 ring-green-500 ring-offset-2 dark:ring-offset-background"
      )}>
        {/* Target reached banner */}
        {isTargetReached && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-white text-sm font-medium flex items-center justify-center gap-2">
            <Bell className="h-4 w-4 animate-pulse" />
            Zielpreis erreicht! Zeit zu kaufen! 🎉
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {isTargetReached ? (
                <Badge className="bg-green-500 hover:bg-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Bereit zum Kauf!
                </Badge>
              ) : (
                <Badge variant="outline" className="border-primary/50 text-primary">
                  <Target className="h-3 w-3 mr-1" />
                  {formatEur(item.targetBtcPrice)} BTC-Preis
                </Badge>
              )}
              {savingsPercent > 0 && !isTargetReached && (
                <Badge variant="secondary" className="text-green-600 dark:text-green-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  -{savingsPercent.toFixed(0)}% Sats
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bearbeiten
                </DropdownMenuItem>
                {item.url && (
                  <DropdownMenuItem asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Im Shop öffnen
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleMarkPurchased}
                  disabled={isSaving}
                  className="text-green-600 dark:text-green-400"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Als gekauft markieren
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {item.imageUrl ? (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0 flex items-center justify-center border">
                <ShoppingCart className="h-8 w-8 text-primary/40" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg leading-tight mb-1">{item.name}</h3>
              {item.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">{item.notes}</p>
              )}
            </div>
          </div>

          {/* Price comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Aktueller Preis</p>
              <p className="font-bold text-2xl">{formatEur(item.priceEur)}</p>
              <p className="text-sm text-muted-foreground">{formatSats(currentSats)}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <p className="text-xs text-muted-foreground mb-1">Bei Zielpreis</p>
              <p className="font-bold text-2xl text-primary">{formatEur(item.priceEur)}</p>
              <p className="text-sm text-primary">{formatSats(targetSats)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Fortschritt zum Zielpreis</span>
              <span>{priceProgress.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isTargetReached
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-primary to-amber-400"
                )}
                style={{ width: `${priceProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Aktuell: {formatEur(currentBtcPrice)}
              </span>
              <span className="font-medium text-primary">
                Ziel: {formatEur(item.targetBtcPrice)}
              </span>
            </div>
          </div>

          {/* Action button for target reached */}
          {isTargetReached && item.url && (
            <Button asChild className="w-full gap-2">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="h-4 w-4" />
                Jetzt bei ShopInBit kaufen
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      <EditProductDialog
        item={item}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Produkt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du "{item.name}" wirklich von deiner Wunschliste entfernen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
