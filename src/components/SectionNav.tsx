import { useState, useEffect } from 'react';
import { Menu, X, Activity, Newspaper, TrendingUp, Users, Building2, Download, History, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InsightsHistoryService, InsightHistoryItem, AnalysisType } from '@/lib/Endpoint/InsightsHistory.service';
import { Badge } from '@/components/ui/badge';

export function SectionNav() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<InsightHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  const sections = [
    { id: 'technical-signals-section', label: t.analyze.cafefSections.technicalSignals, icon: Activity },
    { id: 'news-section', label: t.analyze.cafefSections.news, icon: Newspaper },
    { id: 'proprietary-section', label: t.analyze.cafefSections.proprietaryTrading, icon: TrendingUp },
    { id: 'foreign-section', label: t.analyze.cafefSections.foreignTrading, icon: Building2 },
    { id: 'shareholder-section', label: t.analyze.cafefSections.shareholderTrading, icon: Users },
  ];

  const analysisTypeLabels: Record<AnalysisType, string> = {
    technical_analysis: t.analyze.aiAnalyzeButtons.technicalAnalysis,
    news_analysis: t.analyze.aiAnalyzeButtons.newsAnalysis,
    proprietary_trading_analysis: t.analyze.aiAnalyzeButtons.proprietaryAnalysis,
    foreign_trading_analysis: t.analyze.aiAnalyzeButtons.foreignAnalysis,
    shareholder_trading_analysis: t.analyze.aiAnalyzeButtons.shareholderAnalysis,
    intraday_match_analysis: t.analyze.aiAnalyzeButtons.matchPriceAnalysis,
  };

  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await InsightsHistoryService.getInsightsHistory({ limit: 50 });
      setHistoryItems(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await InsightsHistoryService.deleteInsight(id);
      setHistoryItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  };

  const handleNewAnalyze = () => {
    setShowSaveNotification(true);
  };

  const handleConfirmNewAnalyze = () => {
    setShowSaveNotification(false);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false);
    }
  };

  const handleDownloadReport = () => {
    // Get the current page content
    const pageContent = document.querySelector('.space-y-8');
    if (!pageContent) return;

    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get all the data sections
    const title = document.querySelector('h2')?.textContent || 'Analysis Report';
    const searchValue = (document.querySelector('input[type="text"]') as HTMLInputElement)?.value || '';
    
    // Build the report content
    let reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title} - ${searchValue}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
              line-height: 1.6;
              color: #333;
            }
            h1 { 
              color: #1a73e8; 
              border-bottom: 3px solid #1a73e8;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            h2 { 
              color: #444; 
              margin-top: 30px;
              border-bottom: 2px solid #ddd;
              padding-bottom: 5px;
            }
            h3 { 
              color: #666;
              margin-top: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 14px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #fafafa;
            }
            .positive { color: #16a34a; font-weight: bold; }
            .negative { color: #dc2626; font-weight: bold; }
            .neutral { color: #666; }
            .metadata {
              background: #f0f7ff;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="metadata">
            <h1>${title}</h1>
            <p><strong>Symbol:</strong> ${searchValue || 'N/A'}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          </div>
          <button onclick="window.print()" style="padding: 10px 20px; background: #1a73e8; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">Print/Download PDF</button>
    `;

    // Extract all card sections
    const cards = pageContent.querySelectorAll('.border-2.border-primary\\/20');
    cards.forEach((card) => {
      const cardTitle = card.querySelector('h3, [class*="CardTitle"]')?.textContent?.trim();
      if (cardTitle) {
        reportHTML += `<h2>${cardTitle}</h2>`;
      }

      // Extract tables
      const tables = card.querySelectorAll('table');
      tables.forEach((table) => {
        const clonedTable = table.cloneNode(true) as HTMLElement;
        
        // Clean up interactive elements
        clonedTable.querySelectorAll('button, svg').forEach(el => el.remove());
        
        reportHTML += clonedTable.outerHTML;
      });

      // Extract AI analysis content
      const aiContent = card.querySelector('.prose, [class*="markdown"]');
      if (aiContent) {
        reportHTML += `<div class="ai-analysis">${aiContent.innerHTML}</div>`;
      }
    });

    reportHTML += `
        </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
  };

  return (
    <TooltipProvider>
      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setShowHistory(false)}>
          <div 
            className="fixed left-0 top-0 h-full w-80 bg-card border-r-2 border-primary/20 shadow-2xl animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-primary/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    {t.analyze.history.title}
                  </h3>
                  <Button size="icon" variant="ghost" onClick={() => setShowHistory(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary-glow"
                  onClick={handleNewAnalyze}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {t.nav.newAnalyze}
                </Button>
              </div>

              {/* History List */}
              <ScrollArea className="flex-1 p-4">
                {isLoadingHistory ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t.analyze.button.loading}
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t.analyze.history.empty}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {historyItems.map((item) => (
                      <div
                        key={item.id}
                        className="group p-3 rounded-lg border border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                        onClick={() => {
                          // Navigate to view the analysis
                          setShowHistory(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs font-semibold">
                                {item.ticker}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(item.created_at)}
                              </span>
                            </div>
                            <p className="text-sm font-medium truncate">
                              {analysisTypeLabels[item.analysis_type as AnalysisType]}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {item.content.substring(0, 100)}...
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHistory(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      )}

      {/* Save Notification Dialog */}
      <AlertDialog open={showSaveNotification} onOpenChange={setShowSaveNotification}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.nav.saveAnalysisTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.nav.saveAnalysisMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleConfirmNewAnalyze}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {/* History Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 transition-all"
              onClick={() => setShowHistory(true)}
            >
              <History className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-sm">{t.analyze.history.title}</p>
          </TooltipContent>
        </Tooltip>

        {/* Download Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all"
              onClick={handleDownloadReport}
            >
              <Download className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-sm">Tải báo cáo</p>
          </TooltipContent>
        </Tooltip>

        {/* Navigation Menu */}
        <div
          className="relative"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
        {/* Navigation Menu */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 bg-card border-2 border-primary/20 rounded-lg shadow-xl p-2 min-w-[240px] animate-fade-in">
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
        
        {/* Menu Button */}
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>
    </div>
    </TooltipProvider>
  );
}
