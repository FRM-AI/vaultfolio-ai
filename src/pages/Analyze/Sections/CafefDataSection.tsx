import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { ProBadge } from '@/components/ProBadge';
import type { AnalysisServiceType } from '@/components/WalletInfo';

interface CafefDataSectionProps {
  title: string;
  data: any;
  onAnalyze?: () => void;
  analyzeButtonText?: string;
  isAnalyzing?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  serviceType?: AnalysisServiceType;
}

export function CafefDataSection({ 
  title, 
  data, 
  onAnalyze, 
  analyzeButtonText,
  isAnalyzing = false,
  isLoading = false,
  onRefresh,
  serviceType = 'intraday_match_analysis' // default fallback
}: CafefDataSectionProps) {
  const { t } = useLanguage();

  const dataset = useMemo(() => {
    if (!data) return null;

    const tryParse = (value: any) => {
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    };

    const extractArray = (value: any): any[] | null => {
      const parsed = tryParse(value);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') {
        const keysToCheck = [
          'Data',
          'data',
          'match_data',
          'items',
          'list',
          'ListDataTudoanh',
          'ListDataTuDoanh',
          'list_data',
          'records',
        ];
        for (const key of keysToCheck) {
          if (parsed[key] !== undefined) {
            const arr = extractArray(parsed[key]);
            if (arr) return arr;
          }
        }
        const firstArrayValue = Object.values(parsed).find((val) => Array.isArray(tryParse(val)));
        if (firstArrayValue) {
          const arr = extractArray(firstArrayValue);
          if (arr) return arr;
        }
      }
      return null;
    };

    // First, try to parse the data.data field if it's a JSON string
    let parsedData = data;
    if (data?.data && typeof data.data === 'string') {
      const parsed = tryParse(data.data);
      if (parsed) {
        parsedData = { ...data, data: parsed };
      }
    }

    // Handle direct array response (like from getNews)
    if (Array.isArray(parsedData)) {
      return parsedData.filter((item) => item !== null && item !== undefined);
    }

    const candidates = [parsedData, parsedData?.data, parsedData?.data?.Data, parsedData?.Data];
    for (const candidate of candidates) {
      const arr = extractArray(candidate);
      if (arr && arr.length > 0) {
        const flattened = Array.isArray(arr[0]) ? arr.flat() : arr;
        return flattened.filter((item) => item !== null && item !== undefined);
      }
    }

    const valueObject = parsedData?.data?.data?.value ?? parsedData?.data?.value ?? parsedData?.value;
    if (valueObject && typeof valueObject === 'object' && !Array.isArray(valueObject)) {
      return [valueObject];
    }

    if (parsedData?.data && typeof parsedData.data === 'object') {
      const objectEntries = Object.entries(parsedData.data).filter(([, val]) =>
        val && typeof val === 'object' && !Array.isArray(val)
      );
      if (objectEntries.length === 1) {
        const [, singleObject] = objectEntries[0];
        if (singleObject && typeof singleObject === 'object' && !Array.isArray(singleObject)) {
          return [singleObject as Record<string, unknown>];
        }
      }
    }

    return null;
  }, [data]);

  const previewRows = useMemo(() => {
    if (!dataset || dataset.length === 0) return null;
    return dataset.slice(0, 20);
  }, [dataset]);

  const tableHeaders = useMemo(() => {
    if (!previewRows || previewRows.length === 0) return [] as string[];
    const firstRow = previewRows.find((row) => row && typeof row === 'object' && !Array.isArray(row));
    if (firstRow && typeof firstRow === 'object') {
      return Object.keys(firstRow as Record<string, unknown>);
    }
    return [] as string[];
  }, [previewRows]);

  const isTabular = tableHeaders.length > 0;
  const isEmpty = !data || !previewRows || previewRows.length === 0;

  return (
    <Card className="border-2 border-primary/20 shadow-[var(--shadow-card)] animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                onClick={onRefresh}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="border-primary/30 hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {t.analyze.button.refresh || 'Refresh'}
              </Button>
            )}
            {onAnalyze && (
              <Button
                onClick={onAnalyze}
                disabled={isAnalyzing || isEmpty}
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 gap-2"
              >
                {isAnalyzing ? t.analyze.button.analyzing : (analyzeButtonText || t.analyze.button.analyze)}
                <ProBadge serviceType={serviceType} showTooltip={false} />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{t.analyze.loadingData}</span>
          </div>
        ) : isEmpty ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.analyze.emptyState.replace('{{section}}', title)}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            {isTabular ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      {tableHeaders.map((header) => (
                        <th key={header} className="px-3 py-2 text-left font-semibold capitalize whitespace-nowrap">
                          {header.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows!.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                        {tableHeaders.map((header) => (
                          <td key={header} className="px-3 py-2 align-top whitespace-nowrap">
                            {row && typeof row === 'object' && !Array.isArray(row)
                              ? String((row as Record<string, unknown>)[header] ?? '')
                              : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-2 p-3 text-sm">
                {previewRows!.map((value, idx) => (
                  <div key={idx} className="rounded-md border border-border bg-background px-3 py-2">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </div>
                ))}
              </div>
            )}
            {dataset && previewRows && dataset.length > previewRows.length && (
              <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                {t.supportService?.previewNote
                  ?.replace('{{shown}}', String(previewRows.length))
                  .replace('{{total}}', String(dataset.length)) ||
                  `Showing ${previewRows.length} of ${dataset.length} records.`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
