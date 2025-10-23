import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  IChartApi,
  LineSeries,
  CandlestickSeries
} from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Settings,
  Activity,
  Eye,
  EyeOff,
  Maximize,
  BarChart3
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SupportedAssetsNotice } from "@/components/ui/SupportedAssetsNotice";
import { APIClient } from "@/lib/helper/api_helper";
import { useLanguage } from "@/contexts/LanguageContext";

import { SMA, EMA, RSI, MACD, BollingerBands } from "technicalindicators";

type AssetType = "stock" | "crypto";

type ChartDataPoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type StockSummary = {
  latest_price: number;
  price_change: number;
  price_change_percent: number;
  volume: number;
  total_records?: number;
};

type MarketInfo = {
  name?: string;
  note?: string;
  currency?: string;
  timezone?: string;
};

type SupportedAssets = {
  vietnam_stocks?: string;
  crypto?: string;
  note?: string;
};

type StockData = {
  success?: boolean;
  symbol: string;
  asset_type?: AssetType;
  chart_data: ChartDataPoint[];
  market_info?: MarketInfo;
  summary: StockSummary;
  supported_assets?: SupportedAssets;
  error?: string;
};

type IndicatorConfig = {
  enabled: boolean;
  color: string;
  period: number;
  visible: boolean;
};

type BollingerConfig = IndicatorConfig & {
  stdDev: number;
};

type RSIConfig = IndicatorConfig & {
  overbought: number;
  oversold: number;
};

type MACDConfig = IndicatorConfig & {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
};

type IndicatorsSettings = {
  sma: IndicatorConfig;
  ema: IndicatorConfig;
  bollinger: BollingerConfig;
  rsi: RSIConfig;
  macd: MACDConfig;
  volume: IndicatorConfig;
};

type LoadStockData = (symbol: string, assetType: AssetType) => Promise<StockData | null | undefined>;

type CommonProps = {
  defaultSymbol?: string;
  defaultAssetType?: AssetType;
  height?: number;
  showControls?: boolean;
  data?: StockData | null;
  onLoadData?: LoadStockData;
  onSymbolChange?: (symbol: string, assetType: AssetType, data: StockData) => void;
};

const chartColors = {
  background: "transparent",
  textColor: "#666666",
  gridColor: "#f0f0f0",
  upColor: "#22c55e",
  downColor: "#ef4444",
  volumeUpColor: "#22c55e40",
  volumeDownColor: "#ef444440"
};

const apiClient = new APIClient();

const defaultFetcher: LoadStockData = async (symbol, assetType) => {
  const response = await apiClient.create("/api/stock_data", {
    symbol: symbol.trim().toUpperCase(),
    asset_type: assetType
  });

  // apiClient.create likely returns an AxiosResponse; extract the payload
  const payload = (response as any)?.data ?? response;
  return payload as StockData;
};

