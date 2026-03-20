import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, email, type } = await req.json();

    const PINGRAM_API_KEY = Deno.env.get('PINGRAM_API_KEY');

    // Message Templates
    let smsMessage = '';
    let emailSubject = '';
    let emailMessage = '';

    switch (type) {
      case 'welcome':
        smsMessage = `Hi ${name}, welcome to Calvary Preschool! We're excited to have you.`;
        emailSubject = 'Welcome to Calvary Preschool!';
        emailMessage = `Hi ${name},\n\nWelcome to Calvary Preschool! We're excited to have your family with us.\n\nBlessings,\nCalvary Team`;
        break;

      case 'payment_due':
        smsMessage = `Hi ${name}, this is a reminder that your tuition is due soon.`;
        emailSubject = 'Tuition Reminder';
        emailMessage = `Hi ${name},\n\nThis is a reminder that your tuition is due soon.\n\nThank you!`;
        break;

      case 'event_reminder':
        smsMessage = `Hi ${name}, just a reminder about your upcoming preschool event.`;
        emailSubject = 'Event Reminder';
        emailMessage = `Hi ${name},\n\nThis is a reminder about your upcoming preschool event.\n\nWe look forward to seeing you!`;
        break;

      default:
        smsMessage = `Hi ${name}, this is a message from Calvary Preschool.`;
        emailSubject = 'Notification';
        emailMessage = `Hi ${name},\n\nThis is a notification from Calvary Preschool.`;
    }

    // Send SMS via Pingram
    const smsResponse = await fetch('https://api.pingroom.com/v1/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: phone, message: smsMessage }),
    });

    // Send Email via Pingram
    const emailResponse = await fetch('https://api.pingroom.com/v1/email/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: email, subject: emailSubject, message: emailMessage }),
    });

    const smsData = await smsResponse.json();
    const emailData = await emailResponse.json();

    return Response.json({ success: true, sms: smsData, email: emailData });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});