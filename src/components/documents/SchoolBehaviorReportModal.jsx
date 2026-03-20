import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

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

const ADMIN_ACTIONS = [
  'Principal has discussed this problem with your child.',
  'Parent/Teacher/Principal Conference needs to be scheduled. Please call for appointment.',
];

export default function SchoolBehaviorReportModal({ open, onOpenChange, students, onSent }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    br_number: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    grade: '',
    teacher: '',
    location: '',
    selected_behaviors: [],
    explanation: '',
    principal_discussed: false,
    conference_needed: false,
    other_action: '',
    parent_signature: '',
  });

  const handleBehaviorToggle = (behavior) => {
    setForm(prev => ({
      ...prev,
      selected_behaviors: prev.selected_behaviors.includes(behavior)
        ? prev.selected_behaviors.filter(b => b !== behavior)
        : [...prev.selected_behaviors, behavior]
    }));
  };

  const handleSubmit = async () => {
    if (!form.student_id) {
      toast({ title: 'Error', description: 'Please select a student' });
      return;
    }

    setLoading(true);
    try {
      const student = students.find(s => s.id === form.student_id);
      const studentName = student ? `${student.first_name} ${student.last_name}` : 'Unknown';

      const user = await base44.auth.me();

      await base44.entities.StudentDocument.create({
        student_id: form.student_id,
        template_type: 'behavior_report',
        title: 'Behavior Report (School)',
        submitted_by: user.email,
        submitted_by_name: user.full_name,
        form_data: {
          student_name: studentName,
          br_number: form.br_number,
          date: form.date,
          time: form.time,
          grade: form.grade,
          teacher: form.teacher,
          location: form.location,
          behavior_problems: form.selected_behaviors.join(', '),
          explanation: form.explanation,
          principal_discussed: form.principal_discussed,
          conference_needed: form.conference_needed,
          other_action: form.other_action,
        },
        parent_notified: false,
        status: 'submitted',
      });

      toast({ title: 'Behavior report submitted successfully' });
      onSent();
      onOpenChange(false);
      setForm({
        student_id: '',
        br_number: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        grade: '',
        teacher: '',
        location: '',
        selected_behaviors: [],
        explanation: '',
        principal_discussed: false,
        conference_needed: false,
        other_action: '',
        parent_signature: '',
      });
    } catch (error) {
      toast({ title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>School Behavior Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student & Report Info */}
          <div>
            <label className="block text-sm font-medium mb-2">Student</label>
            <Select value={form.student_id} onValueChange={(val) => setForm({...form, student_id: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Select student..." />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">BR#</label>
              <Input value={form.br_number} onChange={(e) => setForm({...form, br_number: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <Input type="time" value={form.time} onChange={(e) => setForm({...form, time: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Grade</label>
              <Input value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Teacher</label>
              <Input value={form.teacher} onChange={(e) => setForm({...form, teacher: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} />
            </div>
          </div>

          {/* Behavior Problems */}
          <div>
            <label className="block text-sm font-semibold mb-3">Description of Behavior Problem(s)</label>
            <div className="grid grid-cols-2 gap-3">
              {BEHAVIOR_PROBLEMS.map(behavior => (
                <label key={behavior} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.selected_behaviors.includes(behavior)}
                    onCheckedChange={() => handleBehaviorToggle(behavior)}
                  />
                  <span className="text-sm">{behavior}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium mb-2">Explanation of Behavior Report</label>
            <Textarea
              value={form.explanation}
              onChange={(e) => setForm({...form, explanation: e.target.value})}
              placeholder="Describe the incident..."
              className="min-h-24"
            />
          </div>

          {/* Administration Action */}
          <div>
            <label className="block text-sm font-semibold mb-3">Administration Action</label>
            <div className="space-y-2">
              {ADMIN_ACTIONS.map((action, idx) => (
                <label key={idx} className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={idx === 0 ? form.principal_discussed : form.conference_needed}
                    onCheckedChange={() => {
                      if (idx === 0) setForm({...form, principal_discussed: !form.principal_discussed});
                      else setForm({...form, conference_needed: !form.conference_needed});
                    }}
                  />
                  <span className="text-sm">{action}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Other Action */}
          <div>
            <label className="block text-sm font-medium mb-2">Other:</label>
            <Textarea
              value={form.other_action}
              onChange={(e) => setForm({...form, other_action: e.target.value})}
              placeholder="Additional action taken..."
              className="min-h-16"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Submit Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}