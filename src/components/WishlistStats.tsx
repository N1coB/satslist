import { ShoppingBag, Target, CheckCircle2, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { WishlistData } from '@/types/wishlist';
import { useBitcoinPrice, formatEur, eurToSats, formatSats } from '@/hooks/useBitcoinPrice';

interface WishlistStatsProps {
  wishlist: WishlistData;
}

export function WishlistStats({ wishlist }: WishlistStatsProps) {
  const { data: btcPrice } = useBitcoinPrice();

  const activeItems = wishlist.items.filter((item) => !item.purchased);
  const purchasedItems = wishlist.items.filter((item) => item.purchased);
  
  const totalValue = activeItems.reduce((sum, item) => sum + item.priceEur, 0);
  const totalSats = btcPrice
    ? activeItems.reduce((sum, item) => sum + eurToSats(item.priceEur, btcPrice.eur), 0)
    : 0;
  
  const readyToBuy = btcPrice
    ? activeItems.filter((item) => btcPrice.eur >= item.targetBtcPrice).length
    : 0;

  const stats = [
    {
      label: 'Produkte',
      value: activeItems.length.toString(),
      icon: ShoppingBag,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Gesamtwert',
      value: formatEur(totalValue),
      subValue: formatSats(totalSats),
      icon: Coins,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Bereit zum Kauf',
      value: readyToBuy.toString(),
      icon: Target,
      color: readyToBuy > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
      bgColor: readyToBuy > 0 ? 'bg-green-500/10' : 'bg-muted',
    },
    {
      label: 'Gekauft',
      value: purchasedItems.length.toString(),
      icon: CheckCircle2,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                {stat.subValue && (
                  <p className="text-xs text-muted-foreground truncate">{stat.subValue}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
