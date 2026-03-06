import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle } from 'lucide-react';

const METHODS = ['cash','check','credit_card','bank_transfer','stripe','other'];

export default function RecordPaymentModal({ students, charges, preSelectedStudentId, onClose, onCreated }) {
  const [form, setForm] = useState({
    student_id: preSelectedStudentId || '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    method: 'cash',
    reference_number: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const studentCharges = charges.filter(c => c.student_id === form.student_id && (c.status === 'unpaid' || c.status === 'partial'));
  const totalOwed = studentCharges.reduce((sum, c) => sum + (c.amount - (c.paid_amount||0)), 0);

  const save = async () => {
    if (!form.student_id || !form.amount) return;
    setSaving(true);
    const student = students.find(s => s.id === form.student_id);
    const payAmount = parseFloat(form.amount);

    await base44.entities.Payment.create({
      ...form,
      amount: payAmount,
      student_name: student ? `${student.first_name} ${student.last_name}` : ''
    });

    // Apply payment to charges (oldest first)
    let remaining = payAmount;
    const sortedCharges = [...studentCharges].sort((a,b) => new Date(a.created_date||0) - new Date(b.created_date||0));
    for (const charge of sortedCharges) {
      if (remaining <= 0) break;
      const owed = charge.amount - (charge.paid_amount||0);
      const paying = Math.min(owed, remaining);
      const newPaid = (charge.paid_amount||0) + paying;
      remaining -= paying;
      await base44.entities.Charge.update(charge.id, {
        paid_amount: newPaid,
        status: newPaid >= charge.amount ? 'paid' : 'partial'
      });
    }

    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Student *</Label>
            <Select value={form.student_id} onValueChange={v => setForm(f=>({...f, student_id: v}))}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} (Gr {s.grade_level})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.student_id && totalOwed > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <span className="text-yellow-800">Outstanding balance: <strong>${totalOwed.toFixed(2)}</strong></span>
            </div>
          )}
          {form.student_id && totalOwed === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-800">No outstanding balance for this student.</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount ($) *</Label>
              <Input type="number" value={form.amount} onChange={e => setForm(f=>({...f, amount: e.target.value}))} placeholder="0.00" />
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={form.payment_date} onChange={e => setForm(f=>({...f, payment_date: e.target.value}))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Method</Label>
              <Select value={form.method} onValueChange={v => setForm(f=>({...f, method: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map(m => <SelectItem key={m} value={m} className="capitalize">{m.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference # (check / receipt)</Label>
              <Input value={form.reference_number} onChange={e => setForm(f=>({...f, reference_number: e.target.value}))} placeholder="e.g. #1042" />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={form.notes} onChange={e => setForm(f=>({...f, notes: e.target.value}))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={save} disabled={!form.student_id || !form.amount || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Record Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}