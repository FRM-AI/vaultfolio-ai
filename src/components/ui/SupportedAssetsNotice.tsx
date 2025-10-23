import { Info } from "lucide-react";

interface SupportedAssetsNoticeProps {
  compact?: boolean;
}

export function SupportedAssetsNotice({ compact = false }: SupportedAssetsNoticeProps) {
  return (
    <div
      className={`rounded-md border border-border bg-muted/30 text-muted-foreground ${
        compact ? "p-3 text-xs" : "p-4 text-sm"
      }`}
    >
      <div className="flex items-start gap-2">
        <Info className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <div className="space-y-1">
          <p className="font-medium text-foreground">Tài sản được hỗ trợ</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Cổ phiếu Việt Nam (ví dụ: VCB, FPT, VNM)</li>
            <li>Tiền mã hoá phổ biến (ví dụ: BTC, ETH)</li>
          </ul>
          <p className="text-xs text-muted-foreground/80">
            Nếu mã không hiển thị dữ liệu, vui lòng thử một mã khác hoặc kiểm tra lại.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SupportedAssetsNotice;
