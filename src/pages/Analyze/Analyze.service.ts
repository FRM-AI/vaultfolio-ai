import { APIClient } from "@/lib/helper/api_helper";
import { config } from "process";

const BASE_URL_INSIGHTS = "/api/insights/stream";
const BASE_URL_CHART = "/api/stock_data";
const apiClient = new APIClient();

// Return the async generator from APIClient
const insights = (
  data: { ticker: string; look_back_days: number },
  init?: { signal?: AbortSignal }
) => apiClient.streamPost(BASE_URL_INSIGHTS, data, init);

const chartData = (ticker: string) => apiClient.create(BASE_URL_CHART, { data: { symbol: ticker, asset_type: "stock" } });

export const AnalyzeService = { insights, chartData };
