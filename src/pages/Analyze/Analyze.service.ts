import { APIClient } from "@/lib/helper/api_helper";

const BASE_URL_INSIGHTS = "/api/insights/stream";
const apiClient = new APIClient();

// Return the async generator from APIClient
const insights = (
  data: { ticker: string; look_back_days: number },
  init?: { signal?: AbortSignal }
) => apiClient.streamPost(BASE_URL_INSIGHTS, data, init);

export const AnalyzeService = { insights };
