import { APIClient } from "@/lib/helper/api_helper";

const BASE_URL = "/api/cafe";
const apiClient = new APIClient();

const GetShareholder = (data: {ticker: string} ) => apiClient.create(`${BASE_URL}/shareholder`, { params: data });
const GetPriceHistory = (data: {ticker: string}) => apiClient.create(`${BASE_URL}/price-history`, { params: data });
const GetForeignTrading = (data: {ticker: string}) => apiClient.create(`${BASE_URL}/foreign-trading`, { params: data });
const GetProprietaryTrading = (data: {ticker: string}) => apiClient.create(`${BASE_URL}/proprietary-trading`, { params: data });
const GetMatchPrice = (data: {ticker: string}) => apiClient.create(`${BASE_URL}/match-price`, { params: data });
const GetrealtimePrice = (data: {ticker: string}) => apiClient.create(`${BASE_URL}/realtime-price`, { params: data });
const GetCompanyInfo = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/company-info`, { params: data });
const GetLeadership = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/leadership`, { params: data });
const GetSubsidiaries = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/subsidiaries`, { params: data });
const GetFinancialReports = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/financial-reports`, { params: data });
const GetCompanyProfile = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/company-profile`, { params: data });
const GetFinanceData = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/finance-data`, { params: data });
const GetGlobalIndices = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/global-indices`, { params: data });

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
  GetGlobalIndices,
};
