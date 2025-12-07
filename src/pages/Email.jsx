import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Clock, FileText, Users } from 'lucide-react';

export default function Email() {
  const [sendToType, setSendToType] = useState('individual');
  const [recipients, setRecipients] = useState('');
  const [template, setTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recentEmails, setRecentEmails] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadRecentEmails();
  }, []);

  const loadRecentEmails = async () => {
    try {
      const emails = await base44.entities.Message.filter(
        { is_announcement: true },
        '-created_date',
        10
      );
      setRecentEmails(emails);
    } catch (error) {
      console.error('Error loading emails:', error);
    }
  };

  const templates = [
    {
      name: 'Attendance Notice',
      subject: 'Student Attendance Alert',
      message: 'Dear Parent/Guardian,\n\nThis is to inform you about your child\'s attendance. Please contact the school office if you have any questions.\n\nBest regards,\nCalvary Christian School'
    },
    {
      name: 'Grade Update',
      subject: 'Grade Update Notification',
      message: 'Dear Parent/Guardian,\n\nNew grades have been posted for your child. Please log in to the parent portal to view the latest updates.\n\nBest regards,\nCalvary Christian School'
    },
    {
      name: 'Event Reminder',
      subject: 'Upcoming School Event',
      message: 'Dear Families,\n\nThis is a reminder about our upcoming school event. We look forward to seeing you there!\n\nBest regards,\nCalvary Christian School'
    },
    {
      name: 'General Announcement',
      subject: 'School Announcement',
      message: 'Dear Families,\n\nWe wanted to share an important announcement with you.\n\nBest regards,\nCalvary Christian School'
    }
  ];

  const handleTemplateSelect = (templateName) => {
    const selectedTemplate = templates.find(t => t.name === templateName);
    if (selectedTemplate) {
      setSubject(selectedTemplate.subject);
      setMessage(selectedTemplate.message);
      setTemplate(templateName);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Please fill in subject and message');
      return;
    }

    setSending(true);
    try {
      const user = await base44.auth.me();
      
      // Get recipients based on type
      let recipientIds = [];
      if (sendToType === 'all_parents') {
        const parents = await base44.entities.Parent.list();
        recipientIds = parents.map(p => p.id);
      } else if (sendToType === 'grade_level') {
        // For grade level, would need grade selection
        alert('Grade level selection not implemented yet');
        return;
      } else {
        // Individual - parse recipients
        recipientIds = recipients.split(',').map(r => r.trim()).filter(Boolean);
      }

      if (recipientIds.length === 0) {
        alert('Please specify recipients');
        return;
      }

      await base44.entities.Message.create({
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role,
        recipient_ids: recipientIds,
        recipient_type: sendToType === 'all_parents' ? 'all' : 'individual',
        subject: subject,
        body: message,
        is_announcement: true,
        is_read: false
      });

      // Reset form
      setRecipients('');
      setSubject('');
      setMessage('');
      setTemplate('');
      
      await loadRecentEmails();
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold">Email Communication</h1>
        <p className="text-gray-600">Send emails to parents, students, and staff</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Email - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Compose Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Send To */}
            <div>
              <label className="text-sm font-semibold mb-3 block">Send To</label>
              <div className="flex gap-2">
                <Button
                  variant={sendToType === 'individual' ? 'default' : 'outline'}
                  onClick={() => setSendToType('individual')}
                  className={sendToType === 'individual' ? 'bg-slate-900 hover:bg-slate-800' : ''}
                >
                  Individual
                </Button>
                <Button
                  variant={sendToType === 'grade_level' ? 'default' : 'outline'}
                  onClick={() => setSendToType('grade_level')}
                  className={sendToType === 'grade_level' ? 'bg-slate-900 hover:bg-slate-800' : ''}
                >
                  Grade Level
                </Button>
                <Button
                  variant={sendToType === 'all_parents' ? 'default' : 'outline'}
                  onClick={() => setSendToType('all_parents')}
                  className={sendToType === 'all_parents' ? 'bg-slate-900 hover:bg-slate-800' : ''}
                >
                  <Users className="h-4 w-4 mr-1" />
                  All Parents
                </Button>
              </div>
            </div>

            {/* Recipients */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Recipients</label>
              <div className="relative">
                <Input
                  placeholder="Enter email address"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  disabled={sendToType === 'all_parents'}
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Email Template */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Email Template (Optional)
              </label>
              <Select value={template} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Message <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
                required
              />
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSend}
                disabled={sending || !subject.trim() || !message.trim()}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {sending ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recent Emails */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Recent Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentEmails.length === 0 ? (
                <p className="text-sm text-gray-500">No emails sent yet</p>
              ) : (
                <div className="space-y-3">
                  {recentEmails.map(email => (
                    <div key={email.id} className="text-sm">
                      <div className="font-medium">{email.subject}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(email.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Quick Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.map(t => (
                  <Button
                    key={t.name}
                    variant="outline"
                    className="w-full justify-start text-sm font-normal"
                    onClick={() => handleTemplateSelect(t.name)}
                  >
                    {t.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}