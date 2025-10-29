import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  GetShareholder,
  GetPriceHistory,
  GetForeignTrading,
  GetProprietaryTrading,
  GetMatchPrice,
  GetrealtimePrice,
  GetCompanyInfo,
  GetLeadership,
  GetSubsidiaries,
  GetFinancialReports,
  GetCompanyProfile,
  GetFinanceData,
  GetGlobalIndices
} from '@/pages/SupportService/Cafe.service';

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

  const config = endpointConfig[endpoint];

  const handleFetch = async () => {
    setLoading(true);
    setResult(null);

    try {
      let response;
      
      switch (endpoint) {
        case 'shareholder':
          response = await GetShareholder({
            ticker: symbol,
          });
          break;
        case 'price-history':
          response = await GetPriceHistory({
            ticker: symbol,
          });
          break;
        case 'foreign-trading':
          response = await GetForeignTrading({
            ticker: symbol,
          });
          break;
        case 'proprietary-trading':
          response = await GetProprietaryTrading({
            ticker: symbol,
          });
          break;
        case 'match-price':
          response = await GetMatchPrice({
            ticker: symbol,
          });
          break;
        case 'realtime-price':
          response = await GetrealtimePrice({
            ticker: symbol,
          });
          break;
        case 'company-info':
          response = await GetCompanyInfo({
            ticker: symbol,
          });
          break;
        case 'leadership':
          response = await GetLeadership({
            ticker: symbol,
          });
          break;
        case 'subsidiaries':
          response = await GetSubsidiaries({
            ticker: symbol,
          });
          break;
        case 'financial-reports':
          response = await GetFinancialReports({
            ticker: symbol,
          });
          break;
        case 'company-profile':
          response = await GetCompanyProfile({
            ticker: symbol,
          });
          break;
        case 'finance-data':
          response = await GetFinanceData({
            ticker: symbol,
          });
          break;
        case 'global-indices':
          response = await GetGlobalIndices({
            ticker: symbol,
          });
          break;
      }

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
                <SelectItem value="realtime-price" className="focus:bg-primary/10">Realtime Price</SelectItem>
                <SelectItem value="shareholder" className="focus:bg-primary/10">Shareholder Trading</SelectItem>
                <SelectItem value="price-history" className="focus:bg-primary/10">Price History</SelectItem>
                <SelectItem value="foreign-trading" className="focus:bg-primary/10">Foreign Trading</SelectItem>
                <SelectItem value="proprietary-trading" className="focus:bg-primary/10">Proprietary Trading</SelectItem>
                <SelectItem value="match-price" className="focus:bg-primary/10">Match Price</SelectItem>
                <SelectItem value="company-info" className="focus:bg-primary/10">Company Info</SelectItem>
                <SelectItem value="leadership" className="focus:bg-primary/10">Leadership</SelectItem>
                <SelectItem value="subsidiaries" className="focus:bg-primary/10">Subsidiaries</SelectItem>
                <SelectItem value="financial-reports" className="focus:bg-primary/10">Financial Reports</SelectItem>
                <SelectItem value="company-profile" className="focus:bg-primary/10">Company Profile</SelectItem>
                <SelectItem value="finance-data" className="focus:bg-primary/10">Finance Data</SelectItem>
                <SelectItem value="global-indices" className="focus:bg-primary/10">Global Indices</SelectItem>
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
          <CardContent>
            <pre className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-[600px] text-sm border border-border">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
