import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { History, Loader2, Trash2, FileText, Plus } from 'lucide-react';
import { InsightsHistoryService, InsightHistoryItem } from '@/lib/Endpoint/InsightsHistory.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

interface HistoryListProps {
  collapsed?: boolean;
}

const ANALYSIS_TYPE_LABELS: Record<string, { en: string; vi: string }> = {
  technical_analysis: { en: 'Technical', vi: 'Kỹ thuật' },
  news_analysis: { en: 'News', vi: 'Tin tức' },
  proprietary_trading_analysis: { en: 'Proprietary', vi: 'Tự doanh' },
  foreign_trading_analysis: { en: 'Foreign', vi: 'Khối ngoại' },
  shareholder_trading_analysis: { en: 'Shareholder', vi: 'Cổ đông' },
  intraday_match_analysis: { en: 'Intraday', vi: 'Trong ngày' },
};

const formatDate = (dateStr: string, t: any) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return t?.nav?.today || 'Today';
  if (days === 1) return t?.nav?.yesterday || 'Yesterday';
  if (days < 7) return t?.nav?.thisWeek || 'This Week';
  return t?.nav?.older || 'Older';
};

const groupHistoryByDate = (history: InsightHistoryItem[], t: any) => {
  const groups: Record<string, InsightHistoryItem[]> = {
    [t?.nav?.today || 'Today']: [],
    [t?.nav?.yesterday || 'Yesterday']: [],
    [t?.nav?.thisWeek || 'This Week']: [],
    [t?.nav?.older || 'Older']: [],
  };

  history.forEach((item) => {
    const group = formatDate(item.created_at, t);
    if (groups[group]) {
      groups[group].push(item);
    }
  });

  return Object.entries(groups).filter(([_, items]) => items.length > 0);
};

export function HistoryList({ collapsed = false }: HistoryListProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [history, setHistory] = useState<InsightHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showNewAnalyzeDialog, setShowNewAnalyzeDialog] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await InsightsHistoryService.getInsightsHistory({ limit: 100 });
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await InsightsHistoryService.deleteInsight(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting insight:', error);
    }
  };

  const handleNewAnalyze = () => {
    setShowNewAnalyzeDialog(true);
  };

  const confirmNewAnalyze = () => {
    setShowNewAnalyzeDialog(false);
    navigate('/');
  };

  const getAnalysisTypeLabel = (type: string) => {
    const label = ANALYSIS_TYPE_LABELS[type];
    if (!label) return type;
    return language === 'vi' ? label.vi : label.en;
  };

  // Safety check for translations
  if (!t || !t.nav) {
    return null;
  }

  if (collapsed) {
    return (
      <div className="space-y-2 px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewAnalyze}
          className="w-full h-10 hover:bg-primary/10"
          title={t.nav.newAnalyze}
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-10"
          title={t.nav.historyList}
        >
          <History className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  const groupedHistory = groupHistoryByDate(history, t);

  return (
    <div className="space-y-4 px-2 flex-1 overflow-hidden flex flex-col">
      {/* New Analyze Button */}
      <Button
        variant="outline"
        onClick={handleNewAnalyze}
        className="w-full justify-start gap-2 border-primary/30 hover:bg-primary/10"
      >
        <Plus className="h-4 w-4" />
        {t.nav.newAnalyze}
      </Button>

      {/* History List */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 px-2 text-sm font-semibold text-muted-foreground">
          <History className="h-4 w-4" />
          <span>{t.nav.historyList}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t.nav.noHistory}</p>
        ) : (
          <div className="space-y-4">
            {groupedHistory.map(([group, items]) => (
              <div key={group} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1">{group}</div>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex items-center gap-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                  >
                    <NavLink
                      to={`/analyze/${item.id}`}
                      className={({ isActive }) =>
                        cn(
                          'flex-1 flex items-start gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                          isActive && 'bg-primary/10 text-primary'
                        )
                      }
                    >
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {item.ticker} - {getAnalysisTypeLabel(item.analysis_type)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </NavLink>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteId(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 rounded transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this analysis? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Analyze Confirmation Dialog */}
      <AlertDialog open={showNewAnalyzeDialog} onOpenChange={setShowNewAnalyzeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.nav.saveAnalysisTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.nav.saveAnalysisMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNewAnalyze}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