export function ProfessionalStockChart({
  defaultSymbol = "VCB",
  defaultAssetType = "stock",
  height = 600,
  showControls = true,
  data,
  onLoadData,
  onSymbolChange
}: CommonProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chart = useRef<IChartApi | null>(null);
  const candlestickSeries = useRef<any>(null);
  const volumeSeries = useRef<any>(null);
  const indicatorSeries = useRef<Record<string, any>>({});

  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-US" : "vi-VN";
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const [symbol, setSymbol] = useState(defaultSymbol);
  const [assetType, setAssetType] = useState<AssetType>(defaultAssetType);
  const [inputSymbol, setInputSymbol] = useState(defaultSymbol);
  const [stockData, setStockData] = useState<StockData | null>(data ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"candlestick" | "line">("candlestick");
  const [showVolume, setShowVolume] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMobileIndicators, setShowMobileIndicators] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  const [indicators, setIndicators] = useState<IndicatorsSettings>({
    sma: { enabled: false, visible: true, color: "#2196F3", period: 20 },
    ema: { enabled: false, visible: true, color: "#FF9800", period: 20 },
    bollinger: { enabled: false, visible: true, color: "#9C27B0", period: 20, stdDev: 2 },
    rsi: { enabled: false, visible: true, color: "#F44336", period: 14, overbought: 70, oversold: 30 },
    macd: { enabled: false, visible: true, color: "#4CAF50", period: 12, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    volume: { enabled: true, visible: true, color: "#607D8B", period: 0 }
  });

  const { toast } = useToast();

  useEffect(() => {
    if (!data) {
      return;
    }

    const normalizedSymbol = data.symbol?.toUpperCase?.() ?? data.symbol;
    const nextData: StockData = {
      ...data,
      symbol: normalizedSymbol,
      asset_type: data.asset_type ?? defaultAssetType
    };

    setStockData(nextData);

    if (normalizedSymbol) {
      setSymbol(normalizedSymbol);
      setInputSymbol(normalizedSymbol);
    }

    if (nextData.asset_type === "stock" || nextData.asset_type === "crypto") {
      setAssetType(nextData.asset_type);
    }
  }, [data, defaultAssetType]);

  const chartHeight = useMemo(() => {
    if (typeof window === "undefined") {
      return height;
    }

    const isMobile = window.innerWidth < 768;
    const baseHeight = isFullscreen ? Math.max(window.innerHeight - 160, height) : height;

    if (isMobile && !isFullscreen) {
      return Math.min(baseHeight, 400);
    }

    return baseHeight;
  }, [height, isFullscreen]);

  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    chart.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: chartColors.background },
        textColor: chartColors.textColor
      },
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      grid: {
        vertLines: { color: chartColors.gridColor },
        horzLines: { color: chartColors.gridColor }
      },
      crosshair: {
        mode: CrosshairMode.Normal
      },
      rightPriceScale: {
        borderColor: "#e0e0e0",
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.3 : 0.1
        }
      },
      timeScale: {
        borderColor: "#e0e0e0",
        timeVisible: true,
        secondsVisible: false
      }
    });

    const resize = () => {
      if (!chart.current || !chartContainerRef.current) {
        return;
      }

      chart.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartHeight
      });
    };

    window.addEventListener("resize", resize);
    setChartReady(true);

    return () => {
      window.removeEventListener("resize", resize);
      chart.current?.remove?.();
      chart.current = null;
      setChartReady(false);
    };
  }, [chartHeight, showVolume]);

  useEffect(() => {
    if (!data && showControls) {
      loadStockData(defaultSymbol, defaultAssetType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chartReady || !chart.current) {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      if (!chart.current || !chartContainerRef.current) {
        return;
      }

      chart.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartHeight
      });
      chart.current.timeScale().fitContent();
    });

    return () => window.cancelAnimationFrame(raf);
  }, [isFullscreen, chartHeight, chartReady]);

  const calculatedIndicators = useMemo(() => {
    if (!stockData?.chart_data?.length) {
      return {} as Record<string, unknown>;
    }

  const closes = stockData.chart_data.map((point) => point.close);
    const times = stockData.chart_data.map((point) => point.time);

    const results: Record<string, unknown> = {};

    try {
      if (indicators.sma.enabled && closes.length >= indicators.sma.period) {
        const values = SMA.calculate({ period: indicators.sma.period, values: closes });
        results.sma = times.slice(-values.length).map((time, index) => ({
          time,
          value: values[index]
        }));
      }

      if (indicators.ema.enabled && closes.length >= indicators.ema.period) {
        const values = EMA.calculate({ period: indicators.ema.period, values: closes });
        results.ema = times.slice(-values.length).map((time, index) => ({
          time,
          value: values[index]
        }));
      }

      if (indicators.bollinger.enabled && closes.length >= indicators.bollinger.period) {
        const values = BollingerBands.calculate({
          period: indicators.bollinger.period,
          values: closes,
          stdDev: indicators.bollinger.stdDev
        });

        results.bollinger = {
          upper: times.slice(-values.length).map((time, index) => ({
            time,
            value: values[index].upper
          })),
          middle: times.slice(-values.length).map((time, index) => ({
            time,
            value: values[index].middle
          })),
          lower: times.slice(-values.length).map((time, index) => ({
            time,
            value: values[index].lower
          }))
        };
      }

      if (indicators.rsi.enabled && closes.length >= indicators.rsi.period + 1) {
        const values = RSI.calculate({ period: indicators.rsi.period, values: closes });
        results.rsi = times.slice(-values.length).map((time, index) => ({
          time,
          value: values[index]
        }));
      }

      if (indicators.macd.enabled && closes.length >= indicators.macd.slowPeriod) {
        const values = MACD.calculate({
          fastPeriod: indicators.macd.fastPeriod,
          slowPeriod: indicators.macd.slowPeriod,
          signalPeriod: indicators.macd.signalPeriod,
          values: closes,
          SimpleMAOscillator: false,
          SimpleMASignal: false
        });

        results.macd = {
          macd: times.slice(-values.length).map((time, index) => ({
            time,
            value: values[index].MACD
          })),
          signal: times.slice(-values.length).map((time, index) => ({
            time,
            value: values[index].signal
          })),
          histogram: times.slice(-values.length).map((time, index) => ({
            time,
            value: values[index].histogram,
            color: values[index].histogram >= 0 ? chartColors.upColor : chartColors.downColor
          }))
        };
      }
    } catch (indicatorError) {
      console.error("Indicator calculation failed", indicatorError);
    }

    return results;
  }, [stockData, indicators]);

  useEffect(() => {
    if (!chartReady || !chart.current) {
      return;
    }

    if (candlestickSeries.current) {
      try {
        chart.current.removeSeries(candlestickSeries.current);
      } catch (seriesError) {
        console.warn("Unable to remove candlestick series", seriesError);
      }
      candlestickSeries.current = null;
    }

    if (volumeSeries.current) {
      try {
        chart.current.removeSeries(volumeSeries.current);
      } catch (volumeError) {
        console.warn("Unable to remove volume series", volumeError);
      }
      volumeSeries.current = null;
    }

    Object.values(indicatorSeries.current).forEach((series) => {
      if (!series) {
        return;
      }

      try {
        chart.current?.removeSeries(series);
      } catch (indicatorError) {
        console.warn("Unable to remove indicator series", indicatorError);
      }
    });

    indicatorSeries.current = {};

    if (!stockData?.chart_data?.length) {
      setError(t.chart.errors.noData);
      return;
    }

    const validData = stockData.chart_data.filter((item) =>
      item &&
      Number.isFinite(item.time) &&
      Number.isFinite(item.open) &&
      Number.isFinite(item.high) &&
      Number.isFinite(item.low) &&
      Number.isFinite(item.close) &&
      Number.isFinite(item.volume)
    );

    if (!validData.length) {
      setError(t.chart.errors.invalidData);
      return;
    }

    setError(null);

    if (chartType === "candlestick") {
      candlestickSeries.current = chart.current.addSeries(CandlestickSeries, {
        upColor: chartColors.upColor,
        downColor: chartColors.downColor,
        borderDownColor: chartColors.downColor,
        borderUpColor: chartColors.upColor,
        wickDownColor: chartColors.downColor,
        wickUpColor: chartColors.upColor
      });

      candlestickSeries.current.setData(
        validData.map((item) => ({
          time: item.time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close
        }))
      );
    } else {
      candlestickSeries.current = chart.current.addSeries(LineSeries, {
        color: chartColors.upColor,
        lineWidth: 2
      });

      candlestickSeries.current.setData(
        validData.map((item) => ({
          time: item.time,
          value: item.close
        }))
      );
    }

    if (showVolume && indicators.volume.enabled) {
      volumeSeries.current = chart.current.addSeries(HistogramSeries, {
        color: indicators.volume.color,
        priceFormat: { type: "volume" },
        priceScaleId: "volume"
      });

      try {
        chart.current.priceScale("volume").applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0
          },
          borderVisible: false
        });
      } catch (scaleError) {
        console.warn("Unable to configure volume scale", scaleError);
      }

      volumeSeries.current.setData(
        validData.map((item) => ({
          time: item.time,
          value: item.volume,
          color: item.close >= item.open ? chartColors.volumeUpColor : chartColors.volumeDownColor
        }))
      );
    }

    addTechnicalIndicators(calculatedIndicators);
    chart.current.timeScale().fitContent();
  }, [stockData, chartType, showVolume, calculatedIndicators, indicators, chartReady, t]);

  const addTechnicalIndicators = (calculated: Record<string, any>) => {
    if (!chart.current) {
      return;
    }

    try {
      if (indicators.sma.enabled && indicators.sma.visible && calculated.sma) {
        indicatorSeries.current.sma = chart.current.addSeries(LineSeries, {
          color: indicators.sma.color,
          lineWidth: 2,
          title: `SMA(${indicators.sma.period})`
        });
        indicatorSeries.current.sma.setData(calculated.sma);
      }

      if (indicators.ema.enabled && indicators.ema.visible && calculated.ema) {
        indicatorSeries.current.ema = chart.current.addSeries(LineSeries, {
          color: indicators.ema.color,
          lineWidth: 2,
          title: `EMA(${indicators.ema.period})`
        });
        indicatorSeries.current.ema.setData(calculated.ema);
      }

      if (indicators.bollinger.enabled && indicators.bollinger.visible && calculated.bollinger) {
        indicatorSeries.current.bbUpper = chart.current.addSeries(LineSeries, {
          color: indicators.bollinger.color,
          lineWidth: 1,
          lineStyle: 2,
          title: `BB Upper(${indicators.bollinger.period})`
        });
        indicatorSeries.current.bbUpper.setData(calculated.bollinger.upper);

        indicatorSeries.current.bbMiddle = chart.current.addSeries(LineSeries, {
          color: indicators.bollinger.color,
          lineWidth: 1,
          title: `BB Middle(${indicators.bollinger.period})`
        });
        indicatorSeries.current.bbMiddle.setData(calculated.bollinger.middle);

        indicatorSeries.current.bbLower = chart.current.addSeries(LineSeries, {
          color: indicators.bollinger.color,
          lineWidth: 1,
          lineStyle: 2,
          title: `BB Lower(${indicators.bollinger.period})`
        });
        indicatorSeries.current.bbLower.setData(calculated.bollinger.lower);
      }

      if (indicators.rsi.enabled && indicators.rsi.visible && calculated.rsi) {
        indicatorSeries.current.rsi = chart.current.addSeries(LineSeries, {
          color: indicators.rsi.color,
          lineWidth: 2,
          title: `RSI(${indicators.rsi.period})`,
          priceScaleId: "rsi"
        });

        try {
          chart.current.priceScale("rsi").applyOptions({
            scaleMargins: {
              top: 0.1,
              bottom: 0.1
            },
            borderVisible: false
          });
        } catch (scaleError) {
          console.warn("Unable to configure RSI scale", scaleError);
        }

        indicatorSeries.current.rsi.setData(calculated.rsi);
      }
    } catch (indicatorError) {
      console.error("Error adding indicator series", indicatorError);
    }
  };

  const loadStockData: LoadStockData = async (stockSymbol, type) => {
    if (!stockSymbol.trim()) {
      setError(t.chart.errors.invalidSymbol);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const fetcher = onLoadData ?? defaultFetcher;
      const response = await fetcher(stockSymbol.trim().toUpperCase(), type);

      if (!response) {
        setError(t.chart.errors.noResponse);
        return null;
      }

      if (response.success === false) {
        setError(response.error || t.chart.errors.apiError);
        return null;
      }

      if (!response.chart_data || !Array.isArray(response.chart_data) || !response.chart_data.length) {
        setError(t.chart.errors.notFound);
        return null;
      }

      const isValid = response.chart_data.every((item) =>
        item &&
        Number.isFinite(item.time) &&
        Number.isFinite(item.open) &&
        Number.isFinite(item.high) &&
        Number.isFinite(item.low) &&
        Number.isFinite(item.close) &&
        Number.isFinite(item.volume)
      );

      if (!isValid) {
        setError(t.chart.errors.badFormat);
        return null;
      }

      const normalizedSymbol = response.symbol?.toUpperCase?.() ?? stockSymbol.trim().toUpperCase();
      const nextData: StockData = {
        ...response,
        symbol: normalizedSymbol,
        asset_type: response.asset_type ?? type
      };

      setStockData(nextData);
      setSymbol(normalizedSymbol);
      setAssetType(nextData.asset_type ?? type);
      setInputSymbol(normalizedSymbol);

      onSymbolChange?.(normalizedSymbol, nextData.asset_type ?? type, nextData);

      toast({
        title: t.chart.toast.successTitle,
        description: t.chart.toast.successDescription.replace("{{symbol}}", normalizedSymbol)
      });

      return response;
    } catch (fetchError: any) {
      const message = fetchError?.message || t.chart.errors.invalidData;
      setError(message);
      toast({
        title: t.chart.toast.errorTitle,
        description: message,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!inputSymbol.trim()) {
      return;
    }

    loadStockData(inputSymbol, assetType);
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const updateIndicator = <K extends keyof IndicatorsSettings>(
    name: K,
    updates: Partial<IndicatorsSettings[K]>
  ) => {
    setIndicators((previous) => ({
      ...previous,
      [name]: { ...previous[name], ...updates }
    }));
  };

  const formatPrice = (price: number) => {
    if (!Number.isFinite(price)) {
      return "-";
    }

    return `${numberFormatter.format(price)} ${stockData?.market_info?.currency ?? "₫"}`.trim();
  };

  const formatVolume = (volume: number) => {
    if (!Number.isFinite(volume)) {
      return "-";
    }

    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return numberFormatter.format(volume);
  };

  const summary = stockData?.summary;
  const priceChange = Number.isFinite(summary?.price_change) ? (summary?.price_change as number) : 0;
  const priceChangePercent = Number.isFinite(summary?.price_change_percent)
    ? (summary?.price_change_percent as number)
    : 0;

  return (
    <div className={`w-full ${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
      <Card className="w-full shadow-lg border-0">
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl mb-2">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="truncate">{`${t.chart.titlePrefix} ${stockData?.symbol || symbol}`}</span>
                {summary && (
                  <Badge
                    variant={priceChange >= 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {priceChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {priceChangePercent >= 0 ? "+" : ""}
                    {priceChangePercent.toFixed(2)}%
                  </Badge>
                )}
              </CardTitle>

              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-3 p-2 sm:p-3 bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t.chart.summary.currentPrice}</p>
                    <p className="text-xs sm:text-sm font-bold truncate">{formatPrice(summary.latest_price)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t.chart.summary.change}</p>
                    <p
                      className={`text-xs sm:text-sm font-bold truncate ${
                        priceChange >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {priceChange >= 0 ? "+" : ""}
                      {numberFormatter.format(priceChange)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t.chart.summary.changePercent}</p>
                    <p
                      className={`text-xs sm:text-sm font-bold ${
                        priceChangePercent >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {priceChangePercent >= 0 ? "+" : ""}
                      {priceChangePercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t.chart.summary.volume}</p>
                    <p className="text-xs sm:text-sm font-bold truncate">{formatVolume(summary.volume)}</p>
                  </div>
                </div>
              )}
            </div>

            {showControls && (
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex gap-2 justify-center sm:justify-start">
                  <Button
                    variant={assetType === "stock" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssetType("stock")}
                    disabled={loading}
                    className="text-xs px-2 py-1 sm:px-3 sm:py-2"
                  >
                    {t.chart.assetType.stock}
                  </Button>
                  <Button
                    variant={assetType === "crypto" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssetType("crypto")}
                    disabled={loading}
                    className="text-xs px-2 py-1 sm:px-3 sm:py-2"
                  >
                    {t.chart.assetType.crypto}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder={assetType === "stock" ? t.chart.inputPlaceholder.stock : t.chart.inputPlaceholder.crypto}
                    value={inputSymbol}
                    onChange={(event) => setInputSymbol(event.target.value.toUpperCase())}
                    onKeyDown={handleKeyPress}
                    className="flex-1 text-sm"
                    disabled={loading}
                  />
                  <Button onClick={handleSearch} disabled={loading || !inputSymbol.trim()} size="icon">
                    {loading ? (
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary" />
                    ) : (
                      <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFullscreen((prev) => !prev)}
                  >
                    <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className={`flex ${showControls ? "flex-col lg:flex-row" : ""}`}>
            <div className="flex-1">
              {error ? (
                <div className="flex flex-col items-center justify-center h-64 sm:h-96 text-center p-4 sm:p-8">
                  <Activity className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                  <p className="text-base sm:text-lg font-medium text-destructive mb-2">{t.chart.general.cannotLoad}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">{error}</p>
                  {showControls && <SupportedAssetsNotice compact />}
                </div>
              ) : (
                <div className="relative">
                  {loading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary" />
                        <p className="text-xs sm:text-sm">{t.chart.loading.overlay}</p>
                      </div>
                    </div>
                  )}
                  <div ref={chartContainerRef} style={{ height: `${chartHeight}px` }} />
                </div>
              )}
            </div>

            {showControls && (
              <>
                <div className="lg:hidden p-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowMobileIndicators((prev) => !prev)}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {showMobileIndicators ? t.chart.actions.hideIndicators : t.chart.actions.showIndicators}
                  </Button>
                </div>

                <div
                  className={`w-full lg:w-80 border-l-0 lg:border-l bg-muted/20 overflow-y-auto max-h-96 lg:max-h-screen ${
                    showMobileIndicators ? "block" : "hidden lg:block"
                  }`}
                >
                  <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t.chart.chartType.label}</Label>
                      <Select value={chartType} onValueChange={(value) => setChartType(value as typeof chartType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="candlestick">{t.chart.chartType.candlestick}</SelectItem>
                          <SelectItem value="line">{t.chart.chartType.line}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t.chart.volume.label}</Label>
                      <Switch checked={showVolume} onCheckedChange={setShowVolume} />
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">{t.chart.movingAverages.heading}</h4>

                      <div className="space-y-2 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{t.chart.movingAverages.sma}</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateIndicator("sma", { visible: !indicators.sma.visible })
                              }
                              disabled={!indicators.sma.enabled}
                            >
                              {indicators.sma.visible ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                            <Switch
                              checked={indicators.sma.enabled}
                              onCheckedChange={(checked) => updateIndicator("sma", { enabled: checked })}
                            />
                          </div>
                        </div>
                        {indicators.sma.enabled && (
                          <div>
                            <Label className="text-xs">{t.chart.movingAverages.period}: {indicators.sma.period}</Label>
                            <Slider
                              value={[indicators.sma.period]}
                              onValueChange={([value]) => updateIndicator("sma", { period: value })}
                              min={5}
                              max={200}
                              step={1}
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{t.chart.movingAverages.ema}</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateIndicator("ema", { visible: !indicators.ema.visible })
                              }
                              disabled={!indicators.ema.enabled}
                            >
                              {indicators.ema.visible ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                            <Switch
                              checked={indicators.ema.enabled}
                              onCheckedChange={(checked) => updateIndicator("ema", { enabled: checked })}
                            />
                          </div>
                        </div>
                        {indicators.ema.enabled && (
                          <div>
                            <Label className="text-xs">{t.chart.movingAverages.period}: {indicators.ema.period}</Label>
                            <Slider
                              value={[indicators.ema.period]}
                              onValueChange={([value]) => updateIndicator("ema", { period: value })}
                              min={5}
                              max={200}
                              step={1}
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">{t.chart.bollinger.label}</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateIndicator("bollinger", { visible: !indicators.bollinger.visible })
                            }
                            disabled={!indicators.bollinger.enabled}
                          >
                            {indicators.bollinger.visible ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                          </Button>
                          <Switch
                            checked={indicators.bollinger.enabled}
                            onCheckedChange={(checked) => updateIndicator("bollinger", { enabled: checked })}
                          />
                        </div>
                      </div>
                      {indicators.bollinger.enabled && (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs">{t.chart.bollinger.period}: {indicators.bollinger.period}</Label>
                            <Slider
                              value={[indicators.bollinger.period]}
                              onValueChange={([value]) => updateIndicator("bollinger", { period: value })}
                              min={5}
                              max={50}
                              step={1}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">{t.chart.bollinger.stdDev}: {indicators.bollinger.stdDev}</Label>
                            <Slider
                              value={[indicators.bollinger.stdDev]}
                              onValueChange={([value]) => updateIndicator("bollinger", { stdDev: value })}
                              min={1}
                              max={3}
                              step={0.1}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">{t.chart.rsi.label}</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateIndicator("rsi", { visible: !indicators.rsi.visible })
                            }
                            disabled={!indicators.rsi.enabled}
                          >
                            {indicators.rsi.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Button>
                          <Switch
                            checked={indicators.rsi.enabled}
                            onCheckedChange={(checked) => updateIndicator("rsi", { enabled: checked })}
                          />
                        </div>
                      </div>
                      {indicators.rsi.enabled && (
                        <div>
                          <Label className="text-xs">{t.chart.rsi.period}: {indicators.rsi.period}</Label>
                          <Slider
                            value={[indicators.rsi.period]}
                            onValueChange={([value]) => updateIndicator("rsi", { period: value })}
                            min={5}
                            max={30}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const StockChart = ProfessionalStockChart;
export default ProfessionalStockChart;
