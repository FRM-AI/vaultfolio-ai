import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartData {
  symbol: string;
  market_info: {
    name: string;
    currency: string;
  };
  chart_data: ChartDataPoint[];
  summary: {
    latest_price: number;
    price_change: number;
    price_change_percent: number;
    volume: number;
  };
}

interface StockChartProps {
  data: StockChartData;
}

export const StockChart = ({ data }: StockChartProps) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const chartData = data.chart_data.map(point => ({
    time: point.time,
    price: point.close,
    volume: point.volume,
    date: formatDate(point.time)
  }));

  const isPositive = data.summary.price_change >= 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">{data.symbol}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{data.market_info.name}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">
              {formatPrice(data.summary.latest_price)} {data.market_info.currency}
            </p>
            <div className={`flex items-center gap-2 justify-end mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              <span className="font-semibold">
                {isPositive ? '+' : ''}{formatPrice(data.summary.price_change)} ({data.summary.price_change_percent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs text-muted-foreground"
                  tickLine={false}
                />
                <YAxis 
                  className="text-xs text-muted-foreground"
                  tickFormatter={formatPrice}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [formatPrice(value), 'Giá']}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">Khối lượng</p>
              <p className="text-lg font-semibold text-foreground">{formatPrice(data.summary.volume)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng số điểm dữ liệu</p>
              <p className="text-lg font-semibold text-foreground">{data.chart_data.length}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
