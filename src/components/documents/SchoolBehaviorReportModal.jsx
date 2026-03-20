import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const BEHAVIOR_PROBLEMS = [
  'Disrespectful Comment',
  'Arguing with Teacher',
  'Cheating',
  'Chewing Gum',
  'Inappropriate Language/Behavior',
  'Rough-Housing in Class',
  'Repeated Talking',
  'Phone/Entertainment Device',
  'Classroom Disturbance',
  'Disobedient',
  'Fighting',
  'Leaving Class w/o Permission',
  'Name Calling',
  'Refusing to Follow Directions',
  'Throwing Objects',
];

const DISCIPLINE_PROCEDURES = [
  'Student has received a verbal warning.',
  'Student has received detention.',
  'Parent/Teacher/Principal Conference needs to be scheduled. Please call for appointment.',
  'Student has been suspended.',
  'Other',
];

const ADMIN_ACTIONS = [
  'Principal has discussed this problem with your child.',
  'Parent/Teacher/Principal Conference needs to be scheduled. Please call for appointment.',
  'In-class suspension',
  'After-school detention',
  'Warning issued',
  'Other',
];

function CheckItem({ label, checked, onChange }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <div
        onClick={onChange}
        className={`mt-0.5 w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer
          ${checked ? 'bg-slate-900 border-slate-900' : 'border-slate-400 group-hover:border-slate-700'}`}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm text-slate-800 font-medium">{label}</span>
    </label>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="bg-slate-900 text-white text-center py-2 px-4 rounded-md">
      <span className="font-bold text-sm uppercase tracking-wide">{title}</span>
    </div>
  );
}

