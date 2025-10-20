import { Wallet, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { WalletService } from '@/lib/Endpoint/Walllet.service';
import { useState, useEffect } from 'react';
export function WalletInfo() {
  const { t } = useLanguage();
  const [walletData, setWalletData] = useState(null);
  useEffect(() => {
    WalletService.Get()
      .then((data) => {
        setWalletData(data);
      })
      .catch((error) => {
        console.error('Failed to fetch wallet data:', error);
      });
  }, []);

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground">{t.nav.wallet}</span>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground">{t.wallet.totalValue}</p>
          <p className="text-lg font-bold text-foreground">{walletData?.balance}</p>
        </div>
      </div>
    </Card>
  );
}
