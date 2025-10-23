import { APIClient } from "@/lib/helper/api_helper";

const BASE_URL_INSIGHTS = "/api/insights/stream";
const BASE_URL_CHART = "/api/stock_data";
const apiClient = new APIClient();

// Return the async generator from APIClient
const chartData = (ticker: string, asset_type: string) =>
  apiClient.create(BASE_URL_CHART, { symbol: ticker, asset_type });

const technicalAnalysisStream = (
  data: { ticker: string; asset_type: string },
  init?: { signal?: AbortSignal }
) => apiClient.streamPost("/api/technical-analysis/stream", data, init);

const newsAnalysisStream = (
  data: { ticker: string; asset_type: string; look_back_days: number },
  init?: { signal?: AbortSignal }
) => apiClient.streamPost("/api/news-analysis/stream", data, init);

const proprietaryTradingAnalysisStream = (
  data: { ticker: string },
  init?: { signal?: AbortSignal }
) => apiClient.streamPost("/api/proprietary-trading-analysis/stream", data, init);

const foreignTradingAnalysisStream = (
  data: { ticker: string },
  init?: { signal?: AbortSignal }
) => apiClient.streamPost("/api/foreign-trading-analysis/stream", data, init);

const shareholderTradingAnalysisStream = (
  data: { ticker: string },
  init?: { signal?: AbortSignal }
) => apiClient.streamPost("/api/shareholder-trading-analysis/stream", data, init);

const intradayMatchAnalysisStream = (
  params: { ticker: string; date?: string },
  init?: { signal?: AbortSignal }
) => {
  const date = params.date ?? new Date().toISOString().slice(0, 10); // default to today (YYYY-MM-DD)
  return apiClient.streamPost(
    `/api/intraday_match_analysis?ticker=${encodeURIComponent(params.ticker)}&date=${encodeURIComponent(date)}`,
    undefined,
    init
  );
};

export const AnalyzeService = {
  chartData,
  technicalAnalysisStream,
  newsAnalysisStream,
  proprietaryTradingAnalysisStream,
  foreignTradingAnalysisStream,
  shareholderTradingAnalysisStream,
  intradayMatchAnalysisStream
};
