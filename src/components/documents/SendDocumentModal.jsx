import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SendDocumentModal({ open, onOpenChange, template, students, onSent }) {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState('');
  const [notes, setNotes] = useState('');
  const [incident_date, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setStudentId('');
      setNotes('');
      setDescription('');
      setIncidentDate(new Date().toISOString().split('T')[0]);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!studentId || !template) return;
    setSaving(true);

    const user = await base44.auth.me();

    const doc = await base44.entities.StudentDocument.create({
      student_id: studentId,
      template_id: template.id,
      template_type: template.template_type,
      title: template.title,
      submitted_by: user.email,
      submitted_by_name: user.full_name,
      form_data: {
        'Incident Date': incident_date,
        'Description': description,
      },
      notes,
      parent_notified: false,
      status: 'submitted',
    });

    // Trigger parent notification if template requires it
    if (template.notify_parent) {
      await base44.functions.invoke('sendDocumentNotification', { studentDocumentId: doc.id });
      toast({ title: 'Document sent & parent notified', description: `${template.title} attached to student record.` });
    } else {
      toast({ title: 'Document attached', description: `${template.title} added to student record.` });
    }

    setSaving(false);
    onSent();
    onOpenChange(false);
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{template.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Student *</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} — Grade {s.grade_level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Incident Date</Label>
            <Input type="date" value={incident_date} onChange={e => setIncidentDate(e.target.value)} />
          </div>
          <div>
            <Label>Description / Details *</Label>
            <Textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the incident or information..."
            />
          </div>
          <div>
            <Label>Additional Notes</Label>
            <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes..." />
          </div>
          {template.notify_parent && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              ✉️ Parent will be automatically notified by email after submission.
              {template.require_acknowledgment && ' Parent acknowledgment will be required.'}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              className="flex-1 bg-slate-900 hover:bg-slate-800"
              onClick={handleSubmit}
              disabled={saving || !studentId || !description}
            >
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit & Attach to Student'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}