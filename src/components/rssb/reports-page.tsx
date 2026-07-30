'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  BarChart3,
  FileDown,
} from 'lucide-react';

interface Submission {
  id: string;
  receiptNumber: string;
  pharmacy: { pharmacyCode: string; pharmacyName: string; district: string };
  period: { label: string };
  voucherCount: number;
  invoiceTotalAmount: number;
  submittedByName: string;
  receivedAt: string;
  status: string;
}

interface Period {
  id: string;
  label: string;
  isActive: boolean;
}

function SummaryCards({ totals, label }: { totals: { submissions: number; vouchers: number; amount: number }; label: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      <Card className="border-l-4 border-l-navy">
        <CardContent className="p-3 flex items-center gap-3">
          <FileText className="h-5 w-5 text-navy" />
          <div>
            <p className="text-lg font-bold text-navy">{totals.submissions}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-gold">
        <CardContent className="p-3 flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-gold-dark" />
          <div>
            <p className="text-lg font-bold text-gold-dark">{totals.vouchers}</p>
            <p className="text-xs text-muted-foreground">Total Vouchers</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-3 flex items-center gap-3">
          <FileDown className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-lg font-bold text-green-700">{totals.amount.toLocaleString()} RWF</p>
            <p className="text-xs text-muted-foreground">Total Amount</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'SUBMITTED': return 'bg-blue-100 text-blue-700';
    case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-700';
    case 'VERIFIED': return 'bg-green-100 text-green-700';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    case 'PAID': return 'bg-emerald-100 text-emerald-700';
    default: return '';
  }
}

function ReportTable({ submissions }: { submissions: Submission[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader className="bg-navy text-white">
          <TableRow>
            <TableHead className="text-white w-10">#</TableHead>
            <TableHead className="text-white">Code</TableHead>
            <TableHead className="text-white">Health Facility</TableHead>
            <TableHead className="text-white">District</TableHead>
            <TableHead className="text-white">Date</TableHead>
            <TableHead className="text-white">Vouchers</TableHead>
            <TableHead className="text-white">Amount (RWF)</TableHead>
            <TableHead className="text-white">Submitted By</TableHead>
            <TableHead className="text-white">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No submissions found for this period.
              </TableCell>
            </TableRow>
          ) : (
            submissions.map((s, i) => (
              <TableRow key={s.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="text-xs">{s.pharmacy.pharmacyCode}</TableCell>
                <TableCell className="font-medium">{s.pharmacy.pharmacyName}</TableCell>
                <TableCell>{s.pharmacy.district}</TableCell>
                <TableCell className="text-sm">{new Date(s.receivedAt).toLocaleDateString('en-GB')}</TableCell>
                <TableCell className="text-center">{s.voucherCount}</TableCell>
                <TableCell className="text-right">{(s.invoiceTotalAmount || 0).toLocaleString()}</TableCell>
                <TableCell>{s.submittedByName}</TableCell>
                <TableCell>
                  <Badge className={`text-[10px] ${statusColor(s.status)}`}>{s.status.replace('_', ' ')}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('daily');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [dailyData, setDailyData] = useState<{ submissions: Submission[]; totals: { submissions: number; vouchers: number; amount: number } } | null>(null);
  const [monthlyData, setMonthlyData] = useState<{ submissions: Submission[]; totals: { submissions: number; vouchers: number; amount: number } } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/periods')
      .then((r) => r.json())
      .then((data) => {
        setPeriods(data);
        const active = data.find((p: Period) => p.isActive);
        if (active) setSelectedPeriod(active.id);
      })
      .catch(() => {});
  }, []);

  const fetchDailyReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/daily?date=${dailyDate}`);
      const data = await res.json();
      setDailyData(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [dailyDate]);

  const fetchMonthlyReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?periodId=${selectedPeriod}`);
      const data = await res.json();
      setMonthlyData(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (activeTab === 'daily') fetchDailyReport();
  }, [activeTab, fetchDailyReport]);

  useEffect(() => {
    if (activeTab === 'monthly' && selectedPeriod) fetchMonthlyReport();
  }, [activeTab, selectedPeriod, fetchMonthlyReport]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-navy flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted">
              <TabsTrigger value="daily" className="data-[state=active]:bg-navy data-[state=active]:text-white">
                <Calendar className="h-4 w-4 mr-1" /> Daily Report
              </TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-navy data-[state=active]:text-white">
                <Download className="h-4 w-4 mr-1" /> Monthly Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="space-y-1">
                  <Label className="text-sm">Select Date</Label>
                  <Input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} className="w-48" />
                </div>
                <Button onClick={fetchDailyReport} disabled={loading} className="bg-navy hover:bg-navy-light text-white">
                  <Calendar className="h-4 w-4 mr-1" /> Generate
                </Button>
                <div className="flex gap-2 sm:ml-auto">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/reports/daily/excel?date=${dailyDate}`} download>
                      <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/reports/daily/pdf?date=${dailyDate}`} download>
                      <FileText className="h-4 w-4 mr-1" /> PDF
                    </a>
                  </Button>
                </div>
              </div>

              {dailyData && (
                <>
                  <SummaryCards totals={dailyData.totals} label="Daily Submissions" />
                  <ReportTable submissions={dailyData.submissions} />
                </>
              )}
            </TabsContent>

            <TabsContent value="monthly" className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="space-y-1">
                  <Label className="text-sm">Select Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={fetchMonthlyReport} disabled={loading || !selectedPeriod} className="bg-navy hover:bg-navy-light text-white">
                  <Download className="h-4 w-4 mr-1" /> Generate
                </Button>
                <div className="flex gap-2 sm:ml-auto">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/reports/monthly/excel?periodId=${selectedPeriod}`} download>
                      <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/reports/monthly/pdf?periodId=${selectedPeriod}`} download>
                      <FileText className="h-4 w-4 mr-1" /> PDF
                    </a>
                  </Button>
                </div>
              </div>

              {monthlyData && (
                <>
                  <SummaryCards totals={monthlyData.totals} label="Period Submissions" />
                  <ReportTable submissions={monthlyData.submissions} />
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
