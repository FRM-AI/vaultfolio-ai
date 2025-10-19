import { PieChart, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

const portfolioData = [
  { symbol: 'VNM', allocation: 25, color: 'bg-blue-500' },
  { symbol: 'VCB', allocation: 30, color: 'bg-green-500' },
  { symbol: 'HPG', allocation: 20, color: 'bg-yellow-500' },
  { symbol: 'VHM', allocation: 25, color: 'bg-purple-500' },
];

export default function Optimize() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.optimize.title}</h1>
        <p className="text-muted-foreground">{t.optimize.description}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              {t.optimize.currentPortfolio}
            </CardTitle>
            <CardDescription>Phân bổ hiện tại của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {portfolioData.map((item) => (
              <div key={item.symbol} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">{item.symbol}</span>
                  <span className="text-muted-foreground">{item.allocation}%</span>
                </div>
                <Progress value={item.allocation} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {t.optimize.suggestion}
            </CardTitle>
            <CardDescription>AI khuyến nghị</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t.optimize.riskLevel}</p>
                <p className="text-lg font-bold text-foreground">Trung bình</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t.optimize.expectedReturn}</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <p className="text-lg font-bold text-success">+18.5%</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
