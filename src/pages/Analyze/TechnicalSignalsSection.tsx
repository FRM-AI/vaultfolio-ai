import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, TrendingDown, TrendingUp, AlertTriangle, ShieldCheck, CircleDot, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TechnicalSignalsSectionProps {
  data: any;
  onAnalyze?: () => void;
  analyzeButtonText?: string;
  isAnalyzing?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface Signal {
  signal: string;
  explanation: string;
}

export function TechnicalSignalsSection({
  data,
  onAnalyze,
  analyzeButtonText,
  isAnalyzing = false,
  isLoading = false,
  onRefresh,
}: TechnicalSignalsSectionProps) {
  const { t } = useLanguage();

  const signals: Signal[] = useMemo(() => {
    if (!data) return [];
    
    // Handle different response structures
    if (Array.isArray(data)) return data;
    if (data.signals && Array.isArray(data.signals)) return data.signals;
    if (data.data?.signals && Array.isArray(data.data.signals)) return data.data.signals;
    
    return [];
  }, [data]);

  const getSignalIcon = (signalText: string) => {
    const signal = signalText.toLowerCase();
    
    if (signal.includes('bearish') || signal.includes('giảm') || signal.includes('oversold') || signal.includes('bán quá')) {
      return <TrendingDown className="h-6 w-6 text-red-500" />;
    }
    if (signal.includes('bullish') || signal.includes('tăng') || signal.includes('overbought') || signal.includes('mua quá')) {
      return <TrendingUp className="h-6 w-6 text-green-500" />;
    }
    if (signal.includes('risk') || signal.includes('rủi ro') || signal.includes('stop-loss') || signal.includes('take-profit')) {
      return <ShieldCheck className="h-6 w-6 text-blue-500" />;
    }
    if (signal.includes('obv') || signal.includes('volume') || signal.includes('vpt') || signal.includes('khối lượng')) {
      return <BarChart3 className="h-6 w-6 text-purple-500" />;
    }
    if (signal.includes('increasing') || signal.includes('with price')) {
      return <TrendingUp className="h-6 w-6 text-emerald-500" />;
    }
    if (signal.includes('crossover') || signal.includes('cắt')) {
      return <AlertTriangle className="h-6 w-6 text-orange-500" />;
    }
    
    return <CircleDot className="h-6 w-6 text-gray-500" />;
  };

  const getSignalBadgeColor = (signalText: string) => {
    const signal = signalText.toLowerCase();
    
    if (signal.includes('bearish') || signal.includes('giảm') || signal.includes('oversold') || signal.includes('bán quá')) {
      return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    }
    if (signal.includes('bullish') || signal.includes('tăng') || signal.includes('overbought') || signal.includes('mua quá')) {
      return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
    }
    if (signal.includes('risk') || signal.includes('rủi ro') || signal.includes('stop-loss') || signal.includes('take-profit')) {
      return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700';
    }
    if (signal.includes('obv') || signal.includes('volume') || signal.includes('vpt') || signal.includes('khối lượng')) {
      return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700';
    }
    if (signal.includes('increasing') || signal.includes('with price')) {
      return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700';
    }
    
    return 'bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700';
  };

  const isEmpty = signals.length === 0;

  return (
    <Card className="border-2 border-primary/20 shadow-[var(--shadow-card)] animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t.analyze.cafefSections.technicalSignals}</span>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                onClick={onRefresh}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="border-primary/30 hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {t.analyze.button.refresh}
              </Button>
            )}
            {onAnalyze && (
              <Button
                onClick={onAnalyze}
                disabled={isAnalyzing || isEmpty}
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {isAnalyzing ? t.analyze.button.analyzing : (analyzeButtonText || t.analyze.button.analyze)}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{t.analyze.loadingData}</span>
          </div>
        ) : isEmpty ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.analyze.emptyState.replace('{{section}}', t.analyze.cafefSections.technicalSignals)}
          </div>
        ) : (
          <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {signals.map((item, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-help transition-all hover:scale-105 hover:shadow-md ${getSignalBadgeColor(
                        item.signal
                      )}`}
                    >
                      {getSignalIcon(item.signal)}
                      <span className="text-xs font-medium text-center mt-2 line-clamp-2">
                        {item.signal.split('(')[0].trim()}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md p-4" side="top">
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">{item.signal}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.explanation}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
