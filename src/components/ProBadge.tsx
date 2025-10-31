import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { API_PRICING, type AnalysisServiceType } from './WalletInfo';

interface ProBadgeProps {
  serviceType: AnalysisServiceType;
  showTooltip?: boolean;
  size?: 'sm' | 'md';
}

export function ProBadge({ serviceType, showTooltip = true, size = 'sm' }: ProBadgeProps) {
  const cost = API_PRICING[serviceType];
  
  const badge = (
    <Badge 
      variant="secondary" 
      className={`${size === 'sm' ? 'h-5 text-xs px-2' : 'h-6 text-sm px-3'} bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold gap-1`}
    >
      <Sparkles className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      <span>{cost} FRM</span>
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">Costs {cost} FRM Coins per analysis</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
