import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { google } from 'npm:googleapis@140.0.0';
import { Resend } from 'npm:resend@4.0.0';

const CALENDAR_ID = 'a0f63acb1d30ec35e8ca13a3f8da083f039696f1f8b419e86e1c8ec6fe983546@group.calendar.google.com';
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all pending notifications (approved/denied but not yet notified)
    const pendingRequests = await base44.asServiceRole.entities.TimeOffRequest.filter({
      user_notified: false
    });

    let processedCount = 0;

    for (const request of pendingRequests) {
      try {
        // Handle approval
        if (request.status === 'approved') {
          try {
            // Send approval email
            console.log(`Sending approval email to: ${request.work_email}`);
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
            console.log('Approval email sent successfully');
          } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
            throw emailError;
          }

          try {
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
                colorId: '11',
              },
            });
            console.log('Calendar event created:', calendarResult.data.id);
          } catch (calendarError) {
            console.error('Failed to add to calendar:', calendarError);
            throw calendarError;
          }
        }

        // Handle denial
        if (request.status === 'denied') {
          console.log(`Sending denial email to: ${request.work_email}`);
          try {
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
            console.log('Denial email sent successfully');
          } catch (emailError) {
            console.error('Failed to send denial email:', emailError);
            throw emailError;
          }
        }

        // Mark as notified
        await base44.asServiceRole.entities.TimeOffRequest.update(request.id, {
          user_notified: true,
        });
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
      }
    }

    return Response.json({ success: true, processedCount });
  } catch (error) {
    console.error('Error in processTimeOffStatusChanges:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});