import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { parentEmail, parentName, studentName, subject, message, parentId, studentId } = await req.json();

  if (!parentEmail || !subject || !message || !studentId || !parentId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Send email
    await resend.emails.send({
      from: 'Calvary Christian School <noreply@calvaryforkidscrm.com>',
      to: parentEmail,
      subject: subject,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#1e293b;padding:28px 32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">Calvary Christian School</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hello ${parentName || 'Parent'},</p>
      <p style="color:#4b5563;font-size:15px;margin:0 0 20px;line-height:1.6;">
        We are reaching out regarding ${studentName}.
      </p>
      <div style="background:#f9fafb;border-left:4px solid #3b82f6;padding:16px;border-radius:4px;margin:20px 0;">
        <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${message}</p>
      </div>
      <p style="color:#4b5563;font-size:15px;margin:20px 0 0;line-height:1.6;">
        If you have any questions or concerns, please don't hesitate to reach out.
      </p>
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;color:#4b5563;font-size:13px;">
          <strong>From:</strong> ${user.full_name} at Calvary Christian School<br>
          <strong>Contact:</strong> (916) 393-3633
        </p>
      </div>
    </div>
  </div>
</body>
</html>
      `
    });

    // Log the communication
    await base44.asServiceRole.entities.ParentCommunicationLog.create({
      student_id: studentId,
      student_name: studentName,
      parent_id: parentId,
      parent_name: parentName,
      parent_email: parentEmail,
      communication_type: 'email',
      subject: subject,
      message: message,
      direction: 'outbound',
      status: 'sent',
      initiated_by: user.email,
      initiated_by_name: user.full_name,
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log failed communication attempt
    try {
      await base44.asServiceRole.entities.ParentCommunicationLog.create({
        student_id: studentId,
        student_name: studentName,
        parent_id: parentId,
        parent_name: parentName,
        parent_email: parentEmail,
        communication_type: 'email',
        subject: subject,
        message: message,
        direction: 'outbound',
        status: 'failed',
        initiated_by: user.email,
        initiated_by_name: user.full_name,
        timestamp: new Date().toISOString(),
        notes: `Error: ${error.message}`
      });
    } catch (logError) {
      console.error('Error logging failed communication:', logError);
    }
    
    return Response.json({ error: error.message }, { status: 500 });
  }
});