import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProBadge } from '@/components/ProBadge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProprietaryTradingDataSectionProps {
  title: string;
  data: any;
  onAnalyze?: () => void;
  analyzeButtonText?: string;
  isAnalyzing?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function ProprietaryTradingDataSection({
  title,
  data,
  onAnalyze,
  analyzeButtonText,
  isAnalyzing = false,
  isLoading = false,
  onRefresh,
}: ProprietaryTradingDataSectionProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);

  const tradingItems = useMemo(() => {
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
          'ListDataTudoanh',
          'ListDataTuDoanh',
          'list_data',
          'records',
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

    // First, try to parse the data.data field if it's a JSON string
    let parsedData = data;
    if (data?.data && typeof data.data === 'string') {
      const parsed = tryParse(data.data);
      if (parsed) {
        parsedData = { ...data, data: parsed };
      }
    }

    // Handle direct array response
    if (Array.isArray(parsedData)) {
      return parsedData.filter((item) => item !== null && item !== undefined);
    }

    const candidates = [parsedData, parsedData?.data, parsedData?.data?.Data, parsedData?.Data];
    for (const candidate of candidates) {
      const arr = extractArray(candidate);
      if (arr && arr.length > 0) {
        const flattened = Array.isArray(arr[0]) ? arr.flat() : arr;
        return flattened.filter((item) => item !== null && item !== undefined);
      }
    }

    return null;
  }, [data]);

  const isEmpty = !data || !tradingItems || tradingItems.length === 0;

  const formatNumber = (value: any) => {
    if (!value || value === '-') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr || dateStr === '-') return '-';
    
    // Handle Microsoft JSON date format: /Date(1756314000000)/
    const msDateMatch = String(dateStr).match(/\/Date\((\d+)\)\//);
    if (msDateMatch) {
      const timestamp = parseInt(msDateMatch[1], 10);
      const date = new Date(timestamp);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }
    
    // Handle regular date string
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      }
    } catch {
      // If parsing fails, return original value
    }
    
    return dateStr;
  };

  return (
    <Card id="proprietary-section" className="border-2 border-primary/20 shadow-[var(--shadow-card)] animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
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
                <ProBadge serviceType="proprietary_trading_analysis" showTooltip={false} />
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
                {tradingItems!.length} records
              </p>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <TooltipProvider>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Ngày</th>
                      <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">KL Mua</th>
                      <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">KL Bán</th>
                      <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">GT Ròng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradingItems!.map((item, idx) => {
                      const symbol = item?.Symbol || item?.symbol || '-';
                      const date = item?.Date || item?.date || '-';
                      const klcpMua = item?.KLcpMua || item?.klcp_mua || '-';
                      const klcpBan = item?.KlcpBan || item?.klcp_ban || '-';
                      const gtMua = item?.GtMua || item?.gt_mua || '-';
                      const gtBan = item?.GtBan || item?.gt_ban || '-';

                      // Calculate net value
                      const gtMuaNum = typeof gtMua === 'number' ? gtMua : parseFloat(gtMua) || 0;
                      const gtBanNum = typeof gtBan === 'number' ? gtBan : parseFloat(gtBan) || 0;
                      const gtRong = gtMuaNum - gtBanNum;
                      const isPositive = gtRong > 0;
                      const isNegative = gtRong < 0;

                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                          <td className="px-3 py-2 align-top">
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <div className="cursor-help hover:text-primary transition-colors">
                                  <span className="font-medium">{formatDate(date)}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-md p-4">
                                <div className="space-y-3">
                                  <div className="border-b pb-2">
                                    <p className="font-bold text-sm">Giao dịch tự doanh - {formatDate(date)}</p>
                                    <p className="text-xs text-muted-foreground">Mã: {symbol}</p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <p className="text-muted-foreground font-semibold">KL CP Mua:</p>
                                        <p className="text-green-600 font-semibold">{formatNumber(klcpMua)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">GT Mua:</p>
                                        <p className="text-green-600 font-semibold">{formatNumber(gtMua)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">KL CP Bán:</p>
                                        <p className="text-red-600 font-semibold">{formatNumber(klcpBan)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">GT Bán:</p>
                                        <p className="text-red-600 font-semibold">{formatNumber(gtBan)}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-t pt-2">
                                    <div className="text-xs">
                                      <p className="text-muted-foreground font-semibold">Giá trị ròng:</p>
                                      <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''}`}>
                                        {formatNumber(gtRong)}
                                      </p>
                                      <p className="text-muted-foreground text-xs mt-1">
                                        {isPositive ? '📈 Mua ròng' : isNegative ? '📉 Bán ròng' : '➖ Cân bằng'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <span className="font-medium text-green-600">
                              {formatNumber(klcpMua)}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <span className="font-medium text-red-600">
                              {formatNumber(klcpBan)}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <span className={`font-bold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''}`}>
                              {formatNumber(gtRong)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TooltipProvider>
            {tradingItems && tradingItems.length > 0 && (
              <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                {t.supportService?.previewNote
                  ?.replace('{{shown}}', String(tradingItems.length))
                  .replace('{{total}}', String(tradingItems.length)) ||
                  `Showing ${tradingItems.length} proprietary trading records.`}
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
