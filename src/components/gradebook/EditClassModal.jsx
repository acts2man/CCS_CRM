import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const GRADES = ['K','1','2','3','4','5','6','7','8','9','10','11','12'];

export default function EditClassModal({ classSection, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: classSection.name || '',
    teacher_id: classSection.teacher_id || '',
    school_year: classSection.school_year || '2025-2026',
    grade_level: classSection.grade_level || '9',
    period: classSection.period || '',
    room_number: classSection.room_number || '',
    include_on_report_card: classSection.include_on_report_card !== false,
  });
  const [teachers, setTeachers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Teacher.filter({ status: 'Active' }).then(setTeachers);
  }, []);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const teacher = teachers.find(t => t.id === form.teacher_id);
    await base44.entities.ClassSection.update(classSection.id, {
      name: form.name,
      teacher_id: form.teacher_id,
      teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : classSection.teacher_name || '',
      school_year: form.school_year,
      grade_level: form.grade_level,
      period: form.period,
      room_number: form.room_number,
      include_on_report_card: form.include_on_report_card,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Class</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Class Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. English 11" />
          </div>
          <div>
            <Label>Assigned Teacher</Label>
            <Select value={form.teacher_id} onValueChange={v => setForm(f => ({ ...f, teacher_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>School Year</Label>
              <Select value={form.school_year} onValueChange={v => setForm(f => ({ ...f, school_year: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024–2025</SelectItem>
                  <SelectItem value="2025-2026">2025–2026</SelectItem>
                  <SelectItem value="2026-2027">2026–2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade Level</Label>
              <Select value={form.grade_level} onValueChange={v => setForm(f => ({ ...f, grade_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g === 'K' ? 'Kindergarten' : `Grade ${g}`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Period</Label>
              <Input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} placeholder="e.g. 1" />
            </div>
            <div>
              <Label>Room</Label>
              <Input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} placeholder="e.g. 204" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={form.include_on_report_card}
              onCheckedChange={v => setForm(f => ({ ...f, include_on_report_card: v }))}
            />
            <Label className="!mt-0">Include on report card</Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={save} disabled={!form.name || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}