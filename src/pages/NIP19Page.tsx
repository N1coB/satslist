import { Bookmark, Link2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatEuros, formatSats } from '@/lib/format';

const placeholderProduct = {
  title: 'Cap model 185697 Art of polo black | one-size-fits-all | 1087889',
  shopPriceEUR: 26.86,
  targetPriceEUR: 21.49,
  image:
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  source: 'shopinbit.com',
  createdAt: '18.12.2025'
};

const calculateProgress = (shopEUR: number, targetEUR: number) => {
  const shopSats = Math.round(shopEUR * 1000);
  const targetSats = Math.round(targetEUR * 1000);
  const diff = shopSats - targetSats;
  const gapPercent = shopSats > 0 ? (diff / shopSats) * 100 : 0;
  const progress = Math.max(0, Math.min(100, 100 - Math.max(0, gapPercent)));
  return {
    progress: Math.round(progress),
    gapPercent: Math.round(Math.max(0, gapPercent)),
    savings: (shopEUR - targetEUR).toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR'
    })
  };
};

export function NIP19Page() {
  const { title, shopPriceEUR, targetPriceEUR, image, source, createdAt } = placeholderProduct;
  const { progress, gapPercent, savings } = calculateProgress(shopPriceEUR, targetPriceEUR);

  return (
    <div className="min-h-screen bg-background text-white px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-widest">shopinbit.com</p>
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
          <Sparkles className="w-6 h-6 text-orange-300" />
        </header>

        <Card className="bg-card border border-border shadow-lg">
          <CardContent className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900/50 via-slate-900 to-slate-900/60 p-6 flex justify-center">
              <img src={image} alt={title} className="max-h-64 w-auto rounded-xl shadow-xl" loading="lazy" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-[#1c1c24] border border-border rounded-2xl p-4">
                <p className="text-xs text-white/60 uppercase tracking-widest">Dein Zielpreis</p>
                <p className="text-3xl font-bold mt-2">{formatEuros(targetPriceEUR)}</p>
                <p className="text-sm text-white/50 mt-1">{formatSats(Math.round(targetPriceEUR * 1000))} sats</p>
              </div>
              <div className="bg-[#1c1c24] border border-border rounded-2xl p-4">
                <p className="text-xs text-white/60 uppercase tracking-widest">Shoppreis</p>
                <p className="text-3xl font-bold mt-2">{formatEuros(shopPriceEUR)}</p>
                <p className="text-sm text-white/50 mt-1">{formatSats(Math.round(shopPriceEUR * 1000))} sats</p>
              </div>
            </div>

            <div className="bg-[#1c1c24] border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Benötigte Reduktion</span>
                <strong className="text-orange-300">{gapPercent}%</strong>
              </div>
              <Progress value={progress} className="h-3 rounded-full bg-slate-800" />
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>{formatSats(Math.round(shopPriceEUR * 1000))} sats</span>
                <span className={shopPriceEUR > targetPriceEUR ? 'text-orange-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {shopPriceEUR > targetPriceEUR ? `-${savings}` : `+${savings}`}
                </span>
                <span>{formatSats(Math.round(targetPriceEUR * 1000))} sats</span>
              </div>
            </div>

            <Button size="lg" className="w-full bg-primary text-white">
              <Link2 className="w-4 h-4 mr-2" />
              Zum Produkt
            </Button>

            <footer className="flex items-center justify-between text-xs text-white/50">
              <span>Hinzugefügt am {createdAt}</span>
              <div className="inline-flex items-center gap-1 text-orange-300">
                <Bookmark className="w-4 h-4" />
                {source}
              </div>
            </footer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
