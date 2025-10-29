import { APIClient } from "@/lib/helper/api_helper";

const BASE_URL = "/api/cafef";
const apiClient = new APIClient();

const GetShareholder = (data: {symbol: string} ) => apiClient.create(`${BASE_URL}/shareholder-data`, data);
const GetPriceHistory = (data: {symbol: string}) => apiClient.create(`${BASE_URL}/price-history`, data);
const GetForeignTrading = (data: {symbol: string}) => apiClient.create(`${BASE_URL}/foreign-trading`, data);
const GetProprietaryTrading = (data: {symbol: string}) => apiClient.create(`${BASE_URL}/proprietary-trading`, data);
const GetMatchPrice = (data: {symbol: string, date: string}) => apiClient.create(`${BASE_URL}/match-price`, data);
const GetrealtimePrice = (data: {symbol: string}) => apiClient.get(`${BASE_URL}/realtime-price/${data.symbol}`);
const GetCompanyInfo = (data: {symbol: string}) => apiClient.get(`${BASE_URL}/company-info/${data.symbol}`);
const GetLeadership = (data: {symbol: string}) => apiClient.get(`${BASE_URL}/leadership/${data.symbol}`);
const GetSubsidiaries = (data: {symbol: string}) => apiClient.get(`${BASE_URL}/subsidiaries/${data.symbol}`);
const GetFinancialReports = (data: {symbol: string}) => apiClient.get(`${BASE_URL}/financial-reports/${data.symbol}`);
const GetCompanyProfile = (data: {symbol: string}) => apiClient.get(`${BASE_URL}/company-profile/${data.symbol}`);
const GetFinanceData = (data: {symbol: string}) => apiClient.get(`${BASE_URL}/finance-data/${data.symbol}`);
const GetGlobalIndices = (data: {symbol?: string}) => apiClient.get(`${BASE_URL}/global-indices`, data);

export const CafeService = {
  GetShareholder,
  GetPriceHistory,
  GetForeignTrading,
  GetProprietaryTrading,
  GetMatchPrice,
  GetrealtimePrice,
  GetCompanyInfo,
  GetLeadership,
  GetSubsidiaries,
  GetFinancialReports,
  GetCompanyProfile,
  GetFinanceData,
  GetGlobalIndices
};