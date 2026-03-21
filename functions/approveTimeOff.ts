import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const CALENDAR_ID = 'fc26e7e11e62a246a3967bba8a33f18883ba3daf1e84d144b98d871eeeb60b0d@group.calendar.google.com';

function htmlPage(title, color, emoji, body) {
  return new Response(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
  <div style="background: white; border-radius: 16px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <div style="width: 72px; height: 72px; background: ${color}22; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 36px;">${emoji}</div>
    <h1 style="color: #0f172a; margin: 0 0 12px; font-size: 24px;">${title}</h1>
    <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">${body}</p>
    <p style="color: #94a3b8; font-size: 13px; margin: 0;">You can close this tab.</p>
  </div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get('requestId');
    const action = url.searchParams.get('action');

    if (!requestId || !action) {
      return htmlPage('Missing Parameters', '#dc2626', '❌', 'The link is missing required parameters. Please contact your administrator.');
    }

    // Create client WITHOUT requiring auth (this is a webhook-like endpoint)
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch (e) {
      // If no auth context, create service-only client
      const { createClient } = await import('npm:@base44/sdk@0.8.21');
      base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
    }

    const requests = await base44.asServiceRole.entities.TimeOffRequest.filter({ id: requestId });

    if (!requests || requests.length === 0) {
      return htmlPage('Not Found', '#dc2626', '❌', 'This time-off request could not be found.');
    }

    const request = requests[0];

    if (request.status !== 'pending') {
      return htmlPage(
        'Already Processed',
        '#f59e0b',
        '⚠️',
        `This request was already <strong>${request.status}</strong> for ${request.first_name} ${request.last_name} (${request.start_date} → ${request.end_date}).`
      );
    }

    if (action === 'approve') {
      let accessToken;
      try {
        const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        accessToken = conn.accessToken;
      } catch (connErr) {
        console.error('Connector error:', connErr.message);
        return htmlPage('Authorization Error', '#dc2626', '❌', `Could not access Google Calendar. Make sure it's authorized in settings. Error: ${connErr.message}`);
      }

      const eventBody = {
        summary: `${request.first_name} ${request.last_name} — Time Off`,
        description: `Reason: ${request.reason_notes}\nPTO: ${request.use_pto ? 'Yes' : 'No'}\nTotal Hours: ${request.total_hours}`,
        colorId: '11',
      };

      if (request.full_day) {
        const endDateObj = new Date(request.end_date);
        endDateObj.setDate(endDateObj.getDate() + 1);
        eventBody.start = { date: request.start_date };
        eventBody.end = { date: endDateObj.toISOString().split('T')[0] };
      } else {
        eventBody.start = { dateTime: `${request.start_date}T${request.start_time}:00`, timeZone: 'America/Los_Angeles' };
        eventBody.end = { dateTime: `${request.end_date}T${request.end_time}:00`, timeZone: 'America/Los_Angeles' };
      }

      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody),
        }
      );

      if (!calRes.ok) {
        const err = await calRes.text();
        console.error('Calendar error:', err);
        return htmlPage('Calendar Error', '#dc2626', '❌', `Could not add to calendar: ${err}`);
      }

      await Promise.all([
        resend.emails.send({
          from: 'CCS Time Off <admin@calvaryforkidscrm.com>',
          to: request.work_email,
          subject: '✅ Time-Off Request Approved',
          html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #16a34a;">Your Request Was Approved! ✅</h2>
            <p>Hi ${request.first_name},</p>
            <p>Your time-off request has been approved and added to the school calendar.</p>
            <p><strong>Dates:</strong> ${request.start_date} → ${request.end_date}<br>
            <strong>Hours:</strong> ${request.total_hours}<br>
            <strong>PTO Used:</strong> ${request.use_pto ? 'Yes' : 'No'}</p>
          </div>`
        }),
        base44.asServiceRole.entities.TimeOffRequest.update(request.id, {
          status: 'approved',
          user_notified: true,
          synced_to_calendar: true,
        })
      ]);

      return htmlPage(
        'Request Approved ✅',
        '#16a34a',
        '✅',
        `${request.first_name} ${request.last_name}'s time off (${request.start_date} → ${request.end_date}) has been approved, added to the calendar, and the employee has been notified.`
      );

    } else if (action === 'deny') {
      await Promise.all([
        resend.emails.send({
          from: 'CCS Time Off <admin@calvaryforkidscrm.com>',
          to: request.work_email,
          subject: '❌ Time-Off Request — Update',
          html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #dc2626;">Time-Off Request Update</h2>
            <p>Hi ${request.first_name},</p>
            <p>Unfortunately, your time-off request has been denied at this time.</p>
            <p><strong>Dates:</strong> ${request.start_date} → ${request.end_date}<br>
            <strong>Hours:</strong> ${request.total_hours}</p>
            <p>Please reach out to the admin with any questions.</p>
          </div>`
        }),
        base44.asServiceRole.entities.TimeOffRequest.update(request.id, {
          status: 'denied',
          user_notified: true,
        })
      ]);

      return htmlPage(
        'Request Denied ❌',
        '#dc2626',
        '❌',
        `${request.first_name} ${request.last_name}'s time-off request has been denied and the employee has been notified.`
      );
    }

    return htmlPage('Unknown Action', '#dc2626', '❌', 'Unknown action specified.');

  } catch (error) {
    console.error('Error:', error);
    return htmlPage('Error', '#dc2626', '❌', `Something went wrong: ${error.message}`);
  }
});