import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ExternalLink, Newspaper, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProBadge } from '@/components/ProBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface NewsDataSectionProps {
  title: string;
  data: any;
  onAnalyze?: () => void;
  analyzeButtonText?: string;
  isAnalyzing?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function NewsDataSection({
  title,
  data,
  onAnalyze,
  analyzeButtonText,
  isAnalyzing = false,
  isLoading = false,
  onRefresh,
}: NewsDataSectionProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);

  const newsItems = useMemo(() => {
    if (!data) return null;

    const tryParse = (value: any) => {
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    };

    const extractArray = (value: any): any[] | null => {
      const parsed = tryParse(value);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') {
        const keysToCheck = [
          'Data',
          'data',
          'items',
          'list',
          'news',
          'articles',
        ];
        for (const key of keysToCheck) {
          if (parsed[key] !== undefined) {
            const arr = extractArray(parsed[key]);
            if (arr) return arr;
          }
        }
        const firstArrayValue = Object.values(parsed).find((val) => Array.isArray(tryParse(val)));
        if (firstArrayValue) {
          const arr = extractArray(firstArrayValue);
          if (arr) return arr;
        }
      }
      return null;
    };

    // Handle direct array response
    if (Array.isArray(data)) {
      return data.filter((item) => item !== null && item !== undefined);
    }

    // Try to extract array from various possible structures
    const candidates = [data, data?.data];
    for (const candidate of candidates) {
      const arr = extractArray(candidate);
      if (arr && arr.length > 0) {
        return arr.filter((item) => item !== null && item !== undefined);
      }
    }

    return null;
  }, [data]);

  const isEmpty = !data || !newsItems || newsItems.length === 0;

  const getSentimentColor = (sentiment: string) => {
    if (!sentiment) return 'default';
    const s = sentiment.toLowerCase();
    if (s.includes('positive') || s === 'bullish') return 'default'; // green
    if (s.includes('negative') || s === 'bearish') return 'destructive'; // red
    return 'secondary'; // neutral/gray
  };

  const getSentimentIcon = (sentiment: string) => {
    if (!sentiment) return <Minus className="h-4 w-4" />;
    const s = sentiment.toLowerCase();
    if (s.includes('positive') || s === 'bullish') return <TrendingUp className="h-4 w-4" />;
    if (s.includes('negative') || s === 'bearish') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getSentimentLabel = (sentiment: string) => {
    if (!sentiment) return 'Trung lập';
    const s = sentiment.toLowerCase();
    if (s.includes('positive') || s === 'bullish') return 'Tích cực';
    if (s.includes('negative') || s === 'bearish') return 'Tiêu cực';
    return 'Trung lập';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card id="news-section" className="border-2 border-primary/20 shadow-[var(--shadow-card)] animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <span>{title}</span>
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
                {t.analyze.button.refresh || 'Refresh'}
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
                <ProBadge serviceType="news_analysis" showTooltip={false} />
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
            {t.analyze.emptyState.replace('{{section}}', title)}
          </div>
        ) : (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  {newsItems!.length} bài viết
                </p>
                {/* Sentiment Legend */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>Tích cực</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Minus className="h-3 w-3" />
                    <span>Trung lập</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="h-3 w-3" />
                    <span>Tiêu cực</span>
                  </div>
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              {/* User Tip */}
              <Alert className="mb-4 border-primary/30 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <span className="font-semibold">💡 Mẹo:</span> Di chuột qua tiêu đề để xem nội dung chi tiết tin tức
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border border-border overflow-hidden">
                <TooltipProvider>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/60 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Tiêu đề</th>
                          <th className="px-3 py-2 text-left font-semibold whitespace-nowrap w-32">Ngày</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap w-24">Xu hướng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newsItems!.map((item, idx) => {
                          const title = item?.Title || item?.title || '';
                          const snippet = item?.Snippet || item?.snippet || '';
                          const content = item?.Content || item?.content || '';
                          const url = item?.Url || item?.url || item?.link || '';
                          const date = item?.Date || item?.date || item?.['Published at'] || item?.published_at || '';
                          const sentiment = item?.Sentiment || item?.sentiment || '';

                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                              <td className="px-3 py-2 align-top">
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    {url ? (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline font-medium flex items-center gap-1 group"
                                      >
                                        <span className="line-clamp-2">{title}</span>
                                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                      </a>
                                    ) : (
                                      <span className="line-clamp-2">{title}</span>
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-md p-3">
                                    <div className="space-y-2">
                                      <p className="font-semibold text-sm">{title}</p>
                                      {snippet && (
                                        <div>
                                          <p className="text-xs text-muted-foreground font-semibold">Snippet:</p>
                                          <p className="text-xs">{snippet}</p>
                                        </div>
                                      )}
                                      {content && (
                                        <div>
                                          <p className="text-xs text-muted-foreground font-semibold">Content:</p>
                                          <p className="text-xs line-clamp-3">{content}</p>
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                              <td className="px-3 py-2 align-top whitespace-nowrap">
                                <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
                              </td>
                              <td className="px-3 py-2 align-top">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                      <div className={`
                                        ${getSentimentColor(sentiment) === 'default' ? 'text-green-600' : ''}
                                        ${getSentimentColor(sentiment) === 'destructive' ? 'text-red-600' : ''}
                                        ${getSentimentColor(sentiment) === 'secondary' ? 'text-muted-foreground' : ''}
                                      `}>
                                        {getSentimentIcon(sentiment)}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{getSentimentLabel(sentiment)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </TooltipProvider>
                {newsItems && newsItems.length > 0 && (
                  <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                    {t.supportService?.previewNote
                      ?.replace('{{shown}}', String(newsItems.length))
                      .replace('{{total}}', String(newsItems.length)) ||
                      `Showing ${newsItems.length} news articles.`}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
