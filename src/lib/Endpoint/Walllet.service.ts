import { APIClient } from "@/lib/helper/api_helper";

const BASE_URL = "/api/wallet";

const apiClient = new APIClient();

const Get = (params?: any) => {
  return apiClient.get(BASE_URL, params);
}

export const WalletService = {
  Get,
};