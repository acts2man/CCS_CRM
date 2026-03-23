import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { Pingram } from 'npm:pingram';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, email, customSmsMessage } = await req.json();

    const pingram = new Pingram({ apiKey: Deno.env.get('PINGRAM_API_KEY') });

    const results = {};

    if (phone && customSmsMessage) {
      const digits = phone.replace(/\D/g, '');
      const formattedPhone = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;

      await pingram.send({
        type: 'calvary_school_sms',
        to: {
          id: email || formattedPhone,
          number: formattedPhone,
        },
        sms: {
          message: customSmsMessage,
        },
      });
      results.sms = { sent: true, to: formattedPhone };
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});