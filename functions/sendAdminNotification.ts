import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const { firstName, lastName, email, startDate, endDate, fullDay, startTime, endTime, totalHours, usePto, reason } = await req.json();

    await resend.emails.send({
      from: 'CCS Time Off <onboarding@resend.dev>',
      to: 'troy@reputationguardians.net',
      subject: 'New Time-Off Request Submitted',
      html: `
        <h2>New Time-Off Request</h2>
        <p><strong>Employee:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Start Date:</strong> ${startDate}</p>
        <p><strong>End Date:</strong> ${endDate}</p>
        <p><strong>Full Day:</strong> ${fullDay ? 'Yes' : 'No'}</p>
        ${!fullDay ? `<p><strong>Time:</strong> ${startTime} - ${endTime}</p>` : ''}
        <p><strong>Total Hours:</strong> ${totalHours}</p>
        <p><strong>Use PTO:</strong> ${usePto ? 'Yes' : 'No'}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please review in Google Sheets and mark Yes/No in the approval column.</p>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});