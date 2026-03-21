import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const CALENDAR_ID = 'a0f63acb1d30ec35e8ca13a3f8da083f039696f1f8b419e86e1c8ec6fe983546@group.calendar.google.com';

Deno.serve(async (req) => {
  try {
    // This function is called via GET link from email - no user auth needed
    const url = new URL(req.url);
    const requestId = url.searchParams.get('requestId');
    const action = url.searchParams.get('action'); // 'approve' or 'deny'

    if (!requestId || !action) {
      return new Response(htmlPage('❌ Invalid Request', 'Missing required parameters.', '#dc2626'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Inject App ID header so SDK works when called directly from a browser link
    const appId = Deno.env.get('BASE44_APP_ID');
    const patchedHeaders = new Headers(req.headers);
    if (appId && !patchedHeaders.has('Base44-App-Id')) {
      patchedHeaders.set('Base44-App-Id', appId);
    }
    const patchedReq = new Request(req.url, { method: req.method, headers: patchedHeaders });
    const base44 = createClientFromRequest(patchedReq);

    // Fetch the time off request
    const requests = await base44.asServiceRole.entities.TimeOffRequest.filter({ id: requestId });
    if (!requests || requests.length === 0) {
      return new Response(htmlPage('❌ Not Found', 'Time-off request not found.', '#dc2626'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const request = requests[0];

    // Prevent double-processing
    if (request.status !== 'pending') {
      return new Response(htmlPage(
        '⚠️ Already Processed',
        `This request has already been <strong>${request.status}</strong>. No further action needed.`,
        '#d97706'
      ), { headers: { 'Content-Type': 'text/html' } });
    }

    if (action === 'approve') {
      // 1. Add to Google Calendar
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

      const eventBody = {
        summary: `${request.first_name} ${request.last_name} — Time Off`,
        description: `Reason: ${request.reason_notes}\nPTO: ${request.use_pto ? 'Yes' : 'No'}\nTotal Hours: ${request.total_hours}`,
        colorId: '11',
      };

      if (request.full_day) {
        // All-day event: end date must be day after for Google Calendar
        const endDateObj = new Date(request.end_date);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDateStr = endDateObj.toISOString().split('T')[0];
        eventBody.start = { date: request.start_date };
        eventBody.end = { date: endDateStr };
      } else {
        eventBody.start = { dateTime: `${request.start_date}T${request.start_time}:00`, timeZone: 'America/Los_Angeles' };
        eventBody.end = { dateTime: `${request.end_date}T${request.end_time}:00`, timeZone: 'America/Los_Angeles' };
      }

      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        }
      );

      if (!calRes.ok) {
        const err = await calRes.text();
        console.error('Calendar error:', err);
        return new Response(htmlPage('❌ Calendar Error', `Failed to add event to calendar: ${err}`, '#dc2626'), {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      const calEvent = await calRes.json();
      console.log('Calendar event created:', calEvent.id);

      // 2 & 3. Send approval email + update status in parallel
      await Promise.all([
        resend.emails.send({
          from: 'CCS Time Off <admin@calvaryforkidscrm.com>',
          to: request.work_email,
          subject: '✅ Time-Off Request Approved',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px;">
              <div style="background: #16a34a; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 22px;">Your Request Was Approved! ✅</h1>
              </div>
              <p style="color: #374151; font-size: 15px;">Hi ${request.first_name},</p>
              <p style="color: #374151; font-size: 15px;">Great news! Your time-off request has been approved and added to the school calendar.</p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 4px 0; font-size: 14px;"><strong>Dates:</strong> ${request.start_date} → ${request.end_date}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Duration:</strong> ${request.total_hours} hours (${request.full_day ? 'Full day' : 'Partial day'})</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>PTO Used:</strong> ${request.use_pto ? 'Yes' : 'No'}</p>
              </div>
              <p style="color: #6b7280; font-size: 13px;">This time off has been added to the school calendar. Enjoy your time off!</p>
            </div>
          `
        }),
        base44.asServiceRole.entities.TimeOffRequest.update(request.id, {
          status: 'approved',
          user_notified: true,
          synced_to_calendar: true,
        })
      ]);

      return new Response(htmlPage(
        '✅ Request Approved',
        `<strong>${request.first_name} ${request.last_name}</strong>'s time-off request (${request.start_date} → ${request.end_date}) has been approved, added to the calendar, and the employee has been notified.`,
        '#16a34a'
      ), { headers: { 'Content-Type': 'text/html' } });

    } else if (action === 'deny') {
      // 1. Send denial email to employee
      await resend.emails.send({
        from: 'CCS Time Off <admin@calvaryforkidscrm.com>',
        to: request.work_email,
        subject: '❌ Time-Off Request — Update',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px;">
            <div style="background: #dc2626; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 22px;">Time-Off Request Update</h1>
            </div>
            <p style="color: #374151; font-size: 15px;">Hi ${request.first_name},</p>
            <p style="color: #374151; font-size: 15px;">Unfortunately, your time-off request has been denied at this time.</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 4px 0; font-size: 14px;"><strong>Requested Dates:</strong> ${request.start_date} → ${request.end_date}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Total Hours:</strong> ${request.total_hours}</p>
            </div>
            <p style="color: #374151; font-size: 15px;">If you have any questions or would like to discuss this further, please reach out to the admin directly.</p>
            <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">Thank you for your understanding.</p>
          </div>
        `
      });

      // 2. Update request status
      await base44.asServiceRole.entities.TimeOffRequest.update(request.id, {
        status: 'denied',
        user_notified: true,
      });

      return new Response(htmlPage(
        '❌ Request Denied',
        `<strong>${request.first_name} ${request.last_name}</strong>'s time-off request has been denied and the employee has been notified via email.`,
        '#dc2626'
      ), { headers: { 'Content-Type': 'text/html' } });
    }

    return new Response(htmlPage('❌ Invalid Action', 'Unknown action specified.', '#dc2626'), {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Error processing time off action:', error);
    return new Response(htmlPage('❌ Server Error', error.message, '#dc2626'), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
});

function htmlPage(title, message, color) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box;">
  <div style="background: white; border-radius: 16px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="width: 64px; height: 64px; background: ${color}22; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 28px;">
      ${color === '#16a34a' ? '✅' : color === '#d97706' ? '⚠️' : '❌'}
    </div>
    <h1 style="color: #0f172a; font-size: 22px; margin: 0 0 12px;">${title}</h1>
    <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0;">${message}</p>
    <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0;">You can close this tab.</p>
  </div>
</body>
</html>`;
}