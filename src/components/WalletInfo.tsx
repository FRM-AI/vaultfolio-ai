import { Wallet, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export function WalletInfo() {
  const { t } = useLanguage();

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground">{t.nav.wallet}</span>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground">{t.wallet.totalValue}</p>
          <p className="text-lg font-bold text-foreground">2,450,000,000 ₫</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t.wallet.profit}</p>
            <div className="flex items-center gap-1 text-success">
              <ArrowUpRight className="h-3 w-3" />
              <span className="text-sm font-semibold">+345M ₫</span>
            </div>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">{t.wallet.roi}</p>
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="h-3 w-3" />
              <span className="text-sm font-semibold">+16.4%</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
