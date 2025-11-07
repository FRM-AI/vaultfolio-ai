import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, TrendingDown, TrendingUp, AlertTriangle, ShieldCheck, CircleDot, BarChart3, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProBadge } from '@/components/ProBadge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  buyedPrice?: number;
  onBuyedPriceChange?: (price: number | undefined) => void;
  streamProgress?: number;
  streamStatus?: string;
  adviceContent?: string;
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
  buyedPrice,
  onBuyedPriceChange,
  streamProgress,
  streamStatus,
  adviceContent,
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

  const markdownComponents = {
    table: (props: any) => (
      <div className="overflow-x-auto my-6 rounded-lg border-2 border-primary/20 shadow-[var(--shadow-card)] bg-card">
        <table className="min-w-full divide-y divide-border border-collapse" {...props} />
      </div>
    ),
    thead: (props: any) => <thead className="bg-gradient-to-r from-primary/10 to-accent/10" {...props} />,
    tbody: (props: any) => <tbody className="divide-y divide-border bg-background" {...props} />,
    th: (props: any) => (
      <th 
        className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider border-b-2 border-primary/30" 
        {...props} 
      />
    ),
    td: (props: any) => (
      <td
        className="px-4 py-3 text-sm text-foreground whitespace-normal break-words"
        {...props}
      />
    ),
    tr: (props: any) => <tr className="hover:bg-muted/30 transition-colors even:bg-muted/10" {...props} />,
    p: (props: any) => <p className="my-3 leading-relaxed" {...props} />,
    ul: (props: any) => <ul className="my-4 ml-6 list-disc space-y-2" {...props} />,
    ol: (props: any) => <ol className="my-4 ml-6 list-decimal space-y-2" {...props} />,
    li: (props: any) => <li className="leading-relaxed" {...props} />,
    h1: (props: any) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
    h2: (props: any) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
    h3: (props: any) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
    strong: (props: any) => <strong className="font-bold text-foreground" {...props} />,
    em: (props: any) => <em className="italic text-foreground/90" {...props} />,
    code: (props: any) => (
      <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props} />
    ),
    pre: (props: any) => (
      <pre className="my-4 p-4 rounded-lg bg-muted overflow-x-auto" {...props} />
    ),
  };

  return (
    <Card id="technical-signals-section" className="border-2 border-primary/20 shadow-[var(--shadow-card)] animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>{t.analyze.cafefSections.technicalSignals}</span>
          </div>
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
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 gap-2"
              >
                {isAnalyzing ? t.analyze.button.analyzing : (analyzeButtonText || t.analyze.button.analyze)}
                <ProBadge serviceType="technical_analysis" showTooltip={false} />
              </Button>
            )}
          </div>
        </CardTitle>
        {onBuyedPriceChange && (
          <div className="flex items-center gap-3 mt-4">
            <label className="text-sm font-medium whitespace-nowrap">
              {t.analyze.buyedPrice || 'Bought Price'}:
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder={t.analyze.buyedPricePlaceholder || 'Enter bought price (optional)'}
              value={buyedPrice || ''}
              onChange={(e) => {
                const value = e.target.value;
                onBuyedPriceChange(value ? parseFloat(value) : undefined);
              }}
              className="w-auto max-w-xs"
            />
            {buyedPrice && (
              <Button
                onClick={() => onBuyedPriceChange(undefined)}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                {t.analyze.clearPrice || 'Clear'}
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>{streamStatus || t.analyze.loadingData}</span>
            </div>
            {streamProgress !== undefined && streamProgress > 0 && (
              <div className="space-y-2">
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-accent transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(streamProgress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">{streamProgress}%</p>
              </div>
            )}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.analyze.emptyState.replace('{{section}}', t.analyze.cafefSections.technicalSignals)}
          </div>
        ) : (
          <div className="space-y-6">
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

            {adviceContent && (
              <div className="mt-6 pt-6 border-t border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t.analyze.technicalAdvice || 'Khuyến nghị đầu tư'}</h3>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {adviceContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
