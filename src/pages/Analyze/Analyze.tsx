import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnalyzeService } from './Analyze.service';
import { useRef, useState } from "react";
const mockStocks = [
  { code: 'VNM', name: 'Vinamilk', price: '78,500', change: '+2.3%', positive: true, volume: '1.2M', marketCap: '120T', pe: '18.5' },
  { code: 'VCB', name: 'Vietcombank', price: '92,300', change: '+1.8%', positive: true, volume: '3.5M', marketCap: '450T', pe: '15.2' },
  { code: 'HPG', name: 'Hòa Phát', price: '23,450', change: '-1.2%', positive: false, volume: '8.7M', marketCap: '85T', pe: '12.8' },
  { code: 'VHM', name: 'Vinhomes', price: '65,200', change: '+3.1%', positive: true, volume: '2.1M', marketCap: '280T', pe: '22.3' },
];
type SectionKey = "technical_analysis" | "news_analysis" | "combined_analysis";

export default function Analyze() {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState<{ stockCode: string; days: string }>({
    stockCode: '',
    days: '',
  });
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [sections, setSections] = useState<Record<SectionKey, string>>({
    technical_analysis: "",
    news_analysis: "",
    combined_analysis: "",
  });
  const abortRef = useRef<AbortController | null>(null);
  const handleSearch = async () => {
    if (!searchValue.stockCode) return;

    // reset
    setStatus("Đang phân tích...");
    setProgress(0);
    setSections({ technical_analysis: "", news_analysis: "", combined_analysis: "" });

    // abort an existing stream if any
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
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
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.analyze.title}</h1>
        <p className="text-muted-foreground">{t.analyze.description}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={t.analyze.searchPlaceholder}
              className="flex-1"
              value={searchValue.stockCode}
              onChange={(e) => setSearchValue({ ...searchValue, stockCode: e.target.value })}
            />
            <Input
              type="text"
              placeholder={t.analyze.searchPlaceholder_dates}
              className="flex-1"
              value={searchValue.days}
              onChange={(e) => setSearchValue({ ...searchValue, days: e.target.value })}
            />
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          {/* status + progress stays as-is */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">{status}</p>
            <div className="h-2 bg-muted rounded mt-2 overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>

          {/* Markdown-rendered sections */}
          <div className="mt-6 grid gap-8">
            <div>
              <h3 className="font-semibold mb-2">Kỹ thuật</h3>
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sections.technical_analysis || "_Chưa có nội dung._"}
                </ReactMarkdown>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Tin tức</h3>
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sections.news_analysis || "_Chưa có nội dung._"}
                </ReactMarkdown>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Tổng hợp</h3>
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sections.combined_analysis || "_Chưa có nội dung._"}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


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
