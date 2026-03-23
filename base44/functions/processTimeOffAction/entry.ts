import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const CALENDAR_ID = 'a0f63acb1d30ec35e8ca13a3f8da083f039696f1f8b419e86e1c8ec6fe983546@group.calendar.google.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { requestId, action } = await req.json();

    if (!requestId || !action) {
      return Response.json({ success: false, error: 'Missing required parameters.' });
    }

    const requests = await base44.asServiceRole.entities.TimeOffRequest.filter({ id: requestId });
    if (!requests || requests.length === 0) {
      return Response.json({ success: false, error: 'Time-off request not found.' });
    }

    const request = requests[0];

    if (request.status !== 'pending') {
      return Response.json({ success: false, already_processed: true, current_status: request.status, request });
    }

    if (action === 'approve') {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

      const eventBody = {
        summary: `${request.first_name} ${request.last_name} — Time Off`,
        description: `Reason: ${request.reason_notes}\nPTO: ${request.use_pto ? 'Yes' : 'No'}\nTotal Hours: ${request.total_hours}`,
        colorId: '11',
      };

      if (request.full_day) {
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
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody),
        }
      );

      if (!calRes.ok) {
        const err = await calRes.text();
        console.error('Calendar error:', err);
        return Response.json({ success: false, error: `Calendar error: ${err}` });
      }

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
              <p style="color: #374151; font-size: 15px;">Your time-off request has been approved and added to the school calendar.</p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 4px 0; font-size: 14px;"><strong>Dates:</strong> ${request.start_date} → ${request.end_date}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Duration:</strong> ${request.total_hours} hours</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>PTO Used:</strong> ${request.use_pto ? 'Yes' : 'No'}</p>
              </div>
            </div>
          `
        }),
        base44.asServiceRole.entities.TimeOffRequest.update(request.id, {
          status: 'approved',
          user_notified: true,
          synced_to_calendar: true,
        })
      ]);

      return Response.json({ success: true, request });

    } else if (action === 'deny') {
      await Promise.all([
        resend.emails.send({
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
                <p style="margin: 4px 0; font-size: 14px;"><strong>Dates:</strong> ${request.start_date} → ${request.end_date}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Hours:</strong> ${request.total_hours}</p>
              </div>
              <p style="color: #374151; font-size: 15px;">Please reach out to the admin with any questions.</p>
            </div>
          `
        }),
        base44.asServiceRole.entities.TimeOffRequest.update(request.id, {
          status: 'denied',
          user_notified: true,
        })
      ]);

      return Response.json({ success: true, request });
    }

    return Response.json({ success: false, error: 'Unknown action.' });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});