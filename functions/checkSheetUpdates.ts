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
      range: 'Sheet1!A:K', // Adjust range based on your columns
    });

    const rows = response.data.values || [];
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const [requestId, firstName, lastName, email, fullDay, startDate, endDate, reason, usePTO, currentStatus, approvalStatus] = row;

      if (!requestId || !approvalStatus) continue;

      // Get the request from database
      const request = await base44.asServiceRole.entities.TimeOffRequest.get(requestId);
      
      if (!request) continue;

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