import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CafeService } from "@/pages/SupportService/Cafe.service";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type EndpointType = 
  | "shareholder"
  | "price-history"
  | "foreign-trading"
  | "proprietary-trading"
  | "match-price"
  | "realtime-price"
  | "company-info"
  | "leadership"
  | "subsidiaries"
  | "financial-reports"
  | "company-profile"
  | "finance-data"
  | "global-indices";

interface CafeServicePanelProps {
  ticker: string;
}

export const CafeServicePanel = ({ ticker }: CafeServicePanelProps) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointType>("realtime-price");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Form state
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(14);
  const [typeId, setTypeId] = useState(1);

  const endpointOptions = [
    { value: "realtime-price", label: "Giá Realtime" },
    { value: "shareholder", label: "Giao dịch cổ đông" },
    { value: "price-history", label: "Lịch sử giá" },
    { value: "foreign-trading", label: "Giao dịch khối ngoại" },
    { value: "proprietary-trading", label: "Giao dịch tự doanh" },
    { value: "match-price", label: "Giá khớp lệnh" },
    { value: "company-info", label: "Thông tin công ty" },
    { value: "leadership", label: "Ban lãnh đạo" },
    { value: "subsidiaries", label: "Công ty con" },
    { value: "financial-reports", label: "Báo cáo tài chính" },
    { value: "company-profile", label: "Hồ sơ công ty" },
    { value: "finance-data", label: "Dữ liệu tài chính" },
    { value: "global-indices", label: "Chỉ số thế giới" },
  ];

  const needsDateRange = ["shareholder", "price-history", "foreign-trading", "proprietary-trading"];
  const needsSingleDate = ["match-price"];
  const needsPagination = ["shareholder", "price-history", "foreign-trading", "proprietary-trading", "company-profile"];
  const needsTypeId = ["company-profile"];
  const needsNoParams = ["global-indices"];

  const handleFetchData = async () => {
    if (!ticker && selectedEndpoint !== "global-indices") {
      toast.error("Vui lòng nhập mã cổ phiếu");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let response;
      
      switch (selectedEndpoint) {
        case "shareholder":
          response = await CafeService.GetShareholder({ ticker });
          break;
        case "price-history":
          response = await CafeService.GetPriceHistory({ ticker });
          break;
        case "foreign-trading":
          response = await CafeService.GetForeignTrading({ ticker });
          break;
        case "proprietary-trading":
          response = await CafeService.GetProprietaryTrading({ ticker });
          break;
        case "match-price":
          response = await CafeService.GetMatchPrice({ ticker });
          break;
        case "realtime-price":
          response = await CafeService.GetrealtimePrice({ ticker });
          break;
        case "company-info":
          response = await CafeService.GetCompanyInfo({ ticker });
          break;
        case "leadership":
          response = await CafeService.GetLeadership({ ticker });
          break;
        case "subsidiaries":
          response = await CafeService.GetSubsidiaries({ ticker });
          break;
        case "financial-reports":
          response = await CafeService.GetFinancialReports({ ticker });
          break;
        case "company-profile":
          response = await CafeService.GetCompanyProfile({ ticker });
          break;
        case "finance-data":
          response = await CafeService.GetFinanceData({ ticker });
          break;
        case "global-indices":
          response = await CafeService.GetGlobalIndices({ ticker: "" });
          break;
        default:
          throw new Error("Endpoint không hợp lệ");
      }

      setResult(response);
      toast.success("Lấy dữ liệu thành công");
    } catch (error: any) {
      console.error("Error fetching cafe data:", error);
      toast.error(error?.message || "Lỗi khi lấy dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-xl font-bold">CafeF API - Dữ liệu thị trường</CardTitle>
          <CardDescription>
            Truy cập dữ liệu thị trường chứng khoán từ CafeF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Endpoint Selection */}
          <div className="space-y-2">
            <Label htmlFor="endpoint">Chọn API Endpoint</Label>
            <Select
              value={selectedEndpoint}
              onValueChange={(value) => setSelectedEndpoint(value as EndpointType)}
            >
              <SelectTrigger 
                id="endpoint"
                className="bg-background hover:bg-muted/50 border-2 border-primary/20 focus:border-primary/40 transition-all shadow-[var(--shadow-hover)]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-2 border-primary/20 shadow-[var(--shadow-hover)]">
                {endpointOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="focus:bg-primary/10"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Form Fields */}
          {needsDateRange.includes(selectedEndpoint) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Ngày bắt đầu</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-primary/20 focus:border-primary/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Ngày kết thúc</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-primary/20 focus:border-primary/40"
                />
              </div>
            </div>
          )}

          {needsSingleDate.includes(selectedEndpoint) && (
            <div className="space-y-2">
              <Label htmlFor="date">Ngày</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-primary/20 focus:border-primary/40"
              />
            </div>
          )}

          {needsPagination.includes(selectedEndpoint) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page-index">Trang</Label>
                <Input
                  id="page-index"
                  type="number"
                  value={pageIndex}
                  onChange={(e) => setPageIndex(Number(e.target.value))}
                  min={1}
                  className="border-primary/20 focus:border-primary/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-size">Số lượng/trang</Label>
                <Input
                  id="page-size"
                  type="number"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="border-primary/20 focus:border-primary/40"
                />
              </div>
            </div>
          )}

          {needsTypeId.includes(selectedEndpoint) && (
            <div className="space-y-2">
              <Label htmlFor="type-id">Type ID</Label>
              <Input
                id="type-id"
                type="number"
                value={typeId}
                onChange={(e) => setTypeId(Number(e.target.value))}
                min={1}
                className="border-primary/20 focus:border-primary/40"
              />
            </div>
          )}

          {/* Fetch Button */}
          <Button
            onClick={handleFetchData}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải...
              </>
            ) : (
              "Lấy dữ liệu"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <Card className="border-primary/20 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Kết quả</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px] text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
