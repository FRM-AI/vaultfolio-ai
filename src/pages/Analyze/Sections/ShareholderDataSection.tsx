import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Users, ChevronDown, ChevronUp, Info } from 'lucide-react';
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

interface ShareholderDataSectionProps {
  title: string;
  data: any;
  onAnalyze?: () => void;
  analyzeButtonText?: string;
  isAnalyzing?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function ShareholderDataSection({
  title,
  data,
  onAnalyze,
  analyzeButtonText,
  isAnalyzing = false,
  isLoading = false,
  onRefresh,
}: ShareholderDataSectionProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);

  const shareholderItems = useMemo(() => {
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

  const isEmpty = !data || !shareholderItems || shareholderItems.length === 0;

  const formatNumber = (value: any) => {
    if (!value || value === '-') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatPercent = (value: any) => {
    if (!value || value === '-') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `${num.toFixed(2)}%`;
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
    <Card id="shareholder-section" className="border-2 border-primary/20 shadow-[var(--shadow-card)] animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
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
                <ProBadge serviceType="shareholder_trading_analysis" showTooltip={false} />
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
                {shareholderItems!.length} records
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
                  <span className="font-semibold">💡 Mẹo:</span> Di chuột qua từng giao dịch để xem chi tiết cổ đông
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border border-border overflow-hidden">
                <TooltipProvider>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Người giao dịch</th>
                      <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">KL Mua</th>
                      <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">KL Bán</th>
                      <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Tỷ lệ SH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareholderItems!.map((item, idx) => {
                      const transactionMan = item?.TransactionMan || item?.transaction_man || '';
                      const realBuyVolume = item?.RealBuyVolume || item?.real_buy_volume || '-';
                      const realSellVolume = item?.RealSellVolume || item?.real_sell_volume || '-';
                      const tyLeSoHuu = item?.TyLeSoHuu || item?.ty_le_so_huu || '-';

                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                          <td className="px-3 py-2 align-top">
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <div className="cursor-help hover:text-primary transition-colors">
                                  <span className="font-medium">{transactionMan}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-lg p-4">
                                <div className="space-y-3">
                                  <div className="border-b pb-2">
                                    <p className="font-bold text-sm">{transactionMan}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item?.TransactionManPosition || item?.transaction_man_position || 'N/A'}
                                    </p>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <p className="text-muted-foreground font-semibold">Mã cổ phiếu:</p>
                                      <p>{item?.Stock || item?.stock || '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground font-semibold">Mã cổ đông:</p>
                                      <p>{item?.ShareHolderCode || item?.share_holder_code || '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground font-semibold">ID người nắm giữ:</p>
                                      <p>{item?.HolderID || item?.holder_id || '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground font-semibold">Người liên quan:</p>
                                      <p>{item?.RelatedMan || item?.related_man || '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground font-semibold">Chức vụ liên quan:</p>
                                      <p>{item?.RelatedManPosition || item?.related_man_position || '-'}</p>
                                    </div>
                                  </div>

                                  <div className="border-t pt-2 space-y-2">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <p className="text-muted-foreground font-semibold">KL trước GD:</p>
                                        <p>{formatNumber(item?.VolumeBeforeTransaction || item?.volume_before_transaction)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">KL sau GD:</p>
                                        <p>{formatNumber(item?.VolumeAfterTransaction || item?.volume_after_transaction)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">KL dự kiến mua:</p>
                                        <p>{formatNumber(item?.PlanBuyVolume || item?.plan_buy_volume)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">KL dự kiến bán:</p>
                                        <p>{formatNumber(item?.PlanSellVolume || item?.plan_sell_volume)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">KL thực tế mua:</p>
                                        <p className="text-green-600 font-semibold">{formatNumber(realBuyVolume)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">KL thực tế bán:</p>
                                        <p className="text-red-600 font-semibold">{formatNumber(realSellVolume)}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-t pt-2 space-y-2">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <p className="text-muted-foreground font-semibold">Ngày bắt đầu DK:</p>
                                        <p>{formatDate(item?.PlanBeginDate || item?.plan_begin_date)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">Ngày kết thúc DK:</p>
                                        <p>{formatDate(item?.PlanEndDate || item?.plan_end_date)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">Ngày kết thúc TT:</p>
                                        <p>{formatDate(item?.RealEndDate || item?.real_end_date)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">Ngày công bố:</p>
                                        <p>{formatDate(item?.PublishedDate || item?.published_date)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">Ngày đặt lệnh:</p>
                                        <p>{formatDate(item?.OrderDate || item?.order_date)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground font-semibold">Tỷ lệ sở hữu:</p>
                                        <p className="font-semibold text-primary">{formatPercent(tyLeSoHuu)}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {(item?.TransactionNote || item?.transaction_note) && (
                                    <div className="border-t pt-2">
                                      <p className="text-xs text-muted-foreground font-semibold">Ghi chú:</p>
                                      <p className="text-xs mt-1">{item?.TransactionNote || item?.transaction_note}</p>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <span className={`font-medium ${realBuyVolume !== '-' && parseFloat(realBuyVolume) > 0 ? 'text-green-600' : ''}`}>
                              {formatNumber(realBuyVolume)}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <span className={`font-medium ${realSellVolume !== '-' && parseFloat(realSellVolume) > 0 ? 'text-red-600' : ''}`}>
                              {formatNumber(realSellVolume)}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <span className="font-medium text-primary">
                              {formatPercent(tyLeSoHuu)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TooltipProvider>
            {shareholderItems && shareholderItems.length > 0 && (
              <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                {t.supportService?.previewNote
                  ?.replace('{{shown}}', String(shareholderItems.length))
                  .replace('{{total}}', String(shareholderItems.length)) ||
                  `Showing ${shareholderItems.length} shareholder transactions.`}
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
