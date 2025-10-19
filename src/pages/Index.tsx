import { useNavigate } from 'react-router-dom';
import { BarChart3, Target, History, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    {
      icon: BarChart3,
      title: t.nav.analyze,
      description: 'Phân tích cổ phiếu với AI',
      href: '/analyze',
      color: 'text-blue-500',
    },
    {
      icon: Target,
      title: t.nav.optimize,
      description: 'Tối ưu danh mục đầu tư',
      href: '/optimize',
      color: 'text-green-500',
    },
    {
      icon: History,
      title: t.nav.history,
      description: 'Theo dõi lịch sử giao dịch',
      href: '/history',
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI-Powered Analysis</span>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          {t.app.title}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t.app.subtitle}
        </p>
        <div className="pt-4">
          <Button size="lg" onClick={() => navigate('/login')} className="shadow-lg">
            Đăng nhập / Sign In
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary/50"
            onClick={() => navigate(feature.href)}
          >
            <CardHeader>
              <div className={`h-12 w-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                Khám phá →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Thị trường hôm nay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">VN-Index</p>
              <p className="text-2xl font-bold text-foreground">1,245.67</p>
              <p className="text-sm text-success">+2.3%</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">HNX-Index</p>
              <p className="text-2xl font-bold text-foreground">234.12</p>
              <p className="text-sm text-success">+1.8%</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">UPCOM</p>
              <p className="text-2xl font-bold text-foreground">89.45</p>
              <p className="text-sm text-destructive">-0.5%</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Khối lượng</p>
              <p className="text-2xl font-bold text-foreground">456M</p>
              <p className="text-sm text-muted-foreground">Cổ phiếu</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
