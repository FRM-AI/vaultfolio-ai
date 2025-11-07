import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnalyzeService } from './Analyze.service';
import { CafeService } from '@/lib/Endpoint/Cafe.service';
import { StockChart } from '@/components/StockChart';
import { CafefDataSection } from './Sections/CafefDataSection';
import { TechnicalSignalsSection } from './Sections/TechnicalSignalsSection';
import { NewsDataSection } from './Sections/NewsDataSection';
import { ShareholderDataSection } from './Sections/ShareholderDataSection';
import { ForeignTradingDataSection } from './Sections/ForeignTradingDataSection';
import { ProprietaryTradingDataSection } from './Sections/ProprietaryTradingDataSection';
import { RealtimePriceDataSection } from './Sections/RealtimePriceDataSection';
import { MatchPriceDataSection } from './Sections/MatchPriceDataSection';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import { SectionNav } from '@/components/SectionNav';
import { STOCK_SUGGESTIONS } from '@/constants/stocks';
import { handleStreaming, type AnalyzeStream } from '@/lib/helper/handle_stream';

const MAX_SUGGESTIONS = 6;
const DEFAULT_NEWS_LOOKBACK_DAYS = 30;

export default function Index() {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);

  // Cafef data states
  const [realtimePrice, setRealtimePrice] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<any>(null);
  const [matchPrice, setMatchPrice] = useState<any>(null);
  const [foreignTrading, setForeignTrading] = useState<any>(null);
  const [proprietaryTrading, setProprietaryTrading] = useState<any>(null);
  const [shareholderTrading, setShareholderTrading] = useState<any>(null);
  const [technicalSignals, setTechnicalSignals] = useState<any>(null);
  const [newsData, setNewsData] = useState<any>(null);

  // AI analysis states
  const [technicalAnalysis, setTechnicalAnalysis] = useState('');
  const [technicalAdvice, setTechnicalAdvice] = useState('');
  const [newsAnalysis, setNewsAnalysis] = useState('');
  const [proprietaryAnalysis, setProprietaryAnalysis] = useState('');
  const [foreignAnalysis, setForeignAnalysis] = useState('');
  const [shareholderAnalysis, setShareholderAnalysis] = useState('');
  const [matchPriceAnalysis, setMatchPriceAnalysis] = useState('');

  // Loading states for individual AI analyses
  const [isAnalyzingTechnical, setIsAnalyzingTechnical] = useState(false);
  const [isAnalyzingNews, setIsAnalyzingNews] = useState(false);
  const [isAnalyzingProprietary, setIsAnalyzingProprietary] = useState(false);
  const [isAnalyzingForeign, setIsAnalyzingForeign] = useState(false);
  const [isAnalyzingShareholder, setIsAnalyzingShareholder] = useState(false);
  const [isAnalyzingMatchPrice, setIsAnalyzingMatchPrice] = useState(false);

  // Date for match price analysis
  const [matchPriceDate, setMatchPriceDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Bought price for technical signals
  const [buyedPrice, setBuyedPrice] = useState<number | undefined>(undefined);

  // Streaming progress and status for technical signals
  const [technicalSignalsProgress, setTechnicalSignalsProgress] = useState(0);
  const [technicalSignalsStatus, setTechnicalSignalsStatus] = useState('');

  // Loading states for data fetching
  const [isLoadingTechnicalSignals, setIsLoadingTechnicalSignals] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isLoadingRealtimePrice, setIsLoadingRealtimePrice] = useState(false);
  const [isLoadingPriceHistory, setIsLoadingPriceHistory] = useState(false);
  const [isLoadingMatchPrice, setIsLoadingMatchPrice] = useState(false);
  const [isLoadingForeignTrading, setIsLoadingForeignTrading] = useState(false);
  const [isLoadingProprietaryTrading, setIsLoadingProprietaryTrading] = useState(false);
  const [isLoadingShareholderTrading, setIsLoadingShareholderTrading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const normalizedQuery = useMemo(() => searchValue.trim().toUpperCase(), [searchValue]);
  const STOCK_CODES = useMemo(() => new Set(STOCK_SUGGESTIONS.map((s) => s.code.toUpperCase())), []);
  const isAllowedSymbol = useMemo(() => {
    if (!normalizedQuery) return false;
    return STOCK_CODES.has(normalizedQuery);
  }, [STOCK_CODES, normalizedQuery]);

  const filteredSuggestions = useMemo(() => {
    if (!normalizedQuery) {
      return STOCK_SUGGESTIONS.slice(0, MAX_SUGGESTIONS);
    }

    const q = normalizedQuery;
    const shortQuery = q.length <= 2;

    const startsWith: typeof STOCK_SUGGESTIONS = [] as any;
    const codeContains: typeof STOCK_SUGGESTIONS = [] as any;
    const nameContains: typeof STOCK_SUGGESTIONS = [] as any;

    for (const s of STOCK_SUGGESTIONS) {
      const code = s.code.toUpperCase();
      const name = s.name.toUpperCase();
      if (code.startsWith(q)) startsWith.push(s);
      else if (!shortQuery && code.includes(q)) codeContains.push(s);
      else if (!shortQuery && name.includes(q)) nameContains.push(s);
    }

    const sortByCode = (a: { code: string }, b: { code: string }) => a.code.localeCompare(b.code);
    startsWith.sort(sortByCode);
    codeContains.sort(sortByCode);
    nameContains.sort(sortByCode);

    const merged = [...startsWith, ...codeContains, ...nameContains];
    const seen = new Set<string>();
    const result: typeof STOCK_SUGGESTIONS = [] as any;
    for (const s of merged) {
      if (seen.has(s.code)) continue;
      seen.add(s.code);
      result.push(s);
      if (result.length >= MAX_SUGGESTIONS) break;
    }

    return result;
  }, [normalizedQuery]);

  const handleSuggestionSelect = useCallback((code: string) => {
    setSearchValue(code);
    setShowSuggestions(false);
  }, []);

  const fetchCafefData = useCallback(async (symbol: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    try {
      // Set all loading states to true
      setIsLoadingTechnicalSignals(true);
      setIsLoadingNews(true);
      setIsLoadingRealtimePrice(true);
      setIsLoadingPriceHistory(true);
      setIsLoadingMatchPrice(true);
      setIsLoadingForeignTrading(true);
      setIsLoadingProprietaryTrading(true);
      setIsLoadingShareholderTrading(true);

      // Fetch news data using streaming (separately)
      let finalNewsData = null;
      try {
        for await (const chunk of AnalyzeService.getNewsStream({
          symbol,
          look_back_days: DEFAULT_NEWS_LOOKBACK_DAYS,
          asset_type: 'stock'
        })) {
          // Only extract the final_data type which contains the actual news array
          if (chunk.type === 'final_data' && chunk.data) {
            finalNewsData = chunk.data;
          }
        }
        setNewsData(finalNewsData);
      } catch (newsError) {
        console.error('Error fetching news stream:', newsError);
        setNewsData(null);
      } finally {
        setIsLoadingNews(false);
      }

      // Fetch technical signals using streaming
      let finalTechnicalSignals = null;
      try {
        setTechnicalSignalsProgress(0);
        setTechnicalSignalsStatus('Loading technical signals...');
        setTechnicalAdvice(''); // Clear previous advice
        
        for await (const chunk of AnalyzeService.getTechnicalSignals(symbol, 'stock', buyedPrice)) {
          // Update progress if available
          if (chunk.type === 'status' && chunk.message) {
            setTechnicalSignalsStatus(chunk.message);
          }
          if (chunk.type === 'status' && typeof chunk.progress === 'number') {
            setTechnicalSignalsProgress(chunk.progress);
          }
          // Extract the metadata which contains the signals data
          if (chunk.type === 'metadata' && chunk.data) {
            finalTechnicalSignals = chunk.data;
          }
          // Handle advice content streaming
          if (chunk.type === 'content' && chunk.section === 'advice' && chunk.text) {
            setTechnicalAdvice((prev) => prev + chunk.text);
          }
          // Also handle final_data type if present
          if (chunk.type === 'final_data' && chunk.data) {
            finalTechnicalSignals = chunk.data;
          }
        }
        setTechnicalSignals(finalTechnicalSignals);
        setTechnicalSignalsProgress(100);
      } catch (technicalError) {
        console.error('Error fetching technical signals stream:', technicalError);
        setTechnicalSignals(null);
      } finally {
        setIsLoadingTechnicalSignals(false);
        setTechnicalSignalsStatus('');
      }

      // Fetch all other Cafef APIs in parallel
      const results = await Promise.allSettled([
        CafeService.GetrealtimePrice({ symbol }),
        CafeService.GetPriceHistory({ symbol, start_date: startDate, end_date: today, page_index: 1, page_size: 30 }),
        CafeService.GetMatchPrice({ symbol, date: matchPriceDate }),
        CafeService.GetForeignTrading({ symbol, start_date: startDate, end_date: today, page_index: 1, page_size: 30 }),
        CafeService.GetProprietaryTrading({ symbol, start_date: startDate, end_date: today, page_index: 1, page_size: 30 }),
        CafeService.GetShareholder({ symbol, start_date: startDate, end_date: today, page_index: 1, page_size: 30 }),
      ]);

      const [
        realtimePriceRes,
        priceHistoryRes,
        matchPriceRes,
        foreignTradingRes,
        proprietaryTradingRes,
        shareholderTradingRes,
      ] = results;
      
      setRealtimePrice(realtimePriceRes.status === 'fulfilled' ? realtimePriceRes.value : null);
      setIsLoadingRealtimePrice(false);
      
      setPriceHistory(priceHistoryRes.status === 'fulfilled' ? priceHistoryRes.value : null);
      setIsLoadingPriceHistory(false);
      
      setMatchPrice(matchPriceRes.status === 'fulfilled' ? matchPriceRes.value : null);
      setIsLoadingMatchPrice(false);
      
      setForeignTrading(foreignTradingRes.status === 'fulfilled' ? foreignTradingRes.value : null);
      setIsLoadingForeignTrading(false);
      
      setProprietaryTrading(proprietaryTradingRes.status === 'fulfilled' ? proprietaryTradingRes.value : null);
      setIsLoadingProprietaryTrading(false);
      
      setShareholderTrading(shareholderTradingRes.status === 'fulfilled' ? shareholderTradingRes.value : null);
      setIsLoadingShareholderTrading(false);
    } catch (error) {
      console.error('Error fetching Cafef data:', error);
      // Reset all loading states on error
      setIsLoadingTechnicalSignals(false);
      setIsLoadingNews(false);
      setIsLoadingRealtimePrice(false);
      setIsLoadingPriceHistory(false);
      setIsLoadingMatchPrice(false);
      setIsLoadingForeignTrading(false);
      setIsLoadingProprietaryTrading(false);
      setIsLoadingShareholderTrading(false);
    }
  }, [matchPriceDate, buyedPrice]);

  const handleSearch = useCallback(async () => {
    if (!normalizedQuery || !isAllowedSymbol) return;

    abortRef.current?.abort();
    abortRef.current = null;
    setShowSuggestions(false);
    setIsLoading(true);
    setProgress(0);
    setStatus(t.analyze.status.loadingData);

    // Clear all data
    setChartData(null);
    setNewsData(null);
    setRealtimePrice(null);
    setPriceHistory(null);
    setMatchPrice(null);
    setForeignTrading(null);
    setProprietaryTrading(null);
    setShareholderTrading(null);
    setTechnicalSignals(null);
    setTechnicalAnalysis('');
    setTechnicalAdvice('');
    setNewsAnalysis('');
    setProprietaryAnalysis('');
    setForeignAnalysis('');
    setShareholderAnalysis('');
    setMatchPriceAnalysis('');

    try {
      // Load chart data
      setStatus(t.analyze.status.loadingChart);
      const chartResponse = await AnalyzeService.chartData(normalizedQuery, 'stock');
      if (chartResponse) {
        setChartData(chartResponse);
      }

      // Fetch all Cafef data
      await fetchCafefData(normalizedQuery);
      
      setStatus(t.analyze.status.complete);
      setProgress(100);
    } catch (error) {
      console.error('Error during search:', error);
      setStatus(t.analyze.status.error);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedQuery, isAllowedSymbol, t, fetchCafefData]);

  const handleTechnicalAnalysis = useCallback(async () => {
    if (!normalizedQuery || isAnalyzingTechnical) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setIsAnalyzingTechnical(true);
    setTechnicalAnalysis('');
    setProgress(0);

    try {
      await handleStreaming({
        stream: AnalyzeService.technicalAnalysisStream,
        payload: { ticker: normalizedQuery, asset_type: 'stock' },
        onContent: (text) => setTechnicalAnalysis((prev) => prev + text),
        onStatus: setStatus,
        onProgress: setProgress,
        onComplete: setStatus,
        abortController: controller,
        completeMessage: t.analyze.status.complete,
      });
    } catch (error) {
      console.error('Error in technical analysis:', error);
    } finally {
      setIsAnalyzingTechnical(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [normalizedQuery, isAnalyzingTechnical, t]);

  const handleNewsAnalysis = useCallback(async () => {
    if (!normalizedQuery || isAnalyzingNews) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setIsAnalyzingNews(true);
    setNewsAnalysis('');
    setProgress(0);

    try {
      await handleStreaming({
        stream: AnalyzeService.newsAnalysisStream,
        payload: { ticker: normalizedQuery, asset_type: 'stock', look_back_days: DEFAULT_NEWS_LOOKBACK_DAYS },
        onContent: (text) => setNewsAnalysis((prev) => prev + text),
        onStatus: setStatus,
        onProgress: setProgress,
        onComplete: setStatus,
        abortController: controller,
        completeMessage: t.analyze.status.complete,
      });
    } catch (error) {
      console.error('Error in news analysis:', error);
    } finally {
      setIsAnalyzingNews(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [normalizedQuery, isAnalyzingNews, t]);

  const handleProprietaryAnalysis = useCallback(async () => {
    if (!normalizedQuery || isAnalyzingProprietary) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setIsAnalyzingProprietary(true);
    setProprietaryAnalysis(''); 
    setProgress(0);

    try {
      await handleStreaming({
        stream: AnalyzeService.proprietaryTradingAnalysisStream,
        payload: { ticker: normalizedQuery },
        onContent: (text) => setProprietaryAnalysis((prev) => prev + text),
        onStatus: setStatus,
        onProgress: setProgress,
        onComplete: setStatus,
        abortController: controller,
        completeMessage: t.analyze.status.complete,
      });
    } catch (error) {
      console.error('Error in proprietary analysis:', error);
    } finally {
      setIsAnalyzingProprietary(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [normalizedQuery, isAnalyzingProprietary, t]);

  const handleForeignAnalysis = useCallback(async () => {
    if (!normalizedQuery || isAnalyzingForeign) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setIsAnalyzingForeign(true);
    setForeignAnalysis('');
    setProgress(0);

    try {
      await handleStreaming({
        stream: AnalyzeService.foreignTradingAnalysisStream,
        payload: { ticker: normalizedQuery },
        onContent: (text) => setForeignAnalysis((prev) => prev + text),
        onStatus: setStatus,
        onProgress: setProgress,
        onComplete: setStatus,
        abortController: controller,
        completeMessage: t.analyze.status.complete,
      });
    } catch (error) {
      console.error('Error in foreign analysis:', error);
    } finally {
      setIsAnalyzingForeign(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [normalizedQuery, isAnalyzingForeign, t]);

  const handleShareholderAnalysis = useCallback(async () => {
    if (!normalizedQuery || isAnalyzingShareholder) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setIsAnalyzingShareholder(true);
    setShareholderAnalysis('');
    setProgress(0);

    try {
      await handleStreaming({
        stream: AnalyzeService.shareholderTradingAnalysisStream,
        payload: { ticker: normalizedQuery },
        onContent: (text) => setShareholderAnalysis((prev) => prev + text),
        onStatus: setStatus,
        onProgress: setProgress,
        onComplete: setStatus,
        abortController: controller,
        completeMessage: t.analyze.status.complete,
      });
    } catch (error) {
      console.error('Error in shareholder analysis:', error);
    } finally {
      setIsAnalyzingShareholder(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [normalizedQuery, isAnalyzingShareholder, t]);

  const handleMatchPriceAnalysis = useCallback(async () => {
    if (!normalizedQuery || isAnalyzingMatchPrice) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setIsAnalyzingMatchPrice(true);
    setMatchPriceAnalysis('');
    setProgress(0);

    try {
      await handleStreaming({
        stream: AnalyzeService.intradayMatchAnalysisStream,
        payload: { ticker: normalizedQuery, date: matchPriceDate },
        onContent: (text) => setMatchPriceAnalysis((prev) => prev + text),
        onStatus: setStatus,
        onProgress: setProgress,
        onComplete: setStatus,
        abortController: controller,
        completeMessage: t.analyze.status.complete,
      });
    } catch (error) {
      console.error('Error in match price analysis:', error);
    } finally {
      setIsAnalyzingMatchPrice(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [normalizedQuery, isAnalyzingMatchPrice, matchPriceDate, t]);

  // Individual refresh functions for each data section
  const refreshTechnicalSignals = useCallback(async () => {
    if (!normalizedQuery || isLoadingTechnicalSignals) return;
    
    setIsLoadingTechnicalSignals(true);
    setTechnicalSignalsProgress(0);
    setTechnicalSignalsStatus('Refreshing technical signals...');
    setTechnicalAdvice(''); // Clear previous advice
    
    let finalTechnicalSignals = null;
    try {
      for await (const chunk of AnalyzeService.getTechnicalSignals(normalizedQuery, 'stock', buyedPrice)) {
        // Update progress if available
        if (chunk.type === 'status' && chunk.message) {
          setTechnicalSignalsStatus(chunk.message);
        }
        if (chunk.type === 'status' && typeof chunk.progress === 'number') {
          setTechnicalSignalsProgress(chunk.progress);
        }
        // Extract the metadata which contains the signals data
        if (chunk.type === 'metadata' && chunk.data) {
          finalTechnicalSignals = chunk.data;
        }
        // Handle advice content streaming
        if (chunk.type === 'content' && chunk.section === 'advice' && chunk.text) {
          setTechnicalAdvice((prev) => prev + chunk.text);
        }
        // Also handle final_data type if present
        if (chunk.type === 'final_data' && chunk.data) {
          finalTechnicalSignals = chunk.data;
        }
      }
      setTechnicalSignals(finalTechnicalSignals);
      setTechnicalSignalsProgress(100);
    } catch (error) {
      console.error('Error refreshing technical signals:', error);
      setTechnicalSignals(null);
    } finally {
      setIsLoadingTechnicalSignals(false);
      setTechnicalSignalsStatus('');
    }
  }, [normalizedQuery, isLoadingTechnicalSignals, buyedPrice]);

  const refreshNews = useCallback(async () => {
    if (!normalizedQuery || isLoadingNews) return;
    
    setIsLoadingNews(true);
    let finalNewsData = null;
    try {
      for await (const chunk of AnalyzeService.getNewsStream({
        symbol: normalizedQuery,
        look_back_days: DEFAULT_NEWS_LOOKBACK_DAYS,
        asset_type: 'stock'
      })) {
        if (chunk.type === 'final_data' && chunk.data) {
          finalNewsData = chunk.data;
        }
      }
      setNewsData(finalNewsData);
    } catch (error) {
      console.error('Error refreshing news:', error);
      setNewsData(null);
    } finally {
      setIsLoadingNews(false);
    }
  }, [normalizedQuery, isLoadingNews]);

  const refreshRealtimePrice = useCallback(async () => {
    if (!normalizedQuery || isLoadingRealtimePrice) return;
    
    setIsLoadingRealtimePrice(true);
    try {
      const result = await CafeService.GetrealtimePrice({ symbol: normalizedQuery });
      setRealtimePrice(result);
    } catch (error) {
      console.error('Error refreshing realtime price:', error);
      setRealtimePrice(null);
    } finally {
      setIsLoadingRealtimePrice(false);
    }
  }, [normalizedQuery, isLoadingRealtimePrice]);

  const refreshPriceHistory = useCallback(async () => {
    if (!normalizedQuery || isLoadingPriceHistory) return;
    
    setIsLoadingPriceHistory(true);
    const today = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    try {
      const result = await CafeService.GetPriceHistory({ 
        symbol: normalizedQuery, 
        start_date: startDate, 
        end_date: today, 
        page_index: 1, 
        page_size: 30 
      });
      setPriceHistory(result);
    } catch (error) {
      console.error('Error refreshing price history:', error);
      setPriceHistory(null);
    } finally {
      setIsLoadingPriceHistory(false);
    }
  }, [normalizedQuery, isLoadingPriceHistory]);

  const refreshMatchPrice = useCallback(async () => {
    if (!normalizedQuery || isLoadingMatchPrice) return;
    
    setIsLoadingMatchPrice(true);
    
    try {
      const result = await CafeService.GetMatchPrice({ symbol: normalizedQuery, date: matchPriceDate });
      setMatchPrice(result);
    } catch (error) {
      console.error('Error refreshing match price:', error);
      setMatchPrice(null);
    } finally {
      setIsLoadingMatchPrice(false);
    }
  }, [normalizedQuery, isLoadingMatchPrice, matchPriceDate]);

  const refreshForeignTrading = useCallback(async () => {
    if (!normalizedQuery || isLoadingForeignTrading) return;
    
    setIsLoadingForeignTrading(true);
    const today = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    try {
      const result = await CafeService.GetForeignTrading({ 
        symbol: normalizedQuery, 
        start_date: startDate, 
        end_date: today, 
        page_index: 1, 
        page_size: 30 
      });
      setForeignTrading(result);
    } catch (error) {
      console.error('Error refreshing foreign trading:', error);
      setForeignTrading(null);
    } finally {
      setIsLoadingForeignTrading(false);
    }
  }, [normalizedQuery, isLoadingForeignTrading]);

  const refreshProprietaryTrading = useCallback(async () => {
    if (!normalizedQuery || isLoadingProprietaryTrading) return;
    
    setIsLoadingProprietaryTrading(true);
    const today = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    try {
      const result = await CafeService.GetProprietaryTrading({ 
        symbol: normalizedQuery, 
        start_date: startDate, 
        end_date: today, 
        page_index: 1, 
        page_size: 30 
      });
      setProprietaryTrading(result);
    } catch (error) {
      console.error('Error refreshing proprietary trading:', error);
      setProprietaryTrading(null);
    } finally {
      setIsLoadingProprietaryTrading(false);
    }
  }, [normalizedQuery, isLoadingProprietaryTrading]);

  const refreshShareholderTrading = useCallback(async () => {
    if (!normalizedQuery || isLoadingShareholderTrading) return;
    
    setIsLoadingShareholderTrading(true);
    const today = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    try {
      const result = await CafeService.GetShareholder({ 
        symbol: normalizedQuery, 
        start_date: startDate, 
        end_date: today, 
        page_index: 1, 
        page_size: 30 
      });
      setShareholderTrading(result);
    } catch (error) {
      console.error('Error refreshing shareholder trading:', error);
      setShareholderTrading(null);
    } finally {
      setIsLoadingShareholderTrading(false);
    }
  }, [normalizedQuery, isLoadingShareholderTrading]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Section Navigation */}
      <SectionNav />

      

      {/* Search Section */}
      <Card className="border-primary/20 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[box-shadow] duration-300 animate-fade-in">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  type="text"
                  placeholder={t.analyze.searchPlaceholder}
                  className="h-12 w-full pl-10 pr-4 border-2 focus:border-primary transition-colors"
                  value={searchValue}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                  onChange={(event) => {
                    const next = event.target.value.toUpperCase();
                    setShowSuggestions(true);
                    setSearchValue(next);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !isLoading && isAllowedSymbol) {
                      setShowSuggestions(false);
                      handleSearch();
                    }
                  }}
                  disabled={isLoading}
                />
              </div>

              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-lg border-2 border-primary/20 bg-background shadow-[var(--shadow-hover)] backdrop-blur-sm animate-scale-in">
                  <ul className="py-2">
                    {filteredSuggestions.map((stock, index) => (
                      <li key={stock.code} style={{ animationDelay: `${index * 30}ms` }} className="animate-fade-in">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-primary/10 group"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestionSelect(stock.code)}
                        >
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {stock.code}
                          </span>
                          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {stock.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button
              className="h-12 px-8 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 shadow-[var(--shadow-glow)] transition-all duration-300 font-semibold"
              onClick={handleSearch}
              disabled={isLoading || !normalizedQuery || !isAllowedSymbol}
            >
              <Search className="h-5 w-5 mr-2" />
              {isLoading ? t.analyze.button.loading : t.analyze.button.search}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      {status && progress < 100 && (
        <Card className="border-primary/30 shadow-[var(--shadow-card)] animate-fade-in">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-sm font-semibold text-foreground">{status}</p>
                </div>
                <Badge variant="secondary" className="text-sm font-bold px-3 py-1">
                  {progress}%
                </Badge>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-accent transition-all duration-500 ease-out shadow-[var(--shadow-glow)]"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Section */}
      {chartData && (
        <div className="animate-fade-in">
          <StockChart data={chartData} />
        </div>
      )}

      {/* Technical Signals Section */}
      <div id="technical-signals-section" className="space-y-4 animate-fade-in">
        <TechnicalSignalsSection
          data={technicalSignals}
          onAnalyze={handleTechnicalAnalysis}
          analyzeButtonText={t.analyze.aiAnalyzeButtons.technicalAnalysis}
          isAnalyzing={isAnalyzingTechnical}
          isLoading={isLoadingTechnicalSignals}
          onRefresh={refreshTechnicalSignals}
          buyedPrice={buyedPrice}
          onBuyedPriceChange={setBuyedPrice}
          streamProgress={technicalSignalsProgress}
          streamStatus={technicalSignalsStatus}
          adviceContent={technicalAdvice}
        />

        {/* Technical Analysis AI Result */}
        {technicalAnalysis && (
          <AIAnalysisPanel title={t.analyze.aiAnalyzeButtons.technicalAnalysis} content={technicalAnalysis} />
        )}
      </div>

      {/* Realtime Price Section */}
      <RealtimePriceDataSection 
        title={t.analyze.cafefSections.realtimePrice} 
        data={realtimePrice}
        isLoading={isLoadingRealtimePrice}
        onRefresh={refreshRealtimePrice}
      />

      {/* Match Price Section with Date Picker */}
      <div className="space-y-4 animate-fade-in">
        <Card className="border-2 border-primary/20 shadow-[var(--shadow-card)]">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm font-medium">{t.analyze.matchPriceDate || 'Select Date'}:</label>
              <Input
                type="date"
                value={matchPriceDate}
                onChange={(e) => setMatchPriceDate(e.target.value)}
                className="w-auto"
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <MatchPriceDataSection 
              title={t.analyze.cafefSections.matchPrice} 
              data={matchPrice}
              isLoading={isLoadingMatchPrice}
              onRefresh={refreshMatchPrice}
              onAnalyze={handleMatchPriceAnalysis}
              analyzeButtonText={t.analyze.aiAnalyzeButtons.matchPriceAnalysis || 'AI Analyze Match Price'}
              isAnalyzing={isAnalyzingMatchPrice}
            />
          </CardContent>
        </Card>

        {/* Match Price Analysis AI Result */}
        {matchPriceAnalysis && (
          <AIAnalysisPanel 
            title={t.analyze.aiAnalyzeButtons.matchPriceAnalysis || 'Intraday Match Price Analysis'} 
            content={matchPriceAnalysis} 
          />
        )}
      </div>

      {/* News Data Section */}
      <div id="news-section" className="space-y-4 animate-fade-in">
        <NewsDataSection
          title={t.analyze.cafefSections.news}
          data={newsData}
          onAnalyze={handleNewsAnalysis}
          analyzeButtonText={t.analyze.aiAnalyzeButtons.newsAnalysis}
          isAnalyzing={isAnalyzingNews}
          isLoading={isLoadingNews}
          onRefresh={refreshNews}
        />

        {/* News Analysis AI Result */}
        {newsAnalysis && <AIAnalysisPanel title={t.analyze.aiAnalyzeButtons.newsAnalysis} content={newsAnalysis} />}
      </div>

      {/* Proprietary Trading Section */}
      {(proprietaryTrading || isLoading) && (
        <div id="proprietary-section" className="space-y-4 animate-fade-in">
          <ProprietaryTradingDataSection
            title={t.analyze.cafefSections.proprietaryTrading}
            data={proprietaryTrading}
            onAnalyze={handleProprietaryAnalysis}
            analyzeButtonText={t.analyze.aiAnalyzeButtons.proprietaryAnalysis}
            isAnalyzing={isAnalyzingProprietary}
            isLoading={isLoadingProprietaryTrading}
            onRefresh={refreshProprietaryTrading}
          />

          {/* Proprietary Analysis AI Result */}
          {proprietaryAnalysis && (
            <AIAnalysisPanel title={t.analyze.aiAnalyzeButtons.proprietaryAnalysis} content={proprietaryAnalysis} />
          )}
        </div>
      )}

      {/* Foreign Trading Section */}
      {(foreignTrading || isLoading) && (
        <div id="foreign-section" className="space-y-4 animate-fade-in">
          <ForeignTradingDataSection
            title={t.analyze.cafefSections.foreignTrading}
            data={foreignTrading}
            onAnalyze={handleForeignAnalysis}
            analyzeButtonText={t.analyze.aiAnalyzeButtons.foreignAnalysis}
            isAnalyzing={isAnalyzingForeign}
            isLoading={isLoadingForeignTrading}
            onRefresh={refreshForeignTrading}
          />

          {/* Foreign Analysis AI Result */}
          {foreignAnalysis && (
            <AIAnalysisPanel title={t.analyze.aiAnalyzeButtons.foreignAnalysis} content={foreignAnalysis} />
          )}
        </div>
      )}

      {/* Shareholder Trading Section */}
      {(shareholderTrading || isLoading) && (
        <div id="shareholder-section" className="space-y-4 animate-fade-in">
          <ShareholderDataSection
            title={t.analyze.cafefSections.shareholderTrading}
            data={shareholderTrading}
            onAnalyze={handleShareholderAnalysis}
            analyzeButtonText={t.analyze.aiAnalyzeButtons.shareholderAnalysis}
            isAnalyzing={isAnalyzingShareholder}
            isLoading={isLoadingShareholderTrading}
            onRefresh={refreshShareholderTrading}
          />

          {/* Shareholder Analysis AI Result */}
          {shareholderAnalysis && (
            <AIAnalysisPanel title={t.analyze.aiAnalyzeButtons.shareholderAnalysis} content={shareholderAnalysis} />
          )}
        </div>
      )}
    </div>
  );
}
