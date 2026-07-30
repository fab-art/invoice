'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Upload,
  Search,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';

interface Pharmacy {
  id: string;
  pharmacyCode: string;
  pharmacyName: string;
  district: string;
  sector: string;
  contactPerson: string;
  phone: string;
  email: string;
  active: boolean;
}

export function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [editPharmacy, setEditPharmacy] = useState<Pharmacy | null>(null);
  const [form, setForm] = useState({ pharmacyCode: '', pharmacyName: '', district: '', sector: '', contactPerson: '', phone: '', email: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPharmacies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacies?search=${encodeURIComponent(search)}&includeInactive=${showInactive}`);
      const data = await res.json();
      setPharmacies(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [search, showInactive]);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  const resetForm = () => {
    setForm({ pharmacyCode: '', pharmacyName: '', district: '', sector: '', contactPerson: '', phone: '', email: '' });
  };

  const handleAdd = async () => {
    if (!form.pharmacyCode || !form.pharmacyName || !form.district) {
      toast.error('Code, name, and district are required');
      return;
    }
    try {
      const res = await fetch('/api/pharmacies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to add pharmacy');
        return;
      }
      toast.success('Pharmacy added successfully');
      setAddDialog(false);
      resetForm();
      fetchPharmacies();
    } catch {
      toast.error('Failed to add pharmacy');
    }
  };

  const handleEdit = async () => {
    if (!editPharmacy) return;
    try {
      const res = await fetch(`/api/pharmacies/${editPharmacy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Pharmacy updated');
        setEditPharmacy(null);
        resetForm();
        fetchPharmacies();
      }
    } catch {
      toast.error('Failed to update pharmacy');
    }
  };

  const openEdit = (p: Pharmacy) => {
    setEditPharmacy(p);
    setForm({
      pharmacyCode: p.pharmacyCode,
      pharmacyName: p.pharmacyName,
      district: p.district,
      sector: p.sector,
      contactPerson: p.contactPerson,
      phone: p.phone,
      email: p.email,
    });
  };

  const toggleActive = async (p: Pharmacy) => {
    try {
      const res = await fetch(`/api/pharmacies/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !p.active }),
      });
      if (res.ok) {
        toast.success(`${p.pharmacyName} ${p.active ? 'deactivated' : 'activated'}`);
        fetchPharmacies();
      }
    } catch {
      toast.error('Failed to toggle pharmacy status');
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/pharmacies/bulk-import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      toast.success(`Imported ${data.created} pharmacies${data.skipped ? `, ${data.skipped} skipped` : ''}`);
      fetchPharmacies();
    } catch {
      toast.error('Import failed');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const PharmDialog = ({ mode }: { mode: 'add' | 'edit' }) => (
    <Dialog open={mode === 'add' ? addDialog : !!editPharmacy} onOpenChange={(open) => { if (mode === 'add') setAddDialog(open); else setEditPharmacy(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Pharmacy' : 'Edit Pharmacy'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Add a new pharmacy to the system.' : `Editing ${editPharmacy?.pharmacyName}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Code *</Label>
              <Input
                value={form.pharmacyCode}
                onChange={(e) => setForm({ ...form, pharmacyCode: e.target.value })}
                placeholder="e.g. 201331049"
                disabled={mode === 'edit'}
              />
            </div>
            <div className="space-y-1">
              <Label>District *</Label>
              <Input
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                placeholder="e.g. Kigali"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Pharmacy Name *</Label>
            <Input
              value={form.pharmacyName}
              onChange={(e) => setForm({ ...form, pharmacyName: e.target.value })}
              placeholder="e.g. MEDPLUS PHARMACY"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Contact Person</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Sector</Label>
              <Input
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { if (mode === 'add') setAddDialog(false); else setEditPharmacy(null); }}>Cancel</Button>
          <Button className="bg-navy hover:bg-navy-light text-white" onClick={mode === 'add' ? handleAdd : handleEdit}>
            {mode === 'add' ? 'Add Pharmacy' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-navy flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Pharmacy Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pharmacies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
              className="text-xs"
            >
              {showInactive ? 'Hide Inactive' : 'Show Inactive'}
            </Button>

            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" /> Import Excel
              </Button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleBulkImport} />

              <Button
                size="sm"
                className="bg-navy hover:bg-navy-light text-white"
                onClick={() => { resetForm(); setAddDialog(true); }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Pharmacy
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-navy text-white sticky top-0">
                <TableRow>
                  <TableHead className="text-white text-xs">Code</TableHead>
                  <TableHead className="text-white text-xs">Pharmacy Name</TableHead>
                  <TableHead className="text-white text-xs hidden sm:table-cell">District</TableHead>
                  <TableHead className="text-white text-xs hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="text-white text-xs">Status</TableHead>
                  <TableHead className="text-white text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pharmacies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No pharmacies found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pharmacies.map((p) => (
                    <TableRow key={p.id} className={!p.active ? 'opacity-50' : ''}>
                      <TableCell className="font-mono text-xs">{p.pharmacyCode}</TableCell>
                      <TableCell className="font-medium">{p.pharmacyName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{p.district}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {p.contactPerson || p.phone || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.active ? 'default' : 'secondary'} className="text-[10px]">
                          {p.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => openEdit(p)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => toggleActive(p)}>
                            {p.active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">{pharmacies.length} pharmacies shown</p>
        </CardContent>
      </Card>

      <PharmDialog mode="add" />
      <PharmDialog mode="edit" />
    </div>
  );
}