export default function SchoolBehaviorReportModal({ open, onOpenChange, students, teachers = [], onSent }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    br_number: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    grade: '',
    teacher: '',
    location: '',
    behavior_problems: [],
    behavior_other: '',
    discipline_procedures: [],
    discipline_other: '',
    admin_actions: [],
    admin_other: '',
    additional_notes: '',
    response_required: false,
    parent_signature: '',
  });

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleCheck = (key, val) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));
  };

  const handleSubmit = async () => {
    if (!form.student_id) return;
    setSaving(true);
    const user = await base44.auth.me();
    const student = students.find(s => s.id === form.student_id);

    const communicationLog = [{
      type: 'submitted',
      timestamp: new Date().toISOString(),
      by: user.full_name,
      details: 'Behavior report submitted'
    }];

    const doc = await base44.entities.StudentDocument.create({
      student_id: form.student_id,
      template_type: 'behavior_report',
      title: 'Behavior Report (School)',
      submitted_by: user.email,
      submitted_by_name: user.full_name,
      form_data: { ...form },
      notes: form.additional_notes,
      response_required: form.response_required,
      communication_log: communicationLog,
      parent_notified: false,
      status: 'submitted',
    });

    await base44.functions.invoke('sendDocumentNotification', { studentDocumentId: doc.id }).catch(() => {});

    toast({ 
      title: 'Behavior Report submitted', 
      description: `Report filed for ${student?.first_name} ${student?.last_name}${form.response_required ? ' (Response required)' : ''}.` 
    });
    setSaving(false);
    onSent();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-slate-900 text-white px-8 py-5 rounded-t-xl text-center">
          <h1 className="text-xl font-black tracking-wide uppercase">Calvary Christian School</h1>
          <p className="text-base font-bold text-slate-200 mt-0.5">Behavior Report</p>
          <p className="text-slate-400 text-xs mt-1">4911 47th Avenue Sacramento, CA 95824 · (916) 393-3633</p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Student Info Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Student Name *</label>
              <Select value={form.student_id} onValueChange={v => {
                const s = students.find(st => st.id === v);
                setForm(f => ({ ...f, student_id: v, grade: s?.grade_level || f.grade }));
              }}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select student..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} — Grade {s.grade_level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">BR #</label>
              <Input value={form.br_number} onChange={e => setField('br_number', e.target.value)} placeholder="e.g. 042" className="h-10" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Date</label>
              <Input type="date" value={form.date} onChange={e => setField('date', e.target.value)} className="h-10" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Time</label>
              <Input value={form.time} onChange={e => setField('time', e.target.value)} placeholder="e.g. 10:30 AM" className="h-10" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Grade</label>
              <Input value={form.grade} onChange={e => setField('grade', e.target.value)} placeholder="e.g. 7" className="h-10" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Teacher</label>
              <Select value={form.teacher} onValueChange={v => setField('teacher', v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={`${t.first_name} ${t.last_name}`}>{t.first_name} {t.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Location</label>
            <Input value={form.location} onChange={e => setField('location', e.target.value)} placeholder="e.g. Classroom, Hallway, Cafeteria..." className="h-10" />
          </div>

          {/* Description of Behavior Problems */}
          <div className="space-y-3">
            <SectionHeader title="Description of Behavior Problem(s)" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 pt-1 px-1">
              {BEHAVIOR_PROBLEMS.map(b => (
                <CheckItem
                  key={b}
                  label={b}
                  checked={form.behavior_problems.includes(b)}
                  onChange={() => toggleCheck('behavior_problems', b)}
                />
              ))}
            </div>
            <div className="ml-6 pt-2">
              <Input
                placeholder="Other behavior issues (if applicable)..."
                value={form.behavior_other}
                onChange={e => setField('behavior_other', e.target.value)}
                className="text-sm h-8"
              />
            </div>
          </div>

          {/* Classroom Discipline Procedure */}
          <div className="space-y-3">
            <SectionHeader title="Classroom Discipline Procedure" />
            <div className="space-y-2.5 pt-1 px-1">
              {DISCIPLINE_PROCEDURES.map(d => (
                <CheckItem
                  key={d}
                  label={d}
                  checked={form.discipline_procedures.includes(d)}
                  onChange={() => toggleCheck('discipline_procedures', d)}
                />
              ))}
              {form.discipline_procedures.includes('Other') && (
                <div className="ml-6">
                  <Input
                    className="text-sm h-8"
                    placeholder="Please specify..."
                    value={form.discipline_other}
                    onChange={e => setField('discipline_other', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Administration Action */}
          <div className="space-y-3">
            <SectionHeader title="Administration Action" />
            <div className="space-y-2.5 pt-1 px-1">
              {ADMIN_ACTIONS.map(a => (
                <CheckItem
                  key={a}
                  label={a}
                  checked={form.admin_actions.includes(a)}
                  onChange={() => toggleCheck('admin_actions', a)}
                />
              ))}
              {form.admin_actions.includes('Other') && (
                <div className="ml-6 space-y-2">
                  <Input
                    className="text-sm h-8"
                    placeholder="Please specify..."
                    value={form.admin_other}
                    onChange={e => setField('admin_other', e.target.value)}
                  />
                  <Textarea
                    rows={2}
                    placeholder="Additional details..."
                    value={form.additional_notes}
                    onChange={e => setField('additional_notes', e.target.value)}
                    className="text-sm resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Additional notes if no Other checked */}
          {!form.admin_actions.includes('Other') && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Additional Notes</label>
              <Textarea
                rows={2}
                placeholder="Any additional details..."
                value={form.additional_notes}
                onChange={e => setField('additional_notes', e.target.value)}
                className="resize-none"
              />
            </div>
          )}

          {/* Workflow Options */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <SectionHeader title="Workflow & Follow-up" />
            <label className="flex items-center gap-2.5 cursor-pointer px-1">
              <div
                onClick={() => setField('response_required', !form.response_required)}
                className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer
                  ${form.response_required ? 'bg-slate-900 border-slate-900' : 'border-slate-400 hover:border-slate-700'}`}
              >
                {form.response_required && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-slate-800 font-medium">Require parent response (track confirmation)</span>
            </label>
            <p className="text-xs text-slate-500 px-1 ml-6">
              If enabled, parent must acknowledge receipt and confirm they reviewed this report. Follow-up notifications will be sent if no response within 3 days.
            </p>
          </div>

          {/* Parent Signature */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <SectionHeader title="Parent Signature" />
            <p className="text-xs text-slate-500 px-1">
              Once submitted, the parent will receive a notification to review and digitally sign this report.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              className="flex-1 bg-slate-900 hover:bg-slate-800"
              onClick={handleSubmit}
              disabled={!form.student_id || saving}
            >
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Behavior Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}