import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const mockStocks = [
  { code: 'VNM', name: 'Vinamilk', price: '78,500', change: '+2.3%', positive: true, volume: '1.2M', marketCap: '120T', pe: '18.5' },
  { code: 'VCB', name: 'Vietcombank', price: '92,300', change: '+1.8%', positive: true, volume: '3.5M', marketCap: '450T', pe: '15.2' },
  { code: 'HPG', name: 'Hòa Phát', price: '23,450', change: '-1.2%', positive: false, volume: '8.7M', marketCap: '85T', pe: '12.8' },
  { code: 'VHM', name: 'Vinhomes', price: '65,200', change: '+3.1%', positive: true, volume: '2.1M', marketCap: '280T', pe: '22.3' },
];

export default function Analyze() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.analyze.title}</h1>
        <p className="text-muted-foreground">{t.analyze.description}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={t.analyze.searchPlaceholder}
              className="flex-1"
            />
            <Button className="bg-primary hover:bg-primary/90">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {mockStocks.map((stock) => (
          <Card key={stock.code} className="hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{stock.code}</CardTitle>
                  <CardDescription>{stock.name}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{stock.price} ₫</p>
                  <div className={`flex items-center gap-1 ${stock.positive ? 'text-success' : 'text-destructive'}`}>
                    {stock.positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-semibold">{stock.change}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t.analyze.volume}</p>
                  <p className="font-semibold text-foreground">{stock.volume}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.analyze.marketCap}</p>
                  <p className="font-semibold text-foreground">{stock.marketCap}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.analyze.pe}</p>
                  <p className="font-semibold text-foreground">{stock.pe}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
