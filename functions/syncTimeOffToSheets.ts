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

    // Prepare row data to match sheet columns
    const submissionDate = new Date(request.created_date).toLocaleDateString();
    const rowData = [
      `${request.first_name} ${request.last_name}`, // Name
      request.work_email, // Email
      submissionDate, // Date (submission date)
      request.start_date, // Start Date
      request.end_date, // End Date
      request.start_time || '', // Start Time
      request.end_time || '', // End Time
      request.total_hours || '', // Total Hours
      request.reason_notes, // Reason
      request.use_pto ? 'Yes' : 'No', // PTO
      '', // Approved (Yes/No) - admin fills this
      '' // Sub note
    ];

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:M', // Updated range for new columns
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