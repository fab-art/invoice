'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';
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
import { ClipboardCheck, Clock, Building2, Download, Mail, CheckCircle2, FileText } from 'lucide-react';

interface Pharmacy {
  id: string;
  pharmacyCode: string;
  pharmacyName: string;
  district: string;
}

interface Period {
  id: string;
  label: string;
  isActive: boolean;
}

interface SubmissionResult {
  id: string;
  receiptNumber: string;
  pharmacy: Pharmacy;
  period: Period;
  voucherCount: number;
  invoiceTotalAmount: number;
  submittedByName: string;
  submittedByPosition: string;
}

export function ReceptionPage() {
  const { user } = useAppStore();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [voucherCount, setVoucherCount] = useState('');
  const [amountBilled, setAmountBilled] = useState('');
  const [submittedByName, setSubmittedByName] = useState('');
  const [submittedByPosition, setSubmittedByPosition] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ submittedToday: 0, remainingPharmacies: 0 });
  const [lastSubmission, setLastSubmission] = useState<SubmissionResult | null>(null);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats({ submittedToday: data.submittedToday, remainingPharmacies: data.remainingPharmacies });
    } catch {}
  }, []);

  // Fetch periods
  useEffect(() => {
    fetch('/api/periods')
      .then((r) => r.json())
      .then((data) => {
        setPeriods(data);
        const active = data.find((p: Period) => p.isActive);
        if (active) setSelectedPeriod(active.id);
      })
      .catch(() => {});
    fetchStats();
  }, [fetchStats]);

  // Pharmacy search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setPharmacies([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`/api/pharmacies?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setPharmacies(data);
      setShowSuggestions(data.length > 0);
    } catch {}
  }, []);

  const selectPharmacy = (p: Pharmacy) => {
    setSelectedPharmacy(p);
    setSearchQuery(p.pharmacyName);
    setShowSuggestions(false);
  };

  const clearPharmacy = () => {
    setSelectedPharmacy(null);
    setSearchQuery('');
    setPharmacies([]);
    setShowSuggestions(false);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPharmacy || !selectedPeriod || !voucherCount || !submittedByName) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: selectedPharmacy.id,
          periodId: selectedPeriod,
          voucherCount: parseInt(voucherCount),
          invoiceTotalAmount: parseFloat(amountBilled) || 0,
          submittedByName,
          submittedByPosition,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Submission failed');
        return;
      }
      toast.success(`Invoice received! Receipt: ${data.receiptNumber}`);
      setLastSubmission(data);
      fetchStats();

      // Reset form
      clearPharmacy();
      setVoucherCount('');
      setAmountBilled('');
      setSubmittedByName('');
      setSubmittedByPosition('');
    } catch {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadReceipt = () => {
    if (!lastSubmission) return;
    window.open(`/api/receipts/${lastSubmission.id}/pdf`, '_blank');
  };

  const emailPharmacy = () => {
    if (!lastSubmission) return;
    const subject = encodeURIComponent(`RSSB Invoice Reception Confirmation - ${lastSubmission.receiptNumber}`);
    const body = encodeURIComponent(
      `Dear ${lastSubmission.pharmacy.pharmacyName},\n\nThis is to confirm that your pharmaceutical invoices have been received by RSSB.\n\nReceipt Number: ${lastSubmission.receiptNumber}\nPeriod: ${lastSubmission.period.label}\nNumber of Vouchers: ${lastSubmission.voucherCount}\nAmount Billed: ${lastSubmission.invoiceTotalAmount?.toLocaleString()} RWF\nReceived By: ${user?.fullName}\nDate: ${new Date().toLocaleDateString('en-GB')}\n\nPlease retain this receipt for your records.\n\nBest regards,\nRSSB Pharmaceutical Invoices Verification Unit`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-navy">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-navy/10">
              <ClipboardCheck className="h-6 w-6 text-navy" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{stats.submittedToday}</p>
              <p className="text-sm text-muted-foreground">Submitted Today</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gold">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-gold/10">
              <Building2 className="h-6 w-6 text-gold-dark" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gold-dark">{stats.remainingPharmacies}</p>
              <p className="text-sm text-muted-foreground">Pharmacies Remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Banner */}
      {lastSubmission && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                Receipt Generated: {lastSubmission.receiptNumber}
              </p>
              <p className="text-xs text-green-600">
                {lastSubmission.pharmacy.pharmacyName} — {lastSubmission.period.label}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={downloadReceipt} className="text-navy border-navy hover:bg-navy hover:text-white">
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={emailPharmacy} className="text-navy border-navy hover:bg-navy hover:text-white">
                <Mail className="h-3.5 w-3.5 mr-1" /> Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy flex items-center gap-2">
            <Clock className="h-5 w-5" />
            New Invoice Reception
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a pharmacy, enter the invoice details, and submit.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pharmacy Search */}
            <div className="space-y-2">
              <Label className="text-navy font-semibold">
                Pharmacy <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => pharmacies.length > 0 && setShowSuggestions(true)}
                  placeholder="Search by name, code, or district..."
                  className="pr-10"
                  required={!selectedPharmacy}
                />
                {selectedPharmacy && (
                  <button
                    type="button"
                    onClick={clearPharmacy}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500 text-lg"
                  >
                    ×
                  </button>
                )}
                {showSuggestions && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {pharmacies.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-navy/5 transition-colors border-b last:border-0"
                        onClick={() => selectPharmacy(p)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{p.pharmacyName}</span>
                          <Badge variant="outline" className="text-[10px] ml-2 shrink-0">{p.pharmacyCode}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{p.district}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-filled pharmacy info */}
              {selectedPharmacy && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-navy/5 rounded-lg border border-navy/10">
                  <div>
                    <p className="text-xs text-muted-foreground">Pharmacy Name</p>
                    <p className="text-sm font-semibold text-navy">{selectedPharmacy.pharmacyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Code</p>
                    <p className="text-sm font-semibold text-navy">{selectedPharmacy.pharmacyCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">District</p>
                    <p className="text-sm font-semibold text-navy">{selectedPharmacy.district}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Period + Voucher Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-navy font-semibold">
                  Submission Period <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod} required>
                  <SelectTrigger className="focus-visible:ring-navy">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label} {p.isActive && <Badge className="ml-2 bg-gold text-navy-dark text-[10px]">Active</Badge>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-navy font-semibold">
                  Number of Vouchers <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={voucherCount}
                  onChange={(e) => setVoucherCount(e.target.value)}
                  placeholder="e.g. 5"
                  required
                  className="focus-visible:ring-navy"
                />
              </div>
            </div>

            {/* Amount + Submitted By */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-navy font-semibold">Amount Billed (RWF)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountBilled}
                  onChange={(e) => setAmountBilled(e.target.value)}
                  placeholder="e.g. 500000"
                  className="focus-visible:ring-navy"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-navy font-semibold">
                  Submitted By (Name) <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={submittedByName}
                  onChange={(e) => setSubmittedByName(e.target.value)}
                  placeholder="Person who submitted"
                  required
                  className="focus-visible:ring-navy"
                />
              </div>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label className="text-navy font-semibold">Position</Label>
              <Input
                value={submittedByPosition}
                onChange={(e) => setSubmittedByPosition(e.target.value)}
                placeholder="e.g. Pharmacy Manager"
                className="focus-visible:ring-navy"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting || !selectedPharmacy || !selectedPeriod || !voucherCount || !submittedByName}
                className="bg-navy hover:bg-navy-light text-white min-w-[180px]"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Submit & Generate Receipt
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
