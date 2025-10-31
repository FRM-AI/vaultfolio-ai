import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { InsightsHistoryService, InsightHistoryItem } from '@/lib/Endpoint/InsightsHistory.service';
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
import { AIAnalysisPanel } from './AIAnalysisPanel';

const ANALYSIS_TYPE_LABELS: Record<string, { en: string; vi: string }> = {
  technical_analysis: { en: 'Technical Analysis', vi: 'Phân tích kỹ thuật' },
  news_analysis: { en: 'News Analysis', vi: 'Phân tích tin tức' },
  proprietary_trading_analysis: { en: 'Proprietary Trading Analysis', vi: 'Phân tích giao dịch tự doanh' },
  foreign_trading_analysis: { en: 'Foreign Trading Analysis', vi: 'Phân tích giao dịch khối ngoại' },
  shareholder_trading_analysis: { en: 'Shareholder Trading Analysis', vi: 'Phân tích giao dịch cổ đông' },
  intraday_match_analysis: { en: 'Intraday Match Analysis', vi: 'Phân tích khớp lệnh trong ngày' },
};
function normalizeMarkdown(content: string) {
  return content
    .replace(/\r\n/g, '\n') // normalize line endings
    .replace(/[ ]{2,}/g, ' ') // remove excessive spaces
    .replace(/\n\s*\n\s*\|/g, '\n|') // fix table header alignment
    .trim();
}
export default function AnalyzeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [insight, setInsight] = useState<InsightHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const fetchInsight = async () => {
      try {
        setLoading(true);
        const data = await InsightsHistoryService.getInsightById(id);
        setInsight(data);
      } catch (error) {
        console.error('Error fetching insight:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await InsightsHistoryService.deleteInsight(id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting insight:', error);
    }
  };

  const handleDownload = () => {
    if (!insight) return;

    const content = `# ${getAnalysisTypeLabel(insight.analysis_type)} - ${insight.ticker}
    
**Asset Type:** ${insight.asset_type}
**Date:** ${new Date(insight.created_at).toLocaleString()}

---

${insight.content}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${insight.ticker}_${insight.analysis_type}_${new Date(insight.created_at).toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getAnalysisTypeLabel = (type: string) => {
    const label = ANALYSIS_TYPE_LABELS[type];
    if (!label) return type;
    return language === 'vi' ? label.vi : label.en;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Analysis not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {insight.ticker} - {getAnalysisTypeLabel(insight.analysis_type)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(insight.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {insight.asset_type}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Metadata */}
      {insight.metadata && Object.keys(insight.metadata).length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {insight.metadata.date_range && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date Range</p>
                  <p className="text-sm">
                    {insight.metadata.date_range.start} - {insight.metadata.date_range.end}
                  </p>
                </div>
              )}
              {insight.metadata.look_back_days && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Look Back Days</p>
                  <p className="text-sm">{insight.metadata.look_back_days}</p>
                </div>
              )}
              {insight.metadata.generated_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Generated At</p>
                  <p className="text-sm">{new Date(insight.metadata.generated_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <AIAnalysisPanel 
        title="Analysis Content" 
        content={normalizeMarkdown(insight.content)} 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this analysis? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
