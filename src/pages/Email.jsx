import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Clock, FileText, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const EMAIL_TEMPLATES = [
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

const SMS_TEMPLATES = [
  {
    name: 'Attendance Alert',
    message: 'CCS: Your child was marked absent today. Please call the office at your earliest convenience.'
  },
  {
    name: 'Tardy Notice',
    message: 'CCS: Your child arrived late today. Please ensure they arrive before 8:30 AM.'
  },
  {
    name: 'Event Reminder',
    message: 'CCS: Reminder — school event tomorrow. Check the parent portal for details.'
  },
  {
    name: 'Early Dismissal',
    message: 'CCS: School will dismiss early today at 1:00 PM. Please arrange pickup accordingly.'
  },
  {
    name: 'Emergency Alert',
    message: 'CCS ALERT: Important school notice. Please check your email or call the office immediately.'
  }
];

export default function Email() {
  const { toast } = useToast();

  // Email state
  const [emailSendToType, setEmailSendToType] = useState('individual');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // SMS state
  const [smsSendToType, setSmsSendToType] = useState('individual');
  const [smsPhone, setSmsPhone] = useState('');
  const [smsTemplate, setSmsTemplate] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSMS, setSendingSMS] = useState(false);

  // Shared
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => { loadRecentMessages(); }, []);

  const loadRecentMessages = async () => {
    try {
      const msgs = await base44.entities.ParentCommunicationLog.list('-created_date', 15);
      setRecentMessages(msgs);
    } catch (e) {
      console.error('Error loading messages:', e);
    }
  };

  const handleEmailTemplateSelect = (name) => {
    const t = EMAIL_TEMPLATES.find(t => t.name === name);
    if (t) { setEmailSubject(t.subject); setEmailMessage(t.message); setEmailTemplate(name); }
  };

  const handleSMSTemplateSelect = (name) => {
    const t = SMS_TEMPLATES.find(t => t.name === name);
    if (t) { setSmsMessage(t.message); setSmsTemplate(name); }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill in subject and message.' });
      return;
    }
    setSendingEmail(true);
    try {
      const user = await base44.auth.me();
      let recipientList = [];

      if (emailSendToType === 'all_parents') {
        const parents = await base44.entities.Parent.list();
        recipientList = parents.filter(p => p.email).map(p => ({ email: p.email, name: `${p.first_name} ${p.last_name}`, id: p.id }));
      } else {
        if (!emailRecipient.trim()) {
          toast({ title: 'Missing recipient', description: 'Please enter an email address.' });
          setSendingEmail(false);
          return;
        }
        recipientList = [{ email: emailRecipient.trim(), name: emailRecipient.trim(), id: 'manual' }];
      }

      // Send to each recipient
      await Promise.all(recipientList.map(r =>
        base44.functions.invoke('sendParentEmail', {
          parentEmail: r.email,
          parentName: r.name,
          parentId: r.id,
          studentId: 'bulk',
          studentName: 'All Students',
          subject: emailSubject,
          message: emailMessage,
        }).catch(e => console.error('Failed for', r.email, e))
      ));

      // Log it
      await base44.entities.ParentCommunicationLog.create({
        student_id: 'bulk',
        student_name: emailSendToType === 'all_parents' ? 'All Students' : 'Individual',
        parent_id: 'bulk',
        parent_name: emailSendToType === 'all_parents' ? `All Parents (${recipientList.length})` : emailRecipient,
        parent_email: emailSendToType === 'all_parents' ? 'all' : emailRecipient,
        communication_type: 'email',
        subject: emailSubject,
        message: emailMessage,
        direction: 'outbound',
        status: 'sent',
        initiated_by: user.email,
        initiated_by_name: user.full_name,
        timestamp: new Date().toISOString()
      });

      toast({ title: 'Email sent!', description: `Sent to ${recipientList.length} recipient(s).` });
      setEmailSubject(''); setEmailMessage(''); setEmailRecipient(''); setEmailTemplate('');
      loadRecentMessages();
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to send email', variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) {
      toast({ title: 'Missing message', description: 'Please enter a message.' });
      return;
    }
    setSendingSMS(true);
    try {
      const user = await base44.auth.me();
      let recipientList = [];

      if (smsSendToType === 'all_parents') {
        const parents = await base44.entities.Parent.list();
        recipientList = parents.filter(p => p.phone).map(p => ({
          phone: p.phone, name: `${p.first_name} ${p.last_name}`, id: p.id
        }));
      } else {
        if (!smsPhone.trim()) {
          toast({ title: 'Missing phone', description: 'Please enter a phone number.' });
          setSendingSMS(false);
          return;
        }
        recipientList = [{ phone: smsPhone.trim(), name: smsPhone.trim(), id: 'manual' }];
      }

      // Send to each recipient
      await Promise.all(recipientList.map(r =>
        base44.functions.invoke('sendParentSMS', {
          parentPhone: r.phone,
          parentName: r.name,
          parentId: r.id,
          studentId: 'bulk',
          studentName: 'All Students',
          message: smsMessage,
        }).catch(e => console.error('Failed SMS for', r.phone, e))
      ));

      // Log it
      await base44.entities.ParentCommunicationLog.create({
        student_id: 'bulk',
        student_name: smsSendToType === 'all_parents' ? 'All Students' : 'Individual',
        parent_id: 'bulk',
        parent_name: smsSendToType === 'all_parents' ? `All Parents (${recipientList.length})` : smsPhone,
        parent_phone: smsSendToType === 'all_parents' ? 'all' : smsPhone,
        communication_type: 'sms',
        message: smsMessage,
        direction: 'outbound',
        status: 'sent',
        initiated_by: user.email,
        initiated_by_name: user.full_name,
        timestamp: new Date().toISOString()
      });

      toast({ title: 'SMS sent!', description: `Sent to ${recipientList.length} recipient(s).` });
      setSmsMessage(''); setSmsPhone(''); setSmsTemplate('');
      loadRecentMessages();
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to send SMS', variant: 'destructive' });
    } finally {
      setSendingSMS(false);
    }
  };

  const RecentActivity = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentMessages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages sent yet.</p>
        ) : (
          <div className="space-y-3">
            {recentMessages.map(m => (
              <div key={m.id} className="flex items-start gap-2 text-sm border-b pb-2 last:border-0">
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${m.communication_type === 'sms' ? 'bg-green-100' : 'bg-blue-100'}`}>
                  {m.communication_type === 'sms'
                    ? <MessageSquare className="h-3 w-3 text-green-600" />
                    : <Mail className="h-3 w-3 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{m.parent_name}</div>
                  <div className="text-gray-500 text-xs truncate">{m.subject || m.message?.slice(0, 50)}</div>
                  <div className="text-gray-400 text-xs">{m.timestamp ? new Date(m.timestamp).toLocaleDateString() : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold">Communications</h1>
        <p className="text-gray-600">Send emails and SMS to parents, students, and staff</p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /> Email</TabsTrigger>
          <TabsTrigger value="sms" className="gap-2"><MessageSquare className="h-4 w-4" /> SMS</TabsTrigger>
        </TabsList>

        {/* ── EMAIL TAB ── */}
        <TabsContent value="email">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" /> Compose Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Send To</label>
                  <div className="flex gap-2 flex-wrap">
                    {['individual', 'all_parents'].map(v => (
                      <Button key={v} size="sm"
                        variant={emailSendToType === v ? 'default' : 'outline'}
                        onClick={() => setEmailSendToType(v)}
                        className={emailSendToType === v ? 'bg-slate-900 hover:bg-slate-800' : ''}
                      >
                        {v === 'individual' ? 'Individual' : <><Users className="h-3.5 w-3.5 mr-1" />All Parents</>}
                      </Button>
                    ))}
                  </div>
                </div>

                {emailSendToType === 'individual' && (
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Recipient Email</label>
                    <Input placeholder="parent@email.com" value={emailRecipient} onChange={e => setEmailRecipient(e.target.value)} />
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold mb-2 block">Template (Optional)</label>
                  <Select value={emailTemplate} onValueChange={handleEmailTemplateSelect}>
                    <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                    <SelectContent>
                      {EMAIL_TEMPLATES.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Subject <span className="text-red-500">*</span></label>
                  <Input placeholder="Email subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Message <span className="text-red-500">*</span></label>
                  <Textarea placeholder="Enter your message..." value={emailMessage} onChange={e => setEmailMessage(e.target.value)} rows={10} />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSendEmail} disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()} className="bg-slate-900 hover:bg-slate-800">
                    {sendingEmail ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : 'Send Email'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <RecentActivity />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> Quick Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {EMAIL_TEMPLATES.map(t => (
                      <Button key={t.name} variant="outline" className="w-full justify-start text-sm font-normal" onClick={() => handleEmailTemplateSelect(t.name)}>
                        {t.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── SMS TAB ── */}
        <TabsContent value="sms">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Compose SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Send To</label>
                  <div className="flex gap-2 flex-wrap">
                    {['individual', 'all_parents'].map(v => (
                      <Button key={v} size="sm"
                        variant={smsSendToType === v ? 'default' : 'outline'}
                        onClick={() => setSmsSendToType(v)}
                        className={smsSendToType === v ? 'bg-slate-900 hover:bg-slate-800' : ''}
                      >
                        {v === 'individual' ? 'Individual' : <><Users className="h-3.5 w-3.5 mr-1" />All Parents</>}
                      </Button>
                    ))}
                  </div>
                </div>

                {smsSendToType === 'individual' && (
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Phone Number</label>
                    <Input placeholder="+1 (555) 000-0000" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} />
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold mb-2 block">Template (Optional)</label>
                  <Select value={smsTemplate} onValueChange={handleSMSTemplateSelect}>
                    <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                    <SelectContent>
                      {SMS_TEMPLATES.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Message <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-2 text-xs">(max 160 characters)</span>
                  </label>
                  <Textarea
                    placeholder="Type your SMS message..."
                    value={smsMessage}
                    onChange={e => setSmsMessage(e.target.value.slice(0, 160))}
                    rows={5}
                    maxLength={160}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-400">Keep it short and clear — recipients see this as a text message.</p>
                    <span className={`text-xs font-mono ${smsMessage.length > 140 ? 'text-orange-500' : 'text-gray-400'}`}>{smsMessage.length}/160</span>
                  </div>
                </div>

                {smsSendToType === 'all_parents' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    ⚠️ This will send an SMS to <strong>all parents</strong> with a phone number on file. Please review your message carefully before sending.
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleSendSMS} disabled={sendingSMS || !smsMessage.trim()} className="bg-green-700 hover:bg-green-800">
                    {sendingSMS ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : 'Send SMS'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <RecentActivity />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> Quick Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {SMS_TEMPLATES.map(t => (
                      <Button key={t.name} variant="outline" className="w-full justify-start text-sm font-normal" onClick={() => handleSMSTemplateSelect(t.name)}>
                        {t.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}