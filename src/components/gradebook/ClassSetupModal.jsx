import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const GRADES = ['K','1','2','3','4','5','6','7','8','9','10','11','12'];

export default function ClassSetupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', course_id: '', teacher_id: '', school_year: '2025-2026', grade_level: '9', period: '', room_number: '' });
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([base44.entities.Course.list(), base44.entities.Teacher.filter({ status: 'Active' })]).then(([c, t]) => {
      setCourses(c);
      setTeachers(t);
    });
  }, []);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const course = courses.find(c => c.id === form.course_id);
    const teacher = teachers.find(t => t.id === form.teacher_id);
    await base44.entities.ClassSection.create({
      ...form,
      course_name: course?.name || '',
      teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : '',
      student_ids: [],
      grade_scale: 'standard_10pt',
      is_active: true
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create New Class Section</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Class Name * <span className="text-gray-400 text-xs font-normal">(e.g. English 11, Middle School Math Period 1)</span></Label>
            <Input value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} placeholder="e.g. English 11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Course</Label>
              <Select value={form.course_id} onValueChange={v => setForm(f=>({...f, course_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher</Label>
              <Select value={form.teacher_id} onValueChange={v => setForm(f=>({...f, teacher_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>School Year</Label>
              <Select value={form.school_year} onValueChange={v => setForm(f=>({...f, school_year: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-2026">2025–2026</SelectItem>
                  <SelectItem value="2024-2025">2024–2025</SelectItem>
                  <SelectItem value="2026-2027">2026–2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade Level</Label>
              <Select value={form.grade_level} onValueChange={v => setForm(f=>({...f, grade_level: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g === 'K' ? 'Kindergarten' : `Grade ${g}`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Period</Label>
              <Input value={form.period} onChange={e => setForm(f=>({...f, period: e.target.value}))} placeholder="e.g. Period 1" />
            </div>
          </div>
          <div>
            <Label>Room Number</Label>
            <Input value={form.room_number} onChange={e => setForm(f=>({...f, room_number: e.target.value}))} placeholder="e.g. 204" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={save} disabled={!form.name || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Create Class
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}