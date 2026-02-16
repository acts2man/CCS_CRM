import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { google } from 'npm:googleapis@140.0.0';

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your Google Sheet ID

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

    // Prepare row data
    const rowData = [
      request.id,
      request.first_name,
      request.last_name,
      request.work_email,
      request.full_day ? 'Yes' : 'No',
      request.start_date,
      request.end_date,
      request.reason_notes,
      request.use_pto ? 'Yes' : 'No',
      request.status,
      '', // Approval column (Yes/No) - admin fills this
      new Date(request.created_date).toLocaleString(),
    ];

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L', // Adjust sheet name if needed
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