import { APIClient } from "@/lib/helper/api_helper";

const BASE_URL = "/api/cafe";
const apiClient = new APIClient();

export const GetShareholder = (data: {ticker: string} ) => apiClient.create(`${BASE_URL}/shareholder`, { params: data });
export const GetPriceHistory = (data: {ticker: string}) => apiClient.create(`${BASE_URL}/price-history`, { params: data });
export const GetForeignTrading = (data: {ticker: string}) => apiClient.create(`${BASE_URL}/foreign-trading`, { params: data });
export const GetProprietaryTrading = (data: {ticker: string}) => apiClient.create(`${BASE_URL}/proprietary-trading`, { params: data });
export const GetMatchPrice = (data: {ticker: string}) => apiClient.create(`${BASE_URL}/match-price`, { params: data });
export const GetrealtimePrice = (data: {ticker: string}) => apiClient.create(`${BASE_URL}/realtime-price`, { params: data });
export const GetCompanyInfo = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/company-info`, { params: data });
export const GetLeadership = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/leadership`, { params: data });
export const GetSubsidiaries = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/subsidiaries`, { params: data });
export const GetFinancialReports = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/financial-reports`, { params: data });
export const GetCompanyProfile = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/company-profile`, { params: data });
export const GetFinanceData = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/finance-data`, { params: data });
export const GetGlobalIndices = (data: {ticker: string}) => apiClient.get(`${BASE_URL}/global-indices`, { params: data });

