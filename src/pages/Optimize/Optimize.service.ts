import { APIClient } from "@/lib/helper/api_helper";

const BASE_URL = "/api/optimize_portfolio";

const apiClient = new APIClient();

const optimize = (data: {
  symbols: string[];
  investment_amount: number;
}) => apiClient.create(BASE_URL, data);



export const OptimizeService = { optimize };
