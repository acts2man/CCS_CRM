import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { google } from 'npm:googleapis@140.0.0';
import { Resend } from 'npm:resend@4.0.0';

const CALENDAR_ID = 'a0f63acb1d30ec35e8ca13a3f8da083f039696f1f8b419e86e1c8ec6fe983546@group.calendar.google.com';
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
      // Send approval email
      console.log(`Sending approval email to: ${request.work_email}`);
      const emailResult = await resend.emails.send({
        from: 'CCS Time Off <onboarding@resend.dev>',
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
      console.log('Email sent successfully:', emailResult);

      // Add to Google Calendar
      console.log('Adding event to Google Calendar');
      const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');
      
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth });

      const calendarResult = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: {
          summary: `${request.first_name} ${request.last_name} - Time Off`,
          description: `Reason: ${request.reason_notes}`,
          start: {
            date: request.start_date,
          },
          end: {
            date: request.end_date,
          },
          colorId: '11', // Red color for time off
        },
      });
      console.log('Calendar event created:', calendarResult.data.id);

      // Mark as synced
      await base44.asServiceRole.entities.TimeOffRequest.update(request.id, {
        user_notified: true,
        synced_to_calendar: true,
      });
    }

    // Handle denial
    if (request.status === 'denied') {
      console.log(`Sending denial email to: ${request.work_email}`);
      const emailResult = await resend.emails.send({
        from: 'CCS Time Off <onboarding@resend.dev>',
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