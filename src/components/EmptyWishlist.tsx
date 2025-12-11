import { ShoppingBag, Plus, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddProductDialog } from './AddProductDialog';

export function EmptyWishlist() {
  return (
    <Card className="border-dashed border-2 bg-gradient-to-br from-primary/5 via-background to-amber-500/5">
      <CardContent className="py-16 px-8 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="relative inline-block">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center mx-auto">
              <ShoppingBag className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold gradient-text">
              Starte deine Bitcoin-Wunschliste
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Füge Produkte hinzu, die du dir kaufen möchtest, wenn Bitcoin deinen Zielpreis erreicht. 
              HODLe und belohne dich selbst für deine Geduld! 🚀
            </p>
          </div>
          
          <div className="pt-4">
            <AddProductDialog>
              <Button size="lg" className="gap-2 text-lg px-8">
                <Plus className="h-5 w-5" />
                Erstes Produkt hinzufügen
              </Button>
            </AddProductDialog>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">1.</p>
              <p className="text-xs text-muted-foreground">Produkt wählen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">2.</p>
              <p className="text-xs text-muted-foreground">Zielpreis setzen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">3.</p>
              <p className="text-xs text-muted-foreground">HODL & Kaufen!</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
