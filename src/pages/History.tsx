import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

const mockTransactions = [
  { id: 1, date: '2025-01-15', type: 'buy', symbol: 'VNM', quantity: 100, price: '76,500', total: '7,650,000' },
  { id: 2, date: '2025-01-14', type: 'sell', symbol: 'HPG', quantity: 200, price: '23,800', total: '4,760,000' },
  { id: 3, date: '2025-01-13', type: 'buy', symbol: 'VCB', quantity: 50, price: '91,200', total: '4,560,000' },
  { id: 4, date: '2025-01-12', type: 'buy', symbol: 'VHM', quantity: 80, price: '63,500', total: '5,080,000' },
  { id: 5, date: '2025-01-10', type: 'sell', symbol: 'VNM', quantity: 50, price: '75,000', total: '3,750,000' },
];

export default function History() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.history.title}</h1>
        <p className="text-muted-foreground">{t.history.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.history.title}</CardTitle>
          <CardDescription>Tất cả giao dịch gần đây</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.history.date}</TableHead>
                <TableHead>{t.history.type}</TableHead>
                <TableHead>{t.history.symbol}</TableHead>
                <TableHead className="text-right">{t.history.quantity}</TableHead>
                <TableHead className="text-right">{t.history.price}</TableHead>
                <TableHead className="text-right">{t.history.total}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{tx.date}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === 'buy' ? 'default' : 'secondary'} className="gap-1">
                      {tx.type === 'buy' ? (
                        <>
                          <ArrowUpRight className="h-3 w-3" />
                          {t.history.buy}
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3" />
                          {t.history.sell}
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-primary">{tx.symbol}</TableCell>
                  <TableCell className="text-right">{tx.quantity}</TableCell>
                  <TableCell className="text-right">{tx.price} ₫</TableCell>
                  <TableCell className="text-right font-semibold">{tx.total} ₫</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
