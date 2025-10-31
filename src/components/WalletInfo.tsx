import { Wallet, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { WalletService } from '@/lib/Endpoint/Walllet.service';
import { useState, useEffect } from 'react';

export const API_PRICING = {
  technical_analysis: 3,
  news_analysis: 2,
  proprietary_trading_analysis: 3,
  foreign_trading_analysis: 3,
  shareholder_trading_analysis: 3,
  intraday_match_analysis: 3,
  technical_signals: 2,
  portfolio_optimization: 5,
  calculate_portfolio: 2,
} as const;

export type AnalysisServiceType = keyof typeof API_PRICING;

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">{t.nav.wallet}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-lg font-bold text-foreground">{walletData?.balance || '0'}</p>
          <img src="/logo.png" alt="FRM" className="h-5 w-5 object-contain" />
        </div>
      </div>
    </Card>
  );
}
