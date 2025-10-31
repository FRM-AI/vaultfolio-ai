import { APIClient } from "@/lib/helper/api_helper";

const apiClient = new APIClient();

export interface InsightHistoryItem {
  id: string;
  user_id: string;
  ticker: string;
  asset_type: string;
  analysis_type: string;
  content: string;
  metadata?: {
    date_range?: {
      start: string;
      end: string;
    };
    look_back_days?: number;
    generated_at?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface InsightsHistoryStats {
  total_insights: number;
  by_analysis_type: Record<string, number>;
  by_ticker: Record<string, number>;
  most_analyzed_ticker: {
    ticker: string;
    count: number;
  };
  most_used_analysis: {
    type: string;
    count: number;
  };
}

export type AnalysisType =
  | "technical_analysis"
  | "news_analysis"
  | "proprietary_trading_analysis"
  | "foreign_trading_analysis"
  | "shareholder_trading_analysis"
  | "intraday_match_analysis";

export interface GetInsightsHistoryParams {
  limit?: number;
  offset?: number;
  analysis_type?: AnalysisType;
  ticker?: string;
}

const getInsightsHistory = (params?: GetInsightsHistoryParams) => {
  return apiClient.get("/api/insights-history", params) as unknown as Promise<InsightHistoryItem[]>;
};

const getInsightById = (insightId: string) => {
  return apiClient.get(`/api/insights-history/${insightId}`) as unknown as Promise<InsightHistoryItem>;
};

const deleteInsight = (insightId: string) => {
  return apiClient.delete("/api/insights-history", insightId) as unknown as Promise<{ message: string }>;
};

const deleteAllInsights = () => {
  return apiClient.create("/api/insights-history", undefined, { method: "DELETE" }) as unknown as Promise<{ message: string; count: number }>;
};

const getInsightsStats = () => {
  return apiClient.get("/api/insights-history/stats") as unknown as Promise<InsightsHistoryStats>;
};

export const InsightsHistoryService = {
  getInsightsHistory,
  getInsightById,
  deleteInsight,
  deleteAllInsights,
  getInsightsStats,
};
