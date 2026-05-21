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
  const appId = Deno.env.get('BASE44_APP_ID');
  const fnBaseUrl = `https://api.base44.com/api/apps/${appId}/functions/approveTimeOff`;
  const approveLink = `${fnBaseUrl}?requestId=${request.id}&action=approve`;
  const denyLink = `${fnBaseUrl}?requestId=${request.id}&action=deny`;

  const submittedOn = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Send email and return in parallel — don't let email delay the response
  const emailPromise = resend.emails.send({
    from: 'CCS Time Off <admin@calvaryforkidscrm.com>',
    to: 'calvaryforkids@gmail.com',
    subject: `⏰ New Time-Off Request — ${formData.first_name} ${formData.last_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media (max-width: 480px) {
            .request-card { padding: 20px !important; }
            .request-table td { padding: 12px 0 !important; display: block !important; width: 100% !important; }
            .request-table tr td:first-child { padding-bottom: 4px !important; }
            .request-table { width: 100% !important; }
            .button-container { display: flex !important; flex-direction: row !important; gap: 6px !important; }
            .action-button { flex: 1 !important; display: block !important; text-align: center !important; margin: 0 !important; padding: 8px 6px !important; font-size: 12px !important; }
          }
        </style>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 16px;">
        <div style="max-width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: #1e293b; padding: 24px 20px;">
            <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">New Time-Off Request</h1>
            <p style="color: #94a3b8; margin: 6px 0 0; font-size: 14px;">Submitted on ${submittedOn}</p>
          </div>
          <div class="request-card" style="padding: 24px 20px 0;">
            <table class="request-table" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Employee</span></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #0f172a; font-size: 15px; font-weight: 600;">${formData.first_name} ${formData.last_name}</span></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Email</span></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #0f172a; font-size: 14px; word-break: break-all;">${formData.work_email}</span></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Dates</span></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #0f172a; font-size: 14px; font-weight: 600;">${formData.start_date} → ${formData.end_date}</span></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Duration</span></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #0f172a; font-size: 14px;">${formData.full_day ? 'Full Day(s)' : `Partial: ${formData.start_time} – ${formData.end_time}`} · ${formData.total_hours} hrs</span></td>
              </tr>
              <tr>
                <td style="padding: 12px 0;"><span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Use PTO</span></td>
                <td style="padding: 12px 0;"><span style="color: #0f172a; font-size: 14px;">${formData.use_pto ? '✅ Yes' : '❌ No'}</span></td>
              </tr>
            </table>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0 0 8px;">Reason / Notes</p>
              <p style="color: #0f172a; font-size: 14px; line-height: 1.6; margin: 0; word-break: break-word;">${formData.reason_notes}</p>
            </div>
          </div>
          <div style="padding: 16px 20px 24px;">
            <p style="color: #64748b; font-size: 13px; margin: 0 0 16px;">Please review and take action:</p>
            <div class="button-container" style="display: flex; gap: 12px;">
              <a href="${approveLink}" class="action-button" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600;">✅ Approve Request</a>
              <a href="${denyLink}" class="action-button" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600;">❌ Deny Request</a>
            </div>
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