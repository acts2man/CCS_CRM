import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function SubjectAddAssignmentModal({ classSection, subject, categories, preSelectedCategory, onClose, onCreated }) {
  const [form, setForm] = useState({
    grade_category_id: preSelectedCategory?.id || (categories[0]?.id || ''),
    title: '',
    description: '',
    points_possible: 100,
    due_date: '',
    assigned_date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.grade_category_id || !form.title) return;
    setSaving(true);
    const cat = categories.find(c => c.id === form.grade_category_id);
    await base44.entities.Assignment.create({
      ...form,
      class_section_id: classSection.id,
      category_name: cat?.name || '',
      points_possible: parseFloat(form.points_possible) || 100,
      is_published: true
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Assignment — {subject.name}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Component *</Label>
            <Select value={form.grade_category_id} onValueChange={v => setForm(f => ({...f, grade_category_id: v}))}>
              <SelectTrigger><SelectValue placeholder="Select component" /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.weight}%)</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assignment Title *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Chapter 5 Essay" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Points Possible</Label>
              <Input type="number" value={form.points_possible} onChange={e => setForm(f => ({...f, points_possible: e.target.value}))} />
            </div>
            <div>
              <Label>Assigned Date</Label>
              <Input type="date" value={form.assigned_date} onChange={e => setForm(f => ({...f, assigned_date: e.target.value}))} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={save} disabled={!form.grade_category_id || !form.title || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Add Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}