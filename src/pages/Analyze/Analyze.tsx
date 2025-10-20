import { Search, TrendingUp, BarChart3, Newspaper, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnalyzeService } from './Analyze.service';
import { useRef, useState } from "react";
import { StockChart } from '@/components/StockChart';
// const mockStocks = [
//   { code: 'VNM', name: 'Vinamilk', price: '78,500', change: '+2.3%', positive: true, volume: '1.2M', marketCap: '120T', pe: '18.5' },
//   { code: 'VCB', name: 'Vietcombank', price: '92,300', change: '+1.8%', positive: true, volume: '3.5M', marketCap: '450T', pe: '15.2' },
//   { code: 'HPG', name: 'Hòa Phát', price: '23,450', change: '-1.2%', positive: false, volume: '8.7M', marketCap: '85T', pe: '12.8' },
//   { code: 'VHM', name: 'Vinhomes', price: '65,200', change: '+3.1%', positive: true, volume: '2.1M', marketCap: '280T', pe: '22.3' },
// ];
type SectionKey = "technical_analysis" | "news_analysis" | "combined_analysis";

export default function Analyze() {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState<{ stockCode: string; days: string; assetType: string }>({
    stockCode: '',
    days: '',
    assetType: "stock",
  });
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [sections, setSections] = useState<Record<SectionKey, string>>({
    technical_analysis: "",
    news_analysis: "",
    combined_analysis: "",
  });
  const [chartData, setChartData] = useState<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    if (!searchValue.stockCode) return;

    // reset
    setIsLoading(true);
    setStatus("Đang tải biểu đồ...");
    setProgress(0);
    setSections({ technical_analysis: "", news_analysis: "", combined_analysis: "" });
    setChartData(null);

    // abort an existing stream if any
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Step 1: Fetch chart data first
      setStatus("Đang tải biểu đồ...");
      const response = await AnalyzeService.chartData(searchValue.stockCode.trim().toUpperCase(), searchValue.assetType);
      if (response) {
        setChartData(response);
      }

      // Step 2: Run analysis after chart is loaded
      setStatus("Đang phân tích...");
      const stream = AnalyzeService.insights(
        {
          ticker: searchValue.stockCode.trim().toUpperCase(),
          look_back_days: Number.parseInt(searchValue.days || "30", 10),
        },
        { signal: controller.signal }
      );

      for await (const evt of stream) {
        // evt shapes based on your backend:
        // { type: 'metadata' | 'status' | 'section_start' | 'content' | 'section_end' | 'complete', ... }

        if (evt.type === "status") {
          setStatus(evt.message ?? "");
          if (typeof evt.progress === "number") setProgress(evt.progress);
        }

        if (evt.type === "content") {
          const key = evt.section as SectionKey;
          const text = evt.text ?? "";
          setSections((prev) => ({ ...prev, [key]: (prev[key] || "") + text }));
        }

        if (evt.type === "complete") {
          setProgress(evt.progress ?? 100);
          setStatus(evt.message ?? "Hoàn tất");
        }
      }
    } catch (e) {
      console.error(e);
      setStatus("Có lỗi xảy ra khi phân tích.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.analyze.title}</h1>
        <p className="text-muted-foreground">{t.analyze.description}</p>
      </div>

      <Card className="shadow-lg border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-3">
              <Input
                type="text"
                placeholder={t.analyze.searchPlaceholder}
                className="flex-1 h-11"
                value={searchValue.stockCode}
                onChange={(e) => setSearchValue({ ...searchValue, stockCode: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
                disabled={isLoading}
              />
              <Input
                type="text"
                placeholder={t.analyze.searchPlaceholder_dates}
                className="w-24 h-11"
                value={searchValue.days}
                onChange={(e) => setSearchValue({ ...searchValue, days: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
                disabled={isLoading}
              />
              <select
                value={searchValue.assetType}
                onChange={(e) => setSearchValue({ ...searchValue, assetType: e.target.value })}
                className="px-3 py-2 h-11 rounded-md border border-input bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <option value="stock">{t.analyze.search_type_1}</option>
                <option value="crypto">{t.analyze.search_type_2}</option>
              </select>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 h-11 px-6" 
              onClick={handleSearch}
              disabled={isLoading || !searchValue.stockCode}
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? "Đang tải..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {status && progress < 100 && (
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{status}</p>
                <Badge variant="secondary">
                  {progress}%
                </Badge>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(progress, 100)}%` }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {chartData && (
        <StockChart data={chartData} />
      )}

      {(sections.technical_analysis || sections.news_analysis || sections.combined_analysis) && (
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <Tabs defaultValue="combined" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="technical" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Kỹ thuật
                </TabsTrigger>
                <TabsTrigger value="news" className="gap-2">
                  <Newspaper className="h-4 w-4" />
                  Tin tức
                </TabsTrigger>
                <TabsTrigger value="combined" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Tổng hợp
                </TabsTrigger>
              </TabsList>

              <TabsContent value="technical" className="mt-0">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-6">
                          <table className="min-w-full divide-y divide-border border border-border rounded-lg" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => (
                        <thead className="bg-muted/50" {...props} />
                      ),
                      th: ({node, ...props}) => (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
                      ),
                      td: ({node, ...props}) => (
                        <td className="px-4 py-3 text-sm text-foreground border-t border-border" {...props} />
                      ),
                    }}
                  >
                    {sections.technical_analysis || "_Chưa có nội dung._"}
                  </ReactMarkdown>
                </div>
              </TabsContent>

              <TabsContent value="news" className="mt-0">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-6">
                          <table className="min-w-full divide-y divide-border border border-border rounded-lg" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => (
                        <thead className="bg-muted/50" {...props} />
                      ),
                      th: ({node, ...props}) => (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
                      ),
                      td: ({node, ...props}) => (
                        <td className="px-4 py-3 text-sm text-foreground border-t border-border" {...props} />
                      ),
                    }}
                  >
                    {sections.news_analysis || "_Chưa có nội dung._"}
                  </ReactMarkdown>
                </div>
              </TabsContent>

              <TabsContent value="combined" className="mt-0">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-6">
                          <table className="min-w-full divide-y divide-border border border-border rounded-lg" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => (
                        <thead className="bg-muted/50" {...props} />
                      ),
                      th: ({node, ...props}) => (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
                      ),
                      td: ({node, ...props}) => (
                        <td className="px-4 py-3 text-sm text-foreground border-t border-border" {...props} />
                      ),
                    }}
                  >
                    {sections.combined_analysis || "_Chưa có nội dung._"}
                  </ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}


      {/* <div className="grid gap-4">
        {mockStocks.map((stock) => (
          <Card key={stock.code} className="hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{stock.code}</CardTitle>
                  <CardDescription>{stock.name}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{stock.price} ₫</p>
                  <div className={`flex items-center gap-1 ${stock.positive ? 'text-success' : 'text-destructive'}`}>
                    {stock.positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-semibold">{stock.change}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t.analyze.volume}</p>
                  <p className="font-semibold text-foreground">{stock.volume}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.analyze.marketCap}</p>
                  <p className="font-semibold text-foreground">{stock.marketCap}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.analyze.pe}</p>
                  <p className="font-semibold text-foreground">{stock.pe}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> */}
    </div>
  );
}
