import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ACCIDENT_TYPES = [
  'Slip/Fall', 'Playground', 'PE Activity', 'Recess',
  'Classroom', 'Fighting', 'Bite', 'Other'
];

const INJURY_TYPES = [
  'Wound', 'Sprain', 'Strain', 'Abrasion',
  'Bump', 'Bruise', 'Eyes', 'Teeth', 'Split Lip/Mouth', 'Other'
];

const ACTIONS_TAKEN = [
  'Washed with water',
  'Applied Anti-septic/Medication',
  'Applied Ice Pack',
  'Applied Band-Aid/Bandage',
  'Other'
];

function CheckGroup({ label, options, selected, onChange, otherKey, otherValue, onOtherChange }) {
  return (
    <div>
      <h3 className="font-bold text-sm uppercase tracking-wide text-slate-700 border-b border-slate-200 pb-1 mb-3">{label}</h3>
      <div className="space-y-2">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
            <div
              onClick={() => onChange(opt)}
              className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer
                ${selected.includes(opt) ? 'bg-slate-800 border-slate-800' : 'border-slate-400 group-hover:border-slate-600'}`}
            >
              {selected.includes(opt) && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm text-slate-700">{opt}</span>
          </label>
        ))}
        {otherKey && selected.includes('Other') && (
          <div className="ml-6 mt-1">
            <Input
              className="text-sm h-8"
              placeholder="Please specify..."
              value={otherValue || ''}
              onChange={e => onOtherChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function RadioPair({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-6">
      <span className="text-sm font-medium text-slate-700 w-52">{label}</span>
      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => onChange('yes')}
          className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center transition-colors cursor-pointer
            ${value === 'yes' ? 'bg-slate-800 border-slate-800' : 'border-slate-400 hover:border-slate-600'}`}
        >
          {value === 'yes' && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-sm text-slate-700">Yes</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => onChange('no')}
          className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center transition-colors cursor-pointer
            ${value === 'no' ? 'bg-slate-800 border-slate-800' : 'border-slate-400 hover:border-slate-600'}`}
        >
          {value === 'no' && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-sm text-slate-700">No</span>
      </label>
    </div>
  );
}

export default function AccidentReportModal({ open, onOpenChange, students, onSent }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [division, setDivision] = useState('');
  const [form, setForm] = useState({
    student_id: '',
    date_of_accident: new Date().toISOString().split('T')[0],
    time_of_accident: '',
    time_period: 'am',
    accident_types: [],
    accident_type_other: '',
    injury_types: [],
    injury_type_other: '',
    how_it_happened: '',
    actions_taken: [],
    action_other: '',
    witnessed_by: '',
    witness_date: new Date().toISOString().split('T')[0],
    attended_by: '',
    attended_date: new Date().toISOString().split('T')[0],
    parent_contacted: '',
    copy_given: '',
  });

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleCheck = (key, val) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val]
    }));
  };

  const handleSubmit = async () => {
    if (!form.student_id) return;
    setSaving(true);
    const user = await base44.auth.me();
    const student = students.find(s => s.id === form.student_id);

    const doc = await base44.entities.StudentDocument.create({
      student_id: form.student_id,
      template_type: 'accident_report',
      title: 'Accident Report',
      submitted_by: user.email,
      submitted_by_name: user.full_name,
      form_data: { ...form, division },
      notes: form.how_it_happened,
      parent_notified: false,
      status: 'submitted',
    });

    // Notify parent
    await base44.functions.invoke('sendDocumentNotification', { studentDocumentId: doc.id }).catch(() => {});

    toast({ title: 'Accident Report submitted', description: `Report filed for ${student?.first_name} ${student?.last_name}.` });
    setSaving(false);
    onSent();
    onOpenChange(false);
  };

  const isValid = !!form.student_id && !!form.how_it_happened;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-slate-900 text-white px-8 py-5 rounded-t-xl">
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-wide uppercase">Accident Report</h1>
            <p className="text-slate-300 text-sm mt-1">Calvary Christian School · Sacramento, CA 95824 · (916) 393-3633</p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Division */}
          <div className="flex gap-8 justify-center border border-slate-200 rounded-lg p-4 bg-slate-50">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setDivision('school')}
                className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-colors cursor-pointer
                  ${division === 'school' ? 'bg-slate-800 border-slate-800' : 'border-slate-400 hover:border-slate-600'}`}
              >
                {division === 'school' && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="font-semibold text-slate-700">🏫 School (K–12)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setDivision('preschool')}
                className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-colors cursor-pointer
                  ${division === 'preschool' ? 'bg-slate-800 border-slate-800' : 'border-slate-400 hover:border-slate-600'}`}
              >
                {division === 'preschool' && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="font-semibold text-slate-700">🧸 Preschool</span>
            </label>
          </div>

          {/* Student & Date/Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Child's Name *</label>
              <Select value={form.student_id} onValueChange={v => setField('student_id', v)}>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1">Date of Accident</label>
                <Input type="date" value={form.date_of_accident} onChange={e => setField('date_of_accident', e.target.value)} className="h-10" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1">Time of Accident</label>
                <div className="flex gap-1">
                  <Input
                    placeholder="00:00"
                    value={form.time_of_accident}
                    onChange={e => setField('time_of_accident', e.target.value)}
                    className="h-10 flex-1"
                  />
                  <Select value={form.time_period} onValueChange={v => setField('time_period', v)}>
                    <SelectTrigger className="h-10 w-16"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="am">AM</SelectItem>
                      <SelectItem value="pm">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Dear Parent notice */}
          <div className="border border-blue-200 bg-blue-50 rounded-lg px-4 py-3">
            <p className="text-sm text-blue-900 font-medium">Dear Parent,</p>
            <p className="text-sm text-blue-800 mt-0.5">This is to inform you that your child was involved in an accident today.</p>
          </div>

          {/* Type of Accident + Nature of Injury */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-slate-200 rounded-lg p-5">
            <CheckGroup
              label="Type of Accident"
              options={ACCIDENT_TYPES}
              selected={form.accident_types}
              onChange={v => toggleCheck('accident_types', v)}
              otherKey="accident_type_other"
              otherValue={form.accident_type_other}
              onOtherChange={v => setField('accident_type_other', v)}
            />
            <div className="md:border-l md:border-slate-200 md:pl-6">
              <CheckGroup
                label="Nature of Injury"
                options={INJURY_TYPES}
                selected={form.injury_types}
                onChange={v => toggleCheck('injury_types', v)}
                otherKey="injury_type_other"
                otherValue={form.injury_type_other}
                onOtherChange={v => setField('injury_type_other', v)}
              />
            </div>
          </div>

          {/* How it happened */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1.5">How it happened: *</label>
            <Textarea
              rows={3}
              placeholder="Describe in detail how the accident occurred..."
              value={form.how_it_happened}
              onChange={e => setField('how_it_happened', e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Action Taken */}
          <div className="border border-slate-200 rounded-lg p-5">
            <CheckGroup
              label="Action Taken"
              options={ACTIONS_TAKEN}
              selected={form.actions_taken}
              onChange={v => toggleCheck('actions_taken', v)}
              otherKey="action_other"
              otherValue={form.action_other}
              onOtherChange={v => setField('action_other', v)}
            />
          </div>

          {/* Witnessed / Attended by */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Witnessed by</label>
              <Input value={form.witnessed_by} onChange={e => setField('witnessed_by', e.target.value)} placeholder="Full name" className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Date</label>
              <Input type="date" value={form.witness_date} onChange={e => setField('witness_date', e.target.value)} className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Attended by</label>
              <Input value={form.attended_by} onChange={e => setField('attended_by', e.target.value)} placeholder="Full name" className="h-10" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Date</label>
              <Input type="date" value={form.attended_date} onChange={e => setField('attended_date', e.target.value)} className="h-10" />
            </div>
          </div>

          {/* Parent/Guardian */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
            <RadioPair label="Parent/Guardian Contacted:" value={form.parent_contacted} onChange={v => setField('parent_contacted', v)} />
            <RadioPair label="Copy Given to Parent/Guardian:" value={form.copy_given} onChange={v => setField('copy_given', v)} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              className="flex-1 bg-slate-900 hover:bg-slate-800"
              onClick={handleSubmit}
              disabled={!isValid || saving}
            >
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Accident Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}