import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const CHARGE_TYPES = ['tuition','field_trip','fundraiser','registration','lunch','aftercare','uniform','textbook','technology','other'];

export default function AddChargeModal({ students, preSelectedStudentId, onClose, onCreated }) {
  const [form, setForm] = useState({
    student_id: preSelectedStudentId || '',
    charge_type: 'tuition',
    description: '',
    amount: '',
    due_date: '',
    school_year: '2025-2026',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.student_id || !form.amount) return;
    setSaving(true);
    const student = students.find(s => s.id === form.student_id);
    await base44.entities.Charge.create({
      ...form,
      amount: parseFloat(form.amount),
      paid_amount: 0,
      status: 'unpaid',
      student_name: student ? `${student.first_name} ${student.last_name}` : ''
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Charge</DialogTitle></DialogHeader>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Charge Type *</Label>
              <Select value={form.charge_type} onValueChange={v => setForm(f=>({...f, charge_type: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHARGE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount ($) *</Label>
              <Input type="number" value={form.amount} onChange={e => setForm(f=>({...f, amount: e.target.value}))} placeholder="0.00" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={e => setForm(f=>({...f, description: e.target.value}))} placeholder="e.g. Fall Field Trip to Science Museum" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm(f=>({...f, due_date: e.target.value}))} />
            </div>
            <div>
              <Label>School Year</Label>
              <Select value={form.school_year} onValueChange={v => setForm(f=>({...f, school_year: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-2026">2025–2026</SelectItem>
                  <SelectItem value="2024-2025">2024–2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={form.notes} onChange={e => setForm(f=>({...f, notes: e.target.value}))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={save} disabled={!form.student_id || !form.amount || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Add Charge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}