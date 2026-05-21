import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Resend } from 'npm:resend@4.0.0';

const CALENDAR_ID = 'fc26e7e11e62a246a3967bba8a33f18883ba3daf1e84d144b98d871eeeb60b0d@group.calendar.google.com';
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only process updates where status changed
    if (event.type !== 'update' || !old_data || data.status === old_data.status) {
      return Response.json({ message: 'No status change' });
    }

    const request = data;

    // Handle approval
    if (request.status === 'approved') {
      try {
        // Send approval email
        console.log(`Sending approval email to: ${request.work_email}`);
        console.log(`Resend API Key exists: ${!!Deno.env.get('RESEND_API_KEY')}`);
        
        const emailResult = await resend.emails.send({
          from: 'CCS Time Off <admin@calvaryforkidscrm.com>',
          to: request.work_email,
          subject: 'Time-Off Request Approved ✓',
          html: `
            <h2>Your Time-Off Request Has Been Approved!</h2>
            <p>Hi ${request.first_name},</p>
            <p>Great news! Your time-off request has been approved by the admin.</p>
            <p><strong>Details:</strong></p>
            <ul>
              <li><strong>Start Date:</strong> ${request.start_date}</li>
              <li><strong>End Date:</strong> ${request.end_date}</li>
              <li><strong>Full Day:</strong> ${request.full_day ? 'Yes' : 'No'}</li>
              <li><strong>PTO Used:</strong> ${request.use_pto ? 'Yes' : 'No'}</li>
            </ul>
            <p>This time has been added to the calendar.</p>
            <p>Thank you!</p>
          `,
        });
        console.log('Email sent successfully:', JSON.stringify(emailResult));
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        throw emailError;
      }

      try {
        // Add to Google Calendar
        console.log('Adding event to Google Calendar');
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        console.log('Got calendar access token');

        // For all-day events, Google requires end date to be day AFTER the last day
        const endDateObj = new Date(request.end_date);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDateStr = endDateObj.toISOString().split('T')[0];

        const eventBody = {
          summary: `${request.first_name} ${request.last_name} - Time Off`,
          description: `Reason: ${request.reason_notes}\nPTO: ${request.use_pto ? 'Yes' : 'No'}\nTotal Hours: ${request.total_hours}`,
          colorId: '11',
        };

        if (request.full_day) {
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
          const errText = await calRes.text();
          console.error('Calendar API error:', errText);
          throw new Error(`Calendar API error: ${errText}`);
        }

        const calData = await calRes.json();
        console.log('Calendar event created:', calData.id);
      } catch (calendarError) {
        console.error('Failed to add to calendar:', calendarError);
        throw calendarError;
      }

      // Mark as synced only if both operations succeeded
      await base44.asServiceRole.entities.TimeOffRequest.update(request.id, {
        user_notified: true,
        synced_to_calendar: true,
      });
    }

    // Handle denial
    if (request.status === 'denied') {
      console.log(`Sending denial email to: ${request.work_email}`);
      const emailResult = await resend.emails.send({
        from: 'CCS Time Off <admin@calvaryforkidscrm.com>',
        to: request.work_email,
        subject: 'Time-Off Request Update',
        html: `
          <h2>Time-Off Request Status Update</h2>
          <p>Hi ${request.first_name},</p>
          <p>Unfortunately, we're not able to approve your time-off request at this time.</p>
          <p><strong>Request Details:</strong></p>
          <ul>
            <li><strong>Start Date:</strong> ${request.start_date}</li>
            <li><strong>End Date:</strong> ${request.end_date}</li>
          </ul>
          <p>Please reach out to your administrator if you have questions.</p>
          <p>Thank you for understanding.</p>
        `,
      });
      console.log('Denial email sent successfully:', emailResult);

      // Mark as notified
      await base44.asServiceRole.entities.TimeOffRequest.update(request.id, {
        user_notified: true,
      });
    }

    return Response.json({ success: true, status: request.status });
  } catch (error) {
    console.error('Error handling status change:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});