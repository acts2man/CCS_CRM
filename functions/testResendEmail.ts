import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();

    console.log(`Testing Resend email to: ${email}`);
    console.log(`Resend API Key exists: ${!!Deno.env.get('RESEND_API_KEY')}`);
    console.log(`Resend API Key (first 10 chars): ${Deno.env.get('RESEND_API_KEY')?.substring(0, 10)}`);

    const result = await resend.emails.send({
      from: 'CCS Time Off <onboarding@resend.dev>',
      to: email,
      subject: 'Test Email from CCS',
      html: '<h1>Test Email</h1><p>This is a test email from the CCS system.</p>',
    });

    console.log('Resend result:', JSON.stringify(result, null, 2));

    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Error sending test email:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return Response.json({ error: error.message, details: error }, { status: 500 });
  }
});