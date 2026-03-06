import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const TEMPLATE_TYPES = [
  { value: 'behavior_report', label: 'Behavior Report' },
  { value: 'accident_report', label: 'Accident Report' },
  { value: 'dress_code_violation', label: 'Dress Code Violation' },
  { value: 'suspension_notice', label: 'Suspension Notice' },
  { value: 'preschool_notes', label: 'Preschool Notes' },
  { value: 'supply_list', label: 'Supply List' },
  { value: 'enrollment_form', label: 'Enrollment Form' },
  { value: 'other', label: 'Other' },
];

export default function CreateTemplateModal({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    template_type: '',
    category: 'both',
    notify_parent: true,
    require_acknowledgment: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title || !form.template_type) return;
    setSaving(true);
    await base44.entities.DocumentTemplate.create({ ...form, is_active: true });
    setSaving(false);
    onCreated();
    onOpenChange(false);
    setForm({ title: '', description: '', template_type: '', category: 'both', notify_parent: true, require_acknowledgment: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Document Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Behavior Report" />
          </div>
          <div>
            <Label>Type *</Label>
            <Select value={form.template_type} onValueChange={v => setForm(f => ({ ...f, template_type: v }))}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="school">School (K-12)</SelectItem>
                <SelectItem value="preschool">Preschool</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Notify parent on submit</Label>
            <Switch checked={form.notify_parent} onCheckedChange={v => setForm(f => ({ ...f, notify_parent: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Require parent acknowledgment</Label>
            <Switch checked={form.require_acknowledgment} onCheckedChange={v => setForm(f => ({ ...f, require_acknowledgment: v }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1 bg-slate-900 hover:bg-slate-800" onClick={handleSave} disabled={saving || !form.title || !form.template_type}>
              {saving ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}