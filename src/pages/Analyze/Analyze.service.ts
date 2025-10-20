import { APIClient } from "@/lib/helper/api_helper";

const BASE_URL_INSIGHTS = "/api/insights/stream";
const BASE_URL_CHART = "/api/stock_data";
const apiClient = new APIClient();

// Return the async generator from APIClient
const insights = (
  data: { ticker: string; look_back_days: number },
  init?: { signal?: AbortSignal }
) => apiClient.streamPost(BASE_URL_INSIGHTS, data, init);
// Backend expects flat JSON body: { symbol, asset_type }
const chartData = (ticker: string, asset_type: string) =>
  apiClient.create(BASE_URL_CHART, { symbol: ticker, asset_type });

export const AnalyzeService = { insights, chartData };
