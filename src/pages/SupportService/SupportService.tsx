import { useEffect, useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { CafeService } from '@/pages/SupportService/Cafe.service';

type EndpointType = 
  | 'shareholder'
  | 'price-history'
  | 'foreign-trading'
  | 'proprietary-trading'
  | 'match-price'
  | 'realtime-price'
  | 'company-info'
  | 'leadership'
  | 'subsidiaries'
  | 'financial-reports'
  | 'company-profile'
  | 'finance-data'
  | 'global-indices';

interface EndpointConfig {
  requiresSymbol: boolean;
  requiresDateRange?: boolean;
  requiresDate?: boolean;
  requiresPagination?: boolean;
  requiresTypeId?: boolean;
  method: string;
}

const endpointConfig: Record<EndpointType, EndpointConfig> = {
  'shareholder': { requiresSymbol: true, requiresDateRange: true, requiresPagination: true, method: 'POST' },
  'price-history': { requiresSymbol: true, requiresDateRange: true, requiresPagination: true, method: 'POST' },
  'foreign-trading': { requiresSymbol: true, requiresDateRange: true, requiresPagination: true, method: 'POST' },
  'proprietary-trading': { requiresSymbol: true, requiresDateRange: true, requiresPagination: true, method: 'POST' },
  'match-price': { requiresSymbol: true, requiresDate: true, method: 'POST' },
  'realtime-price': { requiresSymbol: true, method: 'GET' },
  'company-info': { requiresSymbol: true, method: 'GET' },
  'leadership': { requiresSymbol: true, method: 'GET' },
  'subsidiaries': { requiresSymbol: true, method: 'GET' },
  'financial-reports': { requiresSymbol: true, method: 'GET' },
  'company-profile': { requiresSymbol: true, requiresTypeId: true, requiresPagination: true, method: 'POST' },
  'finance-data': { requiresSymbol: true, method: 'GET' },
  'global-indices': { requiresSymbol: false, method: 'GET' }
};

export default function SupportService() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [endpoint, setEndpoint] = useState<EndpointType>('realtime-price');
  const [symbol, setSymbol] = useState('VCB');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [date, setDate] = useState('2024-01-15');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(14);
  const [typeId, setTypeId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fallbackServiceLabels: Record<EndpointType, string> = {
    'shareholder': 'Major Shareholder Deals',
    'price-history': 'Price History',
    'foreign-trading': 'Foreign Trading',
    'proprietary-trading': 'Proprietary Trading',
    'match-price': 'Match Price',
    'realtime-price': 'Realtime Price',
    'company-info': 'Company Info (HTML)',
    'leadership': 'Leadership (HTML)',
    'subsidiaries': 'Subsidiaries (HTML)',
    'financial-reports': 'Financial Reports (HTML)',
    'company-profile': 'Company Profile (HTML)',
    'finance-data': 'Financial Data',
    'global-indices': 'Global Indices',
  };

  const serviceLabels = t.supportService?.services as Partial<Record<EndpointType, string>> | undefined;
  const getServiceLabel = (key: EndpointType) => serviceLabels?.[key] ?? fallbackServiceLabels[key];

  const config = endpointConfig[endpoint];

  const handleFetch = async () => {
    setLoading(true);
    setResult(null);

    try {
      const payload: Record<string, unknown> = {};

      const normalizedSymbol = symbol.trim().toUpperCase();
      if (config.requiresSymbol && normalizedSymbol) {
        payload.symbol = normalizedSymbol;
      }
      if (config.requiresDateRange) {
        payload.start_date = startDate;
        payload.end_date = endDate;
      }
      if (config.requiresDate) {
        payload.date = date;
      }
      if (config.requiresPagination) {
        payload.page_index = pageIndex;
        payload.page_size = pageSize;
      }
      if (config.requiresTypeId) {
        payload.type_id = typeId;
      }

      const serviceMap: Record<EndpointType, (data: Record<string, unknown>) => Promise<any>> = {
        'shareholder': CafeService.GetShareholder,
        'price-history': CafeService.GetPriceHistory,
        'foreign-trading': CafeService.GetForeignTrading,
        'proprietary-trading': CafeService.GetProprietaryTrading,
        'match-price': CafeService.GetMatchPrice,
        'realtime-price': CafeService.GetrealtimePrice,
        'company-info': CafeService.GetCompanyInfo,
        'leadership': CafeService.GetLeadership,
        'subsidiaries': CafeService.GetSubsidiaries,
        'financial-reports': CafeService.GetFinancialReports,
        'company-profile': CafeService.GetCompanyProfile,
        'finance-data': CafeService.GetFinanceData,
        'global-indices': CafeService.GetGlobalIndices,
      };

      const requestData = endpoint === 'global-indices' ? {} : payload;
      const response = await serviceMap[endpoint](requestData);

      setResult(response);
      toast({
        title: t.supportService.success,
        description: t.supportService.dataLoaded,
      });
    } catch (error: any) {
      console.error('API Error:', error);
      toast({
        title: t.supportService.error,
        description: error?.message || t.supportService.fetchFailed,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const htmlContent = useMemo(() => {
    if (!result) return null;
    if (typeof result === 'string' && result.trim().startsWith('<')) {
      return result;
    }
    if (typeof result?.data === 'string' && result.data.trim().startsWith('<')) {
      return result.data;
    }
    return null;
  }, [result]);

  useEffect(() => {
    if (!htmlContent) {
      setDownloadUrl(null);
      return;
    }

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlContent]);

  const summaryItems = useMemo(() => {
    if (!result || typeof result !== 'object') return [] as Array<{ label: string; value: string | number | boolean }>;

    const convertKeyToLabel = (key: string) =>
      key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (char) => char.toUpperCase());

    const baseKeys = new Set([
      'success',
      'symbol',
      'date',
      'start_date',
      'end_date',
      'page_index',
      'page_size',
      'type_id',
    ]);

    const extractValue = (key: string) => {
      const direct = (result as Record<string, unknown>)[key];
      if (direct !== undefined) return direct;
      if (result.data && typeof result.data === 'object') {
        const nested = (result.data as Record<string, unknown>)[key];
        if (nested !== undefined) return nested;
      }
      return undefined;
    };

    const summaryLabels = t.supportService.resultSummary;
    const labeledPairs: Array<[string, string]> = [
      ['success', summaryLabels.success ?? t.supportService.success],
      ['symbol', summaryLabels.symbol ?? t.supportService.symbol],
      ['date', summaryLabels.date ?? t.supportService.date],
      ['start_date', summaryLabels.startDate ?? t.supportService.startDate],
      ['end_date', summaryLabels.endDate ?? t.supportService.endDate],
      ['page_index', summaryLabels.pageIndex ?? t.supportService.pageIndex],
      ['page_size', summaryLabels.pageSize ?? t.supportService.pageSize],
      ['type_id', summaryLabels.typeId ?? t.supportService.typeId],
    ];

    const items = labeledPairs
      .map(([key, label]) => {
        const value = extractValue(key);
        if (value === undefined || value === null || value === '') return null;
        return { label, value: value as string | number | boolean, key };
      })
      .filter(Boolean) as Array<{ label: string; value: string | number | boolean; key: string }>;

    const includeAdditionalFields = (source: unknown) => {
      if (!source || typeof source !== 'object') return;
      Object.entries(source as Record<string, unknown>)
        .filter(([key, value]) => {
          if (baseKeys.has(key)) return false;
          if (Array.isArray(value)) return false;
          if (value && typeof value === 'object') return false;
          if (value === undefined || value === null || value === '') return false;
          return typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean';
        })
        .forEach(([key, value]) => {
          if (items.some((item) => item.key === key)) return;
          items.push({
            label: convertKeyToLabel(key),
            value: value as string | number | boolean,
            key,
          });
        });
    };

    includeAdditionalFields(result);
    includeAdditionalFields(result.data);

    return items.map(({ label, value }) => ({ label, value }));
  }, [result, t.supportService]);

  const dataset = useMemo(() => {
    if (!result) return null;

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
        const firstArrayValue = Object.values(parsed).find((val) => Array.isArray(tryParse(val))); // best effort for unknown keys
        if (firstArrayValue) {
          const arr = extractArray(firstArrayValue);
          if (arr) return arr;
        }
      }
      return null;
    };

    const candidates = [result, result.data, result?.data?.Data, result?.Data];
    for (const candidate of candidates) {
      const arr = extractArray(candidate);
      if (arr && arr.length > 0) {
        const flattened = Array.isArray(arr[0]) ? arr.flat() : arr;
        return flattened.filter((item) => item !== null && item !== undefined);
      }
    }
    const valueObject = result?.data?.data?.value ?? result?.data?.value ?? result?.value;
    if (valueObject && typeof valueObject === 'object' && !Array.isArray(valueObject)) {
      return [valueObject];
    }

    if (result?.data && typeof result.data === 'object') {
      const objectEntries = Object.entries(result.data).filter(([, val]) =>
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
  }, [result]);

  const previewRows = useMemo(() => {
    if (!dataset || dataset.length === 0) return null;
    return dataset.slice(0, 10);
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

  const previewNoteText = useMemo(() => {
    if (!dataset || !previewRows) return null;
    const template = t.supportService.previewNote;
    if (template) {
      return template
        .replace('{{shown}}', String(previewRows.length))
        .replace('{{total}}', String(dataset.length));
    }
    return `Showing ${previewRows.length} of ${dataset.length} records.`;
  }, [dataset, previewRows, t.supportService.previewNote]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          {t.supportService.title}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t.supportService.description}
        </p>
      </div>

      <Card className="border-2 border-primary/20 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t.supportService.configTitle}
          </CardTitle>
          <CardDescription>{t.supportService.configDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.supportService.endpoint}</Label>
            <Select value={endpoint} onValueChange={(value) => setEndpoint(value as EndpointType)}>
              <SelectTrigger className="bg-background hover:bg-muted/50 border-2 border-primary/20 shadow-[var(--shadow-hover)] transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background backdrop-blur-xl border-2 border-primary/20 shadow-[var(--shadow-hover)]">
                <SelectItem value="realtime-price" className="focus:bg-primary/10">{getServiceLabel('realtime-price')}</SelectItem>
                <SelectItem value="shareholder" className="focus:bg-primary/10">{getServiceLabel('shareholder')}</SelectItem>
                <SelectItem value="price-history" className="focus:bg-primary/10">{getServiceLabel('price-history')}</SelectItem>
                <SelectItem value="foreign-trading" className="focus:bg-primary/10">{getServiceLabel('foreign-trading')}</SelectItem>
                <SelectItem value="proprietary-trading" className="focus:bg-primary/10">{getServiceLabel('proprietary-trading')}</SelectItem>
                <SelectItem value="match-price" className="focus:bg-primary/10">{getServiceLabel('match-price')}</SelectItem>
                <SelectItem value="company-info" className="focus:bg-primary/10">{getServiceLabel('company-info')}</SelectItem>
                <SelectItem value="leadership" className="focus:bg-primary/10">{getServiceLabel('leadership')}</SelectItem>
                <SelectItem value="subsidiaries" className="focus:bg-primary/10">{getServiceLabel('subsidiaries')}</SelectItem>
                <SelectItem value="financial-reports" className="focus:bg-primary/10">{getServiceLabel('financial-reports')}</SelectItem>
                <SelectItem value="company-profile" className="focus:bg-primary/10">{getServiceLabel('company-profile')}</SelectItem>
                <SelectItem value="finance-data" className="focus:bg-primary/10">{getServiceLabel('finance-data')}</SelectItem>
                <SelectItem value="global-indices" className="focus:bg-primary/10">{getServiceLabel('global-indices')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.requiresSymbol && (
            <div className="space-y-2">
              <Label>{t.supportService.symbol}</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="VCB"
                className="bg-background border-2 border-primary/20 focus:border-primary/40"
              />
            </div>
          )}

          {config.requiresDateRange && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.supportService.startDate}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background border-2 border-primary/20 focus:border-primary/40"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.supportService.endDate}</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background border-2 border-primary/20 focus:border-primary/40"
                />
              </div>
            </div>
          )}

          {config.requiresDate && (
            <div className="space-y-2">
              <Label>{t.supportService.date}</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background border-2 border-primary/20 focus:border-primary/40"
              />
            </div>
          )}

          {config.requiresPagination && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.supportService.pageIndex}</Label>
                <Input
                  type="number"
                  value={pageIndex}
                  onChange={(e) => setPageIndex(Number(e.target.value))}
                  min={1}
                  className="bg-background border-2 border-primary/20 focus:border-primary/40"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.supportService.pageSize}</Label>
                <Input
                  type="number"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="bg-background border-2 border-primary/20 focus:border-primary/40"
                />
              </div>
            </div>
          )}

          {config.requiresTypeId && (
            <div className="space-y-2">
              <Label>{t.supportService.typeId}</Label>
              <Input
                type="number"
                value={typeId}
                onChange={(e) => setTypeId(Number(e.target.value))}
                min={1}
                className="bg-background border-2 border-primary/20 focus:border-primary/40"
              />
            </div>
          )}

          <Button
            onClick={handleFetch}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-[var(--shadow-elegant)]"
          >
            {loading ? t.supportService.loading : t.supportService.fetch}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-2 border-primary/20 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>{t.supportService.resultTitle}</CardTitle>
            <CardDescription>{t.supportService.resultDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {htmlContent && downloadUrl && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
                <p className="font-medium text-warning">{t.supportService.htmlNotice ?? 'This endpoint returns an HTML attachment.'}</p>
                <p className="mt-1 text-muted-foreground">
                  {t.supportService.htmlDescription ?? 'Use the button below to download and view the original content.'}
                </p>
                <Button asChild className="mt-3 w-fit" variant="outline">
                  <a href={downloadUrl} download={`${symbol || 'cafef'}-${endpoint}.html`}>
                    {t.supportService.downloadHtml ?? 'Download HTML file'}
                  </a>
                </Button>
              </div>
            )}

            {previewRows && previewRows.length > 0 && (
              <div className="rounded-lg border border-border">
                {isTabular ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/60">
                        <tr>
                          {tableHeaders.map((header) => (
                            <th key={header} className="px-3 py-2 text-left font-semibold capitalize">
                              {header.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                            {tableHeaders.map((header) => (
                              <td key={header} className="px-3 py-2 align-top">
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
                    {previewRows.map((value, idx) => (
                      <div key={idx} className="rounded-md border border-border bg-background px-3 py-2">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    ))}
                  </div>
                )}
                {dataset && previewRows && dataset.length > previewRows.length && (
                  <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                    {previewNoteText ?? `Showing ${previewRows.length} of ${dataset.length} records.`}
                  </p>
                )}
              </div>
            )}

           
          </CardContent>
        </Card>
      )}
    </div>
  );
}
