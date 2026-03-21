import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const formData = await req.json();

  // Create the record first
  const request = await base44.asServiceRole.entities.TimeOffRequest.create({
    ...formData,
    total_hours: parseFloat(formData.total_hours),
    status: 'pending'
  });

  // Build approve/deny links — point directly to the backend function (no login required)
  const fnBaseUrl = 'https://calvaryforkidscrm.com/functions/approveTimeOff';
  const approveLink = `${fnBaseUrl}?requestId=${request.id}&action=approve`;
  const denyLink = `${fnBaseUrl}?requestId=${request.id}&action=deny`;

  const submittedOn = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Send email and return in parallel — don't let email delay the response
  const emailPromise = resend.emails.send({
    from: 'CCS Time Off <admin@calvaryforkidscrm.com>',
    to: 'troy@reputationguardians.net',
    subject: `⏰ New Time-Off Request — ${formData.first_name} ${formData.last_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: #1e293b; padding: 28px 32px;">
            <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">New Time-Off Request</h1>
            <p style="color: #94a3b8; margin: 6px 0 0; font-size: 14px;">Submitted on ${submittedOn}</p>
          </div>
          <div style="padding: 28px 32px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase;">Employee</span></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;"><span style="color: #0f172a; font-size: 15px; font-weight: 600;">${formData.first_name} ${formData.last_name}</span></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase;">Email</span></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;"><span style="color: #0f172a; font-size: 14px;">${formData.work_email}</span></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase;">Dates</span></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;"><span style="color: #0f172a; font-size: 14px; font-weight: 600;">${formData.start_date} → ${formData.end_date}</span></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase;">Duration</span></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;"><span style="color: #0f172a; font-size: 14px;">${formData.full_day ? 'Full Day(s)' : `Partial: ${formData.start_time} – ${formData.end_time}`} · ${formData.total_hours} hrs</span></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase;">Use PTO</span></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;"><span style="color: #0f172a; font-size: 14px;">${formData.use_pto ? '✅ Yes' : '❌ No'}</span></td>
              </tr>
            </table>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0 0 8px;">Reason / Notes</p>
              <p style="color: #0f172a; font-size: 14px; line-height: 1.6; margin: 0;">${formData.reason_notes}</p>
            </div>
          </div>
          <div style="padding: 8px 32px 32px;">
            <p style="color: #64748b; font-size: 13px; margin: 0 0 16px;">Please review and take action:</p>
            <a href="${approveLink}" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; margin-right: 12px;">✅ Approve Request</a>
            <a href="${denyLink}" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">❌ Deny Request</a>
          </div>
        </div>
      </body>
      </html>
    `
  });

  // Await both email and response together so Deno doesn't terminate early
  await emailPromise;

  return Response.json({ success: true, requestId: request.id });
});