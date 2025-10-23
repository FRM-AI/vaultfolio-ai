import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Target, History, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import AnalyzePanel from '@/pages/Analyze/AnalyzePanel';

interface IndexProps {
  autoFocusAnalyze?: boolean;
}

const Index = ({ autoFocusAnalyze = false }: IndexProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const analyzeSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoFocusAnalyze && analyzeSectionRef.current) {
      requestAnimationFrame(() => {
        analyzeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [autoFocusAnalyze]);



  const handleNavigate = (href: string) => {
    if (href === '#analyze') {
      analyzeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    navigate(href);
  };

  return (
    <div className="space-y-10">
      <section className="text-center space-y-4">
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
      </section>

      <section ref={analyzeSectionRef} id="analyze">
        <AnalyzePanel />
      </section>

      {/* <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
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
      </Card> */}
    </div>
  );
};

export default Index;
