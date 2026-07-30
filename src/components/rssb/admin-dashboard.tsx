'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Eye,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
  Download,
  Search,
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
  paymentId?: string;
  paidAmount?: number;
}

interface Period {
  id: string;
  label: string;
  isActive: boolean;
}

interface Stats {
  totalSubmissions: number;
  awaitingReview: number;
  underReview: number;
  verified: number;
  paid: number;
}

const STATUS_FILTERS = ['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'PAID'];

export function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [paymentId, setPaymentId] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const initialFetchDone = useRef(false);

  // Load initial data once
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    const init = async () => {
      try {
        const [periodsRes, statsRes] = await Promise.all([
          fetch('/api/periods'),
          fetch('/api/stats'),
        ]);
        const periodsData = await periodsRes.json();
        const statsData = await statsRes.json();

        setPeriods(periodsData);
        setStats(statsData);

        const active = periodsData.find((p: Period) => p.isActive);
        if (active) {
          setSelectedPeriod(active.id);
          // Fetch submissions with active period
          const subsRes = await fetch(`/api/submissions?periodId=${active.id}`);
          const subsData = await subsRes.json();
          setSubmissions(subsData);
        }
      } catch {}
    };

    init();
  }, []);

  // Reload submissions when filter/period changes
  const prevPeriod = useRef(selectedPeriod);
  const prevStatus = useRef(statusFilter);

  useEffect(() => {
    if (prevPeriod.current !== selectedPeriod || prevStatus.current !== statusFilter) {
      prevPeriod.current = selectedPeriod;
      prevStatus.current = statusFilter;

      const load = async () => {
        try {
          const params = new URLSearchParams();
          if (statusFilter !== 'ALL') params.set('status', statusFilter);
          if (selectedPeriod && selectedPeriod !== 'all') params.set('periodId', selectedPeriod);

          const res = await fetch(`/api/submissions?${params}`);
          const data = await res.json();
          setSubmissions(data);
        } catch {}
      };

      load();
    }
  }, [selectedPeriod, statusFilter]);

  const refreshData = () => {
    const loadAll = async () => {
      try {
        const [subsRes, statsRes] = await Promise.all([
          fetch(`/api/submissions?status=${statusFilter !== 'ALL' ? statusFilter : ''}${selectedPeriod && selectedPeriod !== 'all' ? '&periodId=' + selectedPeriod : ''}`),
          fetch('/api/stats'),
        ]);
        const [subsData, statsData] = await Promise.all([subsRes.json(), statsRes.json()]);
        setSubmissions(subsData);
        setStats(statsData);
      } catch {}
    };

    loadAll();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        refreshData();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handlePayment = async () => {
    if (!selectedSubmission || !paymentId || !paidAmount) {
      toast.error('Please fill in all payment fields');
      return;
    }
    try {
      const res = await fetch(`/api/submissions/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID', paymentId, paidAmount: parseFloat(paidAmount) }),
      });
      if (res.ok) {
        toast.success('Payment recorded');
        setPaymentDialog(false);
        refreshData();
      }
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const filtered = searchTerm
    ? submissions.filter(
        (s) =>
          s.pharmacy.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.pharmacy.pharmacyCode.includes(searchTerm) ||
          s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : submissions;

  const statusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-700';
      case 'VERIFIED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'PAID': return 'bg-emerald-100 text-emerald-700';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats?.totalSubmissions || 0, icon: <TrendingUp className="h-4 w-4" />, color: 'bg-navy' },
          { label: 'Awaiting Review', value: stats?.awaitingReview || 0, icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-blue-500' },
          { label: 'Under Review', value: stats?.underReview || 0, icon: <Eye className="h-4 w-4" />, color: 'bg-yellow-500' },
          { label: 'Verified', value: stats?.verified || 0, icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-500' },
          { label: 'Paid', value: stats?.paid || 0, icon: <DollarSign className="h-4 w-4" />, color: 'bg-emerald-500' },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.color} text-white`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <div className="relative flex-1 w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by pharmacy name, code, or receipt #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={
                    statusFilter === status
                      ? 'bg-navy text-white hover:bg-navy-light'
                      : 'text-xs'
                  }
                >
                  {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-navy text-white">
                <TableRow>
                  <TableHead className="text-white text-xs">Receipt #</TableHead>
                  <TableHead className="text-white text-xs">Pharmacy</TableHead>
                  <TableHead className="text-white text-xs hidden lg:table-cell">District</TableHead>
                  <TableHead className="text-white text-xs">Period</TableHead>
                  <TableHead className="text-white text-xs text-center">Vouchers</TableHead>
                  <TableHead className="text-white text-xs text-right">Amount</TableHead>
                  <TableHead className="text-white text-xs">Status</TableHead>
                  <TableHead className="text-white text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No submissions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.receiptNumber.slice(-12)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.pharmacy.pharmacyName}</p>
                          <p className="text-xs text-muted-foreground">{s.pharmacy.pharmacyCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{s.pharmacy.district}</TableCell>
                      <TableCell className="text-sm">{s.period.label}</TableCell>
                      <TableCell className="text-center">{s.voucherCount}</TableCell>
                      <TableCell className="text-right">{(s.invoiceTotalAmount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${statusColor(s.status)}`}>{s.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                            <a href={`/api/receipts/${s.id}/pdf`} target="_blank">
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                          {s.status === 'SUBMITTED' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-yellow-600" onClick={() => updateStatus(s.id, 'UNDER_REVIEW')}>
                              <Eye className="h-3 w-3 mr-1" /> Review
                            </Button>
                          )}
                          {s.status === 'UNDER_REVIEW' && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => updateStatus(s.id, 'VERIFIED')}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => updateStatus(s.id, 'REJECTED')}>
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {s.status === 'VERIFIED' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600" onClick={() => { setSelectedSubmission(s); setPaymentDialog(true); }}>
                              <DollarSign className="h-3 w-3 mr-1" /> Pay
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.pharmacy.pharmacyName} — {selectedSubmission?.receiptNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Payment ID</Label>
              <Input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="e.g. PAY-2025-001" />
            </div>
            <div className="space-y-2">
              <Label>Paid Amount (RWF)</Label>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={selectedSubmission?.invoiceTotalAmount?.toString()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePayment}>
              <DollarSign className="h-4 w-4 mr-1" /> Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
