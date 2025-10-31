import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Clock, ChevronDown, ChevronUp, Info } from 'lucide-react';
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

interface MatchPriceDataSectionProps {
  title: string;
  data: any;
  onAnalyze?: () => void;
  analyzeButtonText?: string;
  isAnalyzing?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function MatchPriceDataSection({
  title,
  data,
  onAnalyze,
  analyzeButtonText,
  isAnalyzing = false,
  isLoading = false,
  onRefresh,
}: MatchPriceDataSectionProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);

  const matchItems = useMemo(() => {
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
          'match_data',
          'items',
          'list',
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

    // Try to parse data.data if it's a string
    let parsedData = data;
    if (data?.data && typeof data.data === 'string') {
      const parsed = tryParse(data.data);
      if (parsed) {
        parsedData = { ...data, data: parsed };
      }
    }

    // Try to extract array from various possible structures
    const candidates = [
      parsedData?.data?.data,
      parsedData?.data,
      parsedData?.data?.Data,
      parsedData?.Data
    ];
    for (const candidate of candidates) {
      const arr = extractArray(candidate);
      if (arr && arr.length > 0) {
        const flattened = Array.isArray(arr[0]) ? arr.flat() : arr;
        return flattened.filter((item) => item !== null && item !== undefined);
      }
    }

    return null;
  }, [data]);

  const aggregates = useMemo(() => {
    if (!data) return null;

    const tryParse = (value: any) => {
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    };

    // Try to parse data.data if it's a string
    let parsedData = data;
    if (data?.data && typeof data.data === 'string') {
      const parsed = tryParse(data.data);
      if (parsed) {
        parsedData = { ...data, data: parsed };
      }
    }

    // Extract aggregates
    const agg = parsedData?.data?.aggregates || parsedData?.aggregates;
    if (Array.isArray(agg) && agg.length > 0) {
      return agg;
    }

    return null;
  }, [data]);

  const isEmpty = !data || !matchItems || matchItems.length === 0;

  const formatNumber = (value: any) => {
    if (value === null || value === undefined || value === '' || value === '-') return '-';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('vi-VN');
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    // Format time from "HH:MM:SS" or similar
    return timeStr;
  };

  const formatPrice = (value: any) => {
    if (value === null || value === undefined || value === '' || value === '-') return '-';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="border-2 border-primary/20 shadow-[var(--shadow-card)] animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
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
                <ProBadge serviceType="intraday_match_analysis" showTooltip={false} />
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
              <p className="text-sm text-muted-foreground">
                {matchItems!.length} giao dịch khớp
              </p>
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
                  <span className="font-semibold">💡 Mẹo:</span> Di chuột qua từng dòng để xem chi tiết giao dịch
                </AlertDescription>
              </Alert>

              {/* Aggregates Section */}
              {aggregates && aggregates.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary"></span>
                    Tổng hợp theo giá
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {aggregates.map((agg: any, idx: number) => {
                      const price = agg?.price || '-';
                      const totalVolume = agg?.totalVolume || agg?.total_volume || 0;
                      const volPercent = agg?.volPercent || agg?.vol_percent || 0;

                      return (
                        <div
                          key={idx}
                          className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-2.5 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-medium">Giá</span>
                              <span className="text-xl font-bold text-primary">{formatPrice(price)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Tổng KL</span>
                              <span className="text-sm font-semibold">{formatNumber(totalVolume)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Tỷ lệ</span>
                              <span className="text-sm font-semibold text-accent">{volPercent.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Match Data Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <TooltipProvider>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/60 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Thời gian</th>
                          <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Giá khớp</th>
                          <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">KL khớp</th>
                          <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Thay đổi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchItems!.map((item, idx) => {
                          const tradeDate = item?.tradeDate || item?.trade_date || item?.time || '-';
                          const price = item?.price || item?.Price || '-';
                          const volume = item?.volume || item?.Volume || '-';
                          const totalVolume = item?.totalVolume || item?.total_volume || '-';
                          const totalValue = item?.totalValue || item?.total_value || '-';
                          const basicPrice = item?.basicPrice || item?.basic_price || '-';
                          const symbol = item?.symbol || item?.Symbol || '';

                          // Calculate change
                          let changePercent = 0;
                          let changeValue = 0;
                          if (price !== '-' && basicPrice !== '-') {
                            const priceNum = typeof price === 'number' ? price : parseFloat(price);
                            const basicNum = typeof basicPrice === 'number' ? basicPrice : parseFloat(basicPrice);
                            if (!isNaN(priceNum) && !isNaN(basicNum) && basicNum !== 0) {
                              changeValue = priceNum - basicNum;
                              changePercent = (changeValue / basicNum) * 100;
                            }
                          }

                          const isPositive = changeValue > 0;
                          const isNegative = changeValue < 0;

                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                              <td className="px-3 py-2 align-top">
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help hover:text-primary transition-colors">
                                      <span className="font-medium">{formatTime(tradeDate)}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-md p-4">
                                    <div className="space-y-3">
                                      <div className="border-b pb-2">
                                        <p className="font-bold text-sm">Chi tiết giao dịch</p>
                                        <p className="text-xs text-muted-foreground">{formatTime(tradeDate)}</p>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                          {symbol && (
                                            <div className="col-span-2">
                                              <p className="text-muted-foreground font-semibold">Mã CK:</p>
                                              <p className="font-semibold">{symbol}</p>
                                            </div>
                                          )}
                                          <div>
                                            <p className="text-muted-foreground font-semibold">Giá tham chiếu:</p>
                                            <p className="font-semibold">{formatPrice(basicPrice)}</p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground font-semibold">Giá khớp:</p>
                                            <p className={`font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-yellow-600'}`}>
                                              {formatPrice(price)}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground font-semibold">KL khớp lệnh này:</p>
                                            <p className="font-semibold">{formatNumber(volume)}</p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground font-semibold">Tổng KL khớp:</p>
                                            <p className="font-semibold">{formatNumber(totalVolume)}</p>
                                          </div>
                                          <div className="col-span-2">
                                            <p className="text-muted-foreground font-semibold">Tổng GT khớp:</p>
                                            <p className="font-semibold">{formatNumber(totalValue)}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                              <td className="px-3 py-2 align-top text-right">
                                <span className={`font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {formatPrice(price)}
                                </span>
                              </td>
                              <td className="px-3 py-2 align-top text-right">
                                <span className="font-medium">{formatNumber(volume)}</span>
                              </td>
                              <td className="px-3 py-2 align-top text-right">
                                {changePercent !== 0 ? (
                                  <div className="flex flex-col items-end">
                                    <span className={`font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''}`}>
                                      {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                                    </span>
                                    <span className={`text-xs ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''}`}>
                                      ({isPositive ? '+' : ''}{formatPrice(changeValue)})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-yellow-600 font-semibold">TC</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </TooltipProvider>
                {matchItems && matchItems.length > 0 && (
                  <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                    {t.supportService?.previewNote
                      ?.replace('{{shown}}', String(matchItems.length))
                      .replace('{{total}}', String(matchItems.length)) ||
                      `Showing ${matchItems.length} match records.`}
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
