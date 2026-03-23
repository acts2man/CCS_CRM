import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { google } from 'npm:googleapis@140.0.0';

const SPREADSHEET_ID = "1Jk2WClj-D_NIURwLb2WrILDVp2ion4FcPH72JKor6bI"; // #gid=0

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { requestId } = await req.json();

    // Get the time-off request
    const request = await base44.asServiceRole.entities.TimeOffRequest.get(requestId);
    
    if (!request) {
      return Response.json({ error: 'Request not found' }, { status: 404 });
    }

    // Get Google Sheets access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    
    // Initialize Google Sheets API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: 'v4', auth });

    // Helper function to convert 24-hour time to 12-hour format
    const formatTime = (time24) => {
      if (!time24) return '';
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };

    // Prepare row data to match sheet columns
    const rowData = [
      `${request.first_name} ${request.last_name}`, // A: Full Name
      request.work_email, // B: Email
      request.start_date, // C: Start Date
      request.end_date, // D: End Date
      formatTime(request.start_time), // E: Start Time
      formatTime(request.end_time), // F: End Time
      request.full_day ? 'Yes' : 'No', // G: Full Day
      request.use_pto ? 'Yes' : 'No', // H: PTO
      request.total_hours || '', // I: Total Hours
      request.reason_notes, // J: Reason
      '' // K: Approved/Subnote
    ];

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:K', // A-K columns
      valueInputOption: 'RAW',
      resource: {
        values: [rowData],
      },
    });

    // Mark as synced
    await base44.asServiceRole.entities.TimeOffRequest.update(requestId, {
      synced_to_sheets: true,
    });

    return Response.json({ success: true, message: 'Synced to Google Sheets' });
  } catch (error) {
    console.error('Error syncing to sheets:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});