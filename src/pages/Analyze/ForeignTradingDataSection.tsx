import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface ForeignTradingDataSectionProps {
  title: string;
  data: any;
  onAnalyze?: () => void;
  analyzeButtonText?: string;
  isAnalyzing?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function ForeignTradingDataSection({
  title,
  data,
  onAnalyze,
  analyzeButtonText,
  isAnalyzing = false,
  isLoading = false,
  onRefresh,
}: ForeignTradingDataSectionProps) {
  const { t } = useLanguage();

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
    <Card className="border-2 border-primary/20 shadow-[var(--shadow-card)] animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
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
            {t.analyze.emptyState.replace('{{section}}', title)}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <TooltipProvider>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Ngày</th>
                      <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">KL GD Ròng</th>
                      <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">GT GD Ròng</th>
                      <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Thay đổi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradingItems!.map((item, idx) => {
                      const ngay = item?.Ngay || item?.ngay || '-';
                      const klGDRong = item?.KLGDRong || item?.kl_gd_rong || '-';
                      const gtGDRong = item?.GTDGRong || item?.gt_gd_rong || '-';
                      const thayDoi = item?.ThayDoi || item?.thay_doi || '-';
                      const klMua = item?.KLMua || item?.kl_mua || '-';
                      const gtMua = item?.GtMua || item?.gt_mua || '-';
                      const klBan = item?.KLBan || item?.kl_ban || '-';
                      const gtBan = item?.GtBan || item?.gt_ban || '-';
                      const roomConLai = item?.RoomConLai || item?.room_con_lai || '-';
                      const dangSoHuu = item?.DangnSoHuu || item?.dang_so_huu || '-';

                      const isPositive = typeof klGDRong === 'number' ? klGDRong > 0 : parseFloat(klGDRong) > 0;
                      const isNegative = typeof klGDRong === 'number' ? klGDRong < 0 : parseFloat(klGDRong) < 0;

                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                          <td className="px-3 py-2 align-top">
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <div className="cursor-help hover:text-primary transition-colors">
                                  <span className="font-medium">{formatDate(ngay)}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-md p-4">
                                <div className="space-y-3">
                                  <div className="border-b pb-2">
                                    <p className="font-bold text-sm">Giao dịch ngày {formatDate(ngay)}</p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <p className="text-muted-foreground font-semibold">KL Mua:</p>
                                        <p className="text-green-600 font-semibold">{formatNumber(klMua)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">GT Mua:</p>
                                        <p className="text-green-600 font-semibold">{formatNumber(gtMua)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">KL Bán:</p>
                                        <p className="text-red-600 font-semibold">{formatNumber(klBan)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">GT Bán:</p>
                                        <p className="text-red-600 font-semibold">{formatNumber(gtBan)}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-t pt-2 space-y-2">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <p className="text-muted-foreground font-semibold">KL GD Ròng:</p>
                                        <p className={`font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''}`}>
                                          {formatNumber(klGDRong)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">GT GD Ròng:</p>
                                        <p className={`font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''}`}>
                                          {formatNumber(gtGDRong)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">Thay đổi:</p>
                                        <p className="font-semibold">{thayDoi}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">Room còn lại:</p>
                                        <p className="font-semibold text-primary">{formatNumber(roomConLai)}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-muted-foreground font-semibold">Đang sở hữu:</p>
                                        <p className="font-semibold">{formatNumber(dangSoHuu)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <span className={`font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''}`}>
                              {formatNumber(klGDRong)}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <span className={`font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''}`}>
                              {formatNumber(gtGDRong)}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <span className="font-medium">{thayDoi}</span>
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
                  `Showing ${tradingItems.length} foreign trading records.`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
