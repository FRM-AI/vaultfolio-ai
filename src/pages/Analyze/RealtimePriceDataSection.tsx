import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface RealtimePriceDataSectionProps {
  title: string;
  data: any;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function RealtimePriceDataSection({
  title,
  data,
  isLoading = false,
  onRefresh,
}: RealtimePriceDataSectionProps) {
  const { t } = useLanguage();

  const priceData = useMemo(() => {
    if (!data) return null;

    const tryParse = (value: any) => {
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    };

    // First, try to parse the data.data field if it's a JSON string
    let parsedData = data;
    if (data?.data && typeof data.data === 'string') {
      const parsed = tryParse(data.data);
      if (parsed) {
        parsedData = { ...data, data: parsed };
      }
    }

    // Extract the actual data object - handle nested structure
    // Response structure: { success, symbol, data: { succeeded, data: { value: {...} } } }
    let actualData = parsedData?.data?.data?.value || parsedData?.data?.value || parsedData?.data || parsedData;
    
    // If it's an object (not array), return it
    if (actualData && typeof actualData === 'object' && !Array.isArray(actualData)) {
      return actualData;
    }

    return null;
  }, [data]);

  const isEmpty = !data || !priceData;

  const formatNumber = (value: any) => {
    if (!value || value === '-') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatPrice = (value: any) => {
    if (!value || value === '-') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr || dateStr === '-') return '-';
    
    // Handle Microsoft JSON date format: /Date(1756314000000)/
    const msDateMatch = String(dateStr).match(/\/Date\((\d+)\)\//);
    if (msDateMatch) {
      const timestamp = parseInt(msDateMatch[1], 10);
      const date = new Date(timestamp);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    // Handle regular date string
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // If parsing fails, return original value
    }
    
    return dateStr;
  };

  const getPriceColor = (price: any, refPrice: any) => {
    if (!price || !refPrice) return '';
    const priceNum = parseFloat(price);
    const refNum = parseFloat(refPrice);
    if (isNaN(priceNum) || isNaN(refNum)) return '';
    
    if (priceNum > refNum) return 'text-green-600';
    if (priceNum < refNum) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getPriceChange = (price: any, refPrice: any) => {
    if (!price || !refPrice) return { value: '-', percent: '-' };
    const priceNum = parseFloat(price);
    const refNum = parseFloat(refPrice);
    if (isNaN(priceNum) || isNaN(refNum) || refNum === 0) return { value: '-', percent: '-' };
    
    const change = priceNum - refNum;
    const changePercent = (change / refNum) * 100;
    const sign = change > 0 ? '+' : '';
    
    return {
      value: `${sign}${formatPrice(change)}`,
      percent: `${sign}${changePercent.toFixed(2)}%`,
    };
  };

  if (isEmpty) {
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
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>{t.analyze.loadingData}</span>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t.analyze.emptyState.replace('{{section}}', title)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const symbol = priceData.symbol || priceData.Symbol || '-';
  const price = priceData.price || priceData.Price || '-';
  const refPrice = priceData.refPrice || priceData.RefPrice || '-';
  const volume = priceData.volume || priceData.Volume || '-';
  const value = priceData.value || priceData.Value || '-';
  const highPrice = priceData.highPrice || priceData.HighPrice || '-';
  const lowPrice = priceData.lowPrice || priceData.LowPrice || '-';
  const change = getPriceChange(price, refPrice);
  const priceColorClass = getPriceColor(price, refPrice);

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
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{t.analyze.loadingData}</span>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="cursor-help rounded-lg border-2 border-border bg-gradient-to-br from-background to-muted/20 p-6 hover:border-primary/50 transition-all">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Symbol and Price */}
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-sm text-muted-foreground mb-1">Mã CP</p>
                      <p className="text-2xl font-bold text-primary">{symbol}</p>
                    </div>
                    
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-sm text-muted-foreground mb-1">Giá hiện tại</p>
                      <p className={`text-3xl font-bold ${priceColorClass}`}>
                        {formatPrice(price)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={priceColorClass.includes('green') ? 'default' : priceColorClass.includes('red') ? 'destructive' : 'secondary'} className="text-xs">
                          {change.value}
                        </Badge>
                        <span className={`text-xs font-medium ${priceColorClass}`}>
                          {change.percent}
                        </span>
                      </div>
                    </div>

                    {/* Volume and Value */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Khối lượng</p>
                      <p className="text-lg font-semibold">{formatNumber(volume)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Giá trị</p>
                      <p className="text-lg font-semibold">{formatNumber(value)}</p>
                    </div>

                    {/* High and Low */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Giá cao</p>
                      <p className="text-lg font-semibold text-green-600">{formatPrice(highPrice)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Giá thấp</p>
                      <p className="text-lg font-semibold text-red-600">{formatPrice(lowPrice)}</p>
                    </div>

                    {/* Reference Price */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Giá tham chiếu</p>
                      <p className="text-lg font-semibold text-yellow-600">{formatPrice(refPrice)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
                      <Badge variant="outline" className="text-sm">
                        💡 Hover để xem chi tiết
                      </Badge>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-2xl p-4">
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <p className="font-bold text-base">{symbol} - Thông tin chi tiết</p>
                    <p className="text-xs text-muted-foreground">
                      Cập nhật: {formatDate(priceData.lastTradeDate || priceData.LastTradeDate)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Price Info */}
                    <div className="col-span-3 border-b pb-3">
                      <p className="text-xs font-bold text-muted-foreground mb-2">THÔNG TIN GIÁ</p>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Giá mở cửa:</p>
                          <p className="font-semibold">{formatPrice(priceData.openPrice || priceData.OpenPrice)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Giá đóng cửa:</p>
                          <p className="font-semibold">{formatPrice(priceData.closePrice || priceData.ClosePrice)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Giá TB:</p>
                          <p className="font-semibold">{formatPrice(priceData.avgPrice || priceData.AvgPrice)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Giá trần:</p>
                          <p className="font-semibold text-purple-600">{formatPrice(priceData.ceilingPrice || priceData.CeilingPrice)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Giá sàn:</p>
                          <p className="font-semibold text-blue-600">{formatPrice(priceData.floorPrice || priceData.FloorPrice)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Giá TC:</p>
                          <p className="font-semibold text-yellow-600">{formatPrice(priceData.refPrice || priceData.RefPrice)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Volume/Value Info */}
                    <div className="col-span-3 border-b pb-3">
                      <p className="text-xs font-bold text-muted-foreground mb-2">KHỐI LƯỢNG & GIÁ TRỊ</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">KL khớp lệnh:</p>
                          <p className="font-semibold">{formatNumber(priceData.volume || priceData.Volume)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">GT khớp lệnh:</p>
                          <p className="font-semibold">{formatNumber(priceData.value || priceData.Value)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">KL thỏa thuận:</p>
                          <p className="font-semibold">{formatNumber(priceData.volumeCenter || priceData.VolumeCenter)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">GT thỏa thuận:</p>
                          <p className="font-semibold">{formatNumber(priceData.valueCenter || priceData.ValueCenter)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bid/Ask Info */}
                    <div className="col-span-3 border-b pb-3">
                      <p className="text-xs font-bold text-muted-foreground mb-2">MUA/BÁN</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-green-600 mb-2">Giá mua (Bid)</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">G1:</span>
                              <span className="font-medium">{formatPrice(priceData.bidPrice01 || priceData.BidPrice01)} ({formatNumber(priceData.bidVolume01 || priceData.BidVolume01)})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">G2:</span>
                              <span className="font-medium">{formatPrice(priceData.bidPrice02 || priceData.BidPrice02)} ({formatNumber(priceData.bidVolume02 || priceData.BidVolume02)})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">G3:</span>
                              <span className="font-medium">{formatPrice(priceData.bidPrice03 || priceData.BidPrice03)} ({formatNumber(priceData.bidVolume03 || priceData.BidVolume03)})</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t">
                              <span className="text-muted-foreground">Tổng:</span>
                              <span className="font-semibold">{formatNumber(priceData.bidTotalVolume || priceData.BidTotalVolume)} ({formatNumber(priceData.bidTotalOrder || priceData.BidTotalOrder)} lệnh)</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-red-600 mb-2">Giá bán (Ask)</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">G1:</span>
                              <span className="font-medium">{formatPrice(priceData.askPrice01 || priceData.AskPrice01)} ({formatNumber(priceData.askVolume01 || priceData.AskVolume01)})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">G2:</span>
                              <span className="font-medium">{formatPrice(priceData.askPrice02 || priceData.AskPrice02)} ({formatNumber(priceData.askVolume02 || priceData.AskVolume02)})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">G3:</span>
                              <span className="font-medium">{formatPrice(priceData.askPrice03 || priceData.AskPrice03)} ({formatNumber(priceData.askVolume03 || priceData.AskVolume03)})</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t">
                              <span className="text-muted-foreground">Tổng:</span>
                              <span className="font-semibold">{formatNumber(priceData.askTotalVolume || priceData.AskTotalVolume)} ({formatNumber(priceData.askTotalOrder || priceData.AskTotalOrder)} lệnh)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Foreign Trading Info */}
                    <div className="col-span-3">
                      <p className="text-xs font-bold text-muted-foreground mb-2">GIAO DỊCH NƯỚC NGOÀI</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">KL mua:</p>
                          <p className="font-semibold text-green-600">{formatNumber(priceData.foreignBuyVolume || priceData.ForeignBuyVolume)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">GT mua:</p>
                          <p className="font-semibold text-green-600">{formatNumber(priceData.foreignBuyValue || priceData.ForeignBuyValue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">KL bán:</p>
                          <p className="font-semibold text-red-600">{formatNumber(priceData.foreignSellVolume || priceData.ForeignSellVolume)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">GT bán:</p>
                          <p className="font-semibold text-red-600">{formatNumber(priceData.foreignSellValue || priceData.ForeignSellValue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">KL ròng:</p>
                          <p className="font-semibold text-primary">{formatNumber(priceData.foreignNetVolume || priceData.ForeignNetVolume)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Room hiện tại:</p>
                          <p className="font-semibold">{formatNumber(priceData.foreignCurrentRoom || priceData.ForeignCurrentRoom)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Room tổng:</p>
                          <p className="font-semibold">{formatNumber(priceData.foreignTotalRoom || priceData.ForeignTotalRoom)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
