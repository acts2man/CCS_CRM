import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function QuickCommunicationModal({ open, onOpenChange, type, parent, student }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  if (!parent || !student) return null;

  const handleSend = async () => {
    if (!message.trim()) {
      toast({ title: 'Error', description: 'Message cannot be empty' });
      return;
    }

    if (type === 'email' && !subject.trim()) {
      toast({ title: 'Error', description: 'Subject cannot be empty' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        parentName: `${parent.first_name} ${parent.last_name}`,
        studentName: `${student.first_name} ${student.last_name}`,
        parentId: parent.id,
        studentId: student.id,
        message: message
      };

      if (type === 'email') {
        payload.parentEmail = parent.email;
        payload.subject = subject;
        await base44.functions.invoke('sendParentEmail', payload);
      } else if (type === 'sms') {
        payload.parentPhone = parent.phone;
        await base44.functions.invoke('sendParentSMS', payload);
      }

      toast({ 
        title: 'Success', 
        description: `${type.toUpperCase()} sent to ${parent.first_name} ${parent.last_name}` 
      });
      
      setSubject('');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.message || `Failed to send ${type}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Send {type.toUpperCase()} to {parent.first_name} {parent.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">
              <p><strong>Student:</strong> {student.first_name} {student.last_name}</p>
              <p><strong>Parent:</strong> {parent.first_name} {parent.last_name}</p>
              {type === 'email' && <p><strong>Email:</strong> {parent.email}</p>}
              {type === 'sms' && <p><strong>Phone:</strong> {parent.phone}</p>}
            </div>
          </div>

          {/* Email Subject (only for email) */}
          {type === 'email' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Subject</label>
              <Input
                placeholder="e.g., Update about your child's progress"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {type === 'email' ? 'Message' : 'SMS Message'} {type === 'sms' && <span className="text-xs text-gray-500">(max 160 chars)</span>}
            </label>
            <Textarea
              placeholder={
                type === 'email'
                  ? 'Type your message here...'
                  : 'Type your SMS message (keep it brief and clear)...'
              }
              value={message}
              onChange={(e) => {
                if (type === 'sms') {
                  setMessage(e.target.value.slice(0, 160));
                } else {
                  setMessage(e.target.value);
                }
              }}
              disabled={loading}
              className="resize-none h-32"
              maxLength={type === 'sms' ? 160 : undefined}
            />
            {type === 'sms' && (
              <p className="text-xs text-gray-500 mt-1">{message.length}/160 characters</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send ${type.toUpperCase()}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}