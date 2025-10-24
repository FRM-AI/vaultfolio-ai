import { PieChart, Target, TrendingUp, Search, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { OptimizeService } from './Optimize.service';
import { Badge } from '@/components/ui/badge';
import { STOCK_SUGGESTIONS } from '@/constants/stocks';

type OptimizeResponse = {
  success: boolean;
  expected_return: number; // decimal, multiply by 100 for %
  annual_volatility: number; // decimal, multiply by 100 for %
  sharpe_ratio: number;
  weights: Record<string, number>; // symbol -> weight (0..1)
  allocation: Record<string, number>; // symbol -> quantity (shares)
  latest_prices: Record<string, number>; // symbol -> price (VND)
  leftover: number; // VND
  total_investment: number; // VND
  metadata?: {
    optimization_date?: string;
    date_range?: { start?: string; end?: string };
    symbols_count?: number;
    authenticated?: boolean;
  };
};

export default function Optimize() {
  const { t } = useLanguage();
  const [symbols, setSymbols] = useState<string[]>(['']);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [openSuggestIndex, setOpenSuggestIndex] = useState<number | null>(null);

  const SUPPORTED_CODES = new Set(STOCK_SUGGESTIONS.map((s) => s.code.toUpperCase()));
  const isSupported = (code: string) => SUPPORTED_CODES.has(code.trim().toUpperCase());
  const anyUnsupported = symbols.some((s) => s.trim() !== '' && !isSupported(s));

  const getFiltered = (query: string) => {
    const q = query.trim().toUpperCase();
    if (!q) return STOCK_SUGGESTIONS.slice(0, 8);
    return STOCK_SUGGESTIONS.filter(
      (s) => s.code.startsWith(q) || s.name.toUpperCase().includes(q)
    ).slice(0, 8);
  };

  const addSymbol = () => {
    setSymbols([...symbols, '']);
  };

  const removeSymbol = (index: number) => {
    setSymbols(symbols.filter((_, i) => i !== index));
  };

  const updateSymbol = (index: number, value: string) => {
    const newSymbols = [...symbols];
    newSymbols[index] = value.toUpperCase();
    setSymbols(newSymbols);
  };

  const handleOptimize = async () => {
    const validSymbols = symbols.filter((s) => s.trim() !== '' && isSupported(s));
    if (validSymbols.length === 0 || !investmentAmount) return;

    setIsLoading(true);
    try {
      const response = (await OptimizeService.optimize({
        symbols: validSymbols,
        investment_amount: parseFloat(investmentAmount),
      })) as unknown as OptimizeResponse;
      setResult(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.optimize.title}</h1>
        <p className="text-muted-foreground">{t.optimize.description}</p>
      </div>

      <Card className="shadow-lg border-primary/20">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">{t.optimize.form?.symbolsLabel ?? "Mã cổ phiếu"}</label>
            {symbols.map((symbol, index) => (
              <div key={index} className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder={t.optimize.form?.symbolPlaceholder ?? "VD: VCB, BID, CTG..."}
                    className={`h-11 w-full ${symbol && !isSupported(symbol) ? 'border-destructive' : ''}`}
                    value={symbol}
                    onFocus={() => setOpenSuggestIndex(index)}
                    onBlur={() => setTimeout(() => setOpenSuggestIndex((prev) => (prev === index ? null : prev)), 120)}
                    onChange={(e) => updateSymbol(index, e.target.value)}
                    disabled={isLoading}
                  />

                  {openSuggestIndex === index && (
                    <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-lg">
                      <ul className="py-2">
                        {getFiltered(symbol).map((stock) => (
                          <li key={stock.code}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                updateSymbol(index, stock.code);
                                setOpenSuggestIndex(null);
                              }}
                            >
                              <span className="font-semibold text-foreground">{stock.code}</span>
                              <span className="text-xs text-muted-foreground">{stock.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {symbol && !isSupported(symbol) && (
                    <p className="mt-1 text-xs text-destructive">{t?.chart?.errors?.invalidSymbol ?? 'Vui lòng nhập mã hợp lệ'}</p>
                  )}
                </div>

                {symbols.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => removeSymbol(index)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={addSymbol}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.optimize.form?.addSymbol ?? "Thêm mã cổ phiếu"}
            </Button>
          </div>

        

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t.optimize.form?.amountLabel ?? "Số tiền đầu tư (VND)"}</label>
            <Input
              type="number"
              placeholder={t.optimize.form?.amountPlaceholder ?? "VD: 1000000000"}
              className="h-11"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button 
            className="w-full bg-primary hover:bg-primary/90 h-11" 
            onClick={handleOptimize}
            disabled={
              isLoading ||
              symbols.filter((s) => s.trim()).length === 0 ||
              !investmentAmount ||
              anyUnsupported
            }
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? (t.optimize.form?.loading ?? "Đang tối ưu hóa...") : (t.optimize.form?.submit ?? "Tối ưu hóa danh mục")}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                {t.optimize.result?.allocationTitle ?? "Phân bổ tối ưu"}
              </CardTitle>
              <CardDescription>{t.optimize.result?.allocationDescription ?? "Tỷ trọng đề xuất cho từng mã"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(result.weights || {}).map(([symbol, weight]) => {
                const qty = result.allocation?.[symbol] ?? 0;
                const price = result.latest_prices?.[symbol] ?? 0;
                const value = qty * price;
                return (
                  <div key={symbol} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-foreground">{symbol}</span>
                      <span className="text-muted-foreground">{(weight * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={weight * 100} className="h-2" />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{t.optimize.result?.qtyLabel ?? "Số lượng"}: <strong className="text-foreground">{qty.toLocaleString('vi-VN')}</strong></span>
                      <span>{t.optimize.result?.priceLabel ?? "Giá"}: <strong className="text-foreground">{price.toLocaleString('vi-VN')}</strong> VND</span>
                      <span>{t.optimize.result?.estValueLabel ?? "Giá trị ước tính"}: <strong className="text-foreground">{value.toLocaleString('vi-VN')}</strong> VND</span>
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-md bg-background/50 border">
                  <span className="text-sm text-muted-foreground">{t.optimize.result?.totalInvestment ?? "Tổng vốn"}</span>
                  <span className="text-sm font-semibold text-foreground">{result.total_investment.toLocaleString('vi-VN')} VND</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-background/50 border">
                  <span className="text-sm text-muted-foreground">{t.optimize.result?.leftover ?? "Tiền thừa"}</span>
                  <Badge variant="secondary" className="font-semibold">
                    {result.leftover.toLocaleString('vi-VN')} VND
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {t.optimize.result?.metricsTitle ?? "Kết quả tối ưu"}
              </CardTitle>
              <CardDescription>{t.optimize.result?.metricsDesc ?? "Hiệu suất danh mục dự kiến"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{t.optimize.result?.expectedReturn ?? "Lợi nhuận kỳ vọng"}</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <p className="text-lg font-bold text-success">
                      {((result.expected_return || 0) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{t.optimize.result?.risk ?? "Rủi ro"}</p>
                  <p className="text-lg font-bold text-foreground">
                    {((result.annual_volatility || 0) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{t.optimize.result?.sharpeRatio ?? "Sharpe Ratio"}</p>
                  <p className="text-lg font-bold text-foreground">
                    {Number.isFinite(result.sharpe_ratio) ? result.sharpe_ratio.toFixed(2) : 'N/A'}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
