import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Target, History, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import AnalyzePanel from '@/pages/Analyze/NewAnalyze';

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
        {/* Header Section */}
        <div className="text-center space-y-2 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            {t.analyze.title}
          </h2>
          <p className="text-muted-foreground text-lg">{t.analyze.description}</p>
        </div>
      </section>

      <section ref={analyzeSectionRef} id="analyze">
        <AnalyzePanel />
      </section>
    </div>
  );
};

export default Index;
