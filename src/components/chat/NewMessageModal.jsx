import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function NewMessageModal({ open, onOpenChange, onMessageSent }) {
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      loadRecipients();
    }
  }, [open]);

  const loadRecipients = async () => {
    try {
      const [teachers, parents] = await Promise.all([
        base44.entities.Teacher.filter({ status: 'Active' }),
        base44.entities.Parent.list()
      ]);

      const allRecipients = [
        ...teachers.map(t => ({
          id: t.id,
          name: `${t.first_name} ${t.last_name}`,
          role: 'Teacher',
          email: t.email
        })),
        ...parents.map(p => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          role: 'Parent',
          email: p.email
        }))
      ];

      setRecipients(allRecipients);
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };

  const handleSend = async () => {
    if (!selectedRecipient || !message.trim()) return;

    setSending(true);
    try {
      const user = await base44.auth.me();
      const recipient = recipients.find(r => r.id === selectedRecipient);

      await base44.entities.Message.create({
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role,
        recipient_ids: [selectedRecipient],
        recipient_type: 'individual',
        subject: subject || 'Direct Message',
        body: message,
        is_read: false
      });

      setSelectedRecipient('');
      setSubject('');
      setMessage('');
      onOpenChange(false);
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">To</label>
            <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipient..." />
              </SelectTrigger>
              <SelectContent>
                {recipients.map(recipient => (
                  <SelectItem key={recipient.id} value={recipient.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {recipient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{recipient.name}</div>
                        <div className="text-xs text-gray-500">{recipient.role}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Subject (Optional)</label>
            <Input
              placeholder="Message subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend}
            disabled={!selectedRecipient || !message.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}