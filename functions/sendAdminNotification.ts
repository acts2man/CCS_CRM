import { Resend } from 'npm:resend@4.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { requestId, firstName, lastName, email, startDate, endDate, fullDay, startTime, endTime, totalHours, usePto, reason } = await req.json();

    // Build the base URL for approve/deny action links
    const appBaseUrl = 'https://app.base44.com/api/v1/functions/processTimeOffAction';
    const approveUrl = `${appBaseUrl}?requestId=${requestId}&action=approve&token=${Deno.env.get('BASE44_APP_ID')}`;
    const denyUrl = `${appBaseUrl}?requestId=${requestId}&action=deny&token=${Deno.env.get('BASE44_APP_ID')}`;

    // We'll use a simpler approach - the links call our own function endpoint
    // Get the function base URL from the request
    const reqUrl = new URL(req.url);
    const functionBase = `${reqUrl.protocol}//${reqUrl.host}`;
    const approveLink = `${functionBase}/processTimeOffAction?requestId=${requestId}&action=approve`;
    const denyLink = `${functionBase}/processTimeOffAction?requestId=${requestId}&action=deny`;

    await resend.emails.send({
      from: 'CCS Time Off <admin@calvaryforkidscrm.com>',
      to: 'troy@reputationguardians.net',
      subject: `⏰ New Time-Off Request — ${firstName} ${lastName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: #1e293b; padding: 28px 32px;">
              <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">New Time-Off Request</h1>
              <p style="color: #94a3b8; margin: 6px 0 0; font-size: 14px;">Submitted on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <!-- Employee Info -->
            <div style="padding: 28px 32px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Employee</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                    <span style="color: #0f172a; font-size: 15px; font-weight: 600;">${firstName} ${lastName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Email</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                    <span style="color: #0f172a; font-size: 14px;">${email}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Dates</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                    <span style="color: #0f172a; font-size: 14px; font-weight: 600;">${startDate} → ${endDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Duration</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                    <span style="color: #0f172a; font-size: 14px;">${fullDay ? 'Full Day(s)' : `Partial Day: ${startTime} – ${endTime}`} · ${totalHours} hrs</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Use PTO</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                    <span style="color: #0f172a; font-size: 14px;">${usePto ? '✅ Yes' : '❌ No'}</span>
                  </td>
                </tr>
              </table>

              <!-- Reason -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">Reason / Notes</p>
                <p style="color: #0f172a; font-size: 14px; line-height: 1.6; margin: 0;">${reason}</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="padding: 8px 32px 32px;">
              <p style="color: #64748b; font-size: 13px; margin: 0 0 16px;">Please review and take action:</p>
              <div style="display: flex; gap: 12px;">
                <a href="${approveLink}" 
                   style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.02em;">
                  ✅ Approve Request
                </a>
                &nbsp;&nbsp;
                <a href="${denyLink}" 
                   style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.02em;">
                  ❌ Deny Request
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0;">Clicking Approve will automatically add this to the school calendar and notify the employee. Clicking Deny will send the employee a denial email.</p>
            </div>

          </div>
        </body>
        </html>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});