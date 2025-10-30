import { useState } from 'react';
import { Menu, X, Activity, Newspaper, TrendingUp, Users, Building2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function SectionNav() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const sections = [
    { id: 'technical-signals-section', label: t.analyze.cafefSections.technicalSignals, icon: Activity },
    { id: 'news-section', label: t.analyze.cafefSections.news, icon: Newspaper },
    { id: 'proprietary-section', label: t.analyze.cafefSections.proprietaryTrading, icon: TrendingUp },
    { id: 'foreign-section', label: t.analyze.cafefSections.foreignTrading, icon: Building2 },
    { id: 'shareholder-section', label: t.analyze.cafefSections.shareholderTrading, icon: Users },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
      <div
        className="relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Menu Button */}
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {/* Navigation Menu */}
        {isOpen && (
          <div className="absolute left-16 top-0 bg-card border-2 border-primary/20 rounded-lg shadow-xl p-2 min-w-[240px] animate-fade-in">
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-primary/10 transition-colors text-left"
                  >
                    <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="line-clamp-1">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
