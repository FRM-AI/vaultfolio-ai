import { PieChart, Target, TrendingUp, Search, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { OptimizeService } from './Optimize.service';
import { Badge } from '@/components/ui/badge';

export default function Optimize() {
  const { t } = useLanguage();
  const [symbols, setSymbols] = useState<string[]>(['']);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

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
    const validSymbols = symbols.filter(s => s.trim() !== '');
    if (validSymbols.length === 0 || !startDate || !endDate || !investmentAmount) return;

    setIsLoading(true);
    try {
      const response = await OptimizeService.optimize({
        symbols: validSymbols,
        start_date: startDate,
        end_date: endDate,
        investment_amount: parseFloat(investmentAmount),
      });
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
            <label className="text-sm font-medium text-foreground">Mã cổ phiếu</label>
            {symbols.map((symbol, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="VD: VCB, BID, CTG..."
                  className="flex-1 h-11"
                  value={symbol}
                  onChange={(e) => updateSymbol(index, e.target.value)}
                  disabled={isLoading}
                />
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
              Thêm mã cổ phiếu
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ngày bắt đầu</label>
              <Input
                type="date"
                className="h-11"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ngày kết thúc</label>
              <Input
                type="date"
                className="h-11"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Số tiền đầu tư (VND)</label>
            <Input
              type="number"
              placeholder="VD: 1000000000"
              className="h-11"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button 
            className="w-full bg-primary hover:bg-primary/90 h-11" 
            onClick={handleOptimize}
            disabled={isLoading || symbols.filter(s => s.trim()).length === 0 || !startDate || !endDate || !investmentAmount}
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? "Đang tối ưu hóa..." : "Tối ưu hóa danh mục"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Phân bổ tối ưu
              </CardTitle>
              <CardDescription>Tỷ trọng đề xuất cho từng mã</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(result.optimization_result?.weights || {}).map(([symbol, weight]: [string, any]) => (
                <div key={symbol} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{symbol}</span>
                    <span className="text-muted-foreground">{(weight * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={weight * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {result.allocation?.[symbol]?.toLocaleString('vi-VN')} VND
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Kết quả tối ưu
              </CardTitle>
              <CardDescription>Hiệu suất danh mục dự kiến</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Lợi nhuận kỳ vọng</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <p className="text-lg font-bold text-success">
                      {((result.optimization_result?.expected_return || 0) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Rủi ro</p>
                  <p className="text-lg font-bold text-foreground">
                    {((result.optimization_result?.risk || 0) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-lg font-bold text-foreground">
                    {result.optimization_result?.sharpe_ratio?.toFixed(2) || 'N/A'}
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
