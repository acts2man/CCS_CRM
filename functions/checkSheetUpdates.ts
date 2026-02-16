import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { google } from 'npm:googleapis@140.0.0';

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your Google Sheet ID

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get Google Sheets access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');
    
    // Initialize Google Sheets API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: 'v4', auth });

    // Read all rows from sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:M', // Updated range
    });

    const rows = response.data.values || [];
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const [name, email, submissionDate, startDate, endDate, startTime, endTime, totalHours, reason, usePTO, approvalStatus] = row;

      if (!email || !approvalStatus) continue;

      // Find the request by matching email and dates
      const requests = await base44.asServiceRole.entities.TimeOffRequest.filter({
        work_email: email,
        start_date: startDate,
        end_date: endDate
      });
      
      if (!requests || requests.length === 0) continue;
      
      const request = requests[0];

      // Check if approval status changed
      let newStatus = request.status;
      if (approvalStatus.toLowerCase() === 'yes' && request.status === 'pending') {
        newStatus = 'approved';
      } else if (approvalStatus.toLowerCase() === 'no' && request.status === 'pending') {
        newStatus = 'denied';
      }

      // Update if status changed
      if (newStatus !== request.status) {
        await base44.asServiceRole.entities.TimeOffRequest.update(requestId, {
          status: newStatus,
        });
      }
    }

    return Response.json({ success: true, message: 'Checked sheet updates' });
  } catch (error) {
    console.error('Error checking sheet updates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});