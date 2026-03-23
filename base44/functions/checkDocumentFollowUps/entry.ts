import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  // Fetch all documents that require response and haven't been responded to
  const docs = await base44.asServiceRole.entities.StudentDocument.filter({ 
    response_required: true,
    parent_responded: false,
    follow_up_sent: false
  }, '-created_date', 200);

  let followUpsSent = 0;
  const now = new Date();

  for (const doc of docs) {
    // Check if 3+ days have passed since notification
    const notifiedAt = new Date(doc.parent_notified_at);
    const daysSinceNotified = Math.floor((now - notifiedAt) / (1000 * 60 * 60 * 24));

    if (daysSinceNotified >= 3) {
      // Get student and parent info
      const student = await base44.asServiceRole.entities.Student.filter({ id: doc.student_id });
      if (!student || student.length === 0) continue;

      const allParents = await base44.asServiceRole.entities.Parent.list();
      const studentParents = allParents.filter(p =>
        (p.student_ids && p.student_ids.includes(doc.student_id)) ||
        (student[0].parent_ids && student[0].parent_ids.includes(p.id))
      );

      if (studentParents.length === 0) continue;

      // Send follow-up emails
      for (const parent of studentParents) {
        if (!parent.email) continue;

        try {
          await resend.emails.send({
            from: 'Calvary Christian School <noreply@calvaryforkidscrm.com>',
            to: parent.email,
            subject: `⏰ Follow-up: Response Needed for ${student[0].first_name} ${student[0].last_name}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#1e293b;padding:28px 32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">Calvary Christian School</h1>
    </div>
    <div style="background:#fef3c7;border-bottom:3px solid #fcd34d;padding:20px 32px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">⏰</div>
      <h2 style="margin:0;color:#b45309;font-size:18px;font-weight:700;">Response Reminder</h2>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hi <strong>${parent.first_name || 'Parent'}</strong>,</p>
      <p style="color:#4b5563;font-size:15px;margin:0 0 20px;line-height:1.6;">
        We sent you a message regarding ${student[0].first_name} ${student[0].last_name} on ${new Date(doc.parent_notified_at).toLocaleDateString()} that required your response. 
        We haven't received your response yet. Please review the original message and provide your confirmation at your earliest convenience.
      </p>
      <div style="background:#f9fafb;border-left:4px solid #f59e0b;padding:16px;border-radius:4px;margin:20px 0;">
        <p style="margin:0;color:#374151;font-weight:600;">Document: ${doc.title}</p>
        <p style="margin:4px 0 0;color:#4b5563;font-size:14px;">Your response is important to us.</p>
      </div>
      <div style="margin-top:24px;padding:16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;text-align:center;">
        <p style="margin:0;color:#0369a1;font-size:14px;font-weight:600;">Questions?</p>
        <p style="margin:4px 0 0;color:#0c4a6e;font-size:14px;">Contact us at <strong>(916) 393-3633</strong></p>
      </div>
    </div>
  </div>
</body>
</html>
            `
          });
          followUpsSent++;
        } catch (err) {
          console.error('Error sending follow-up to parent:', err.message);
        }
      }

      // Update document to mark follow-up as sent
      const updatedLog = doc.communication_log || [];
      updatedLog.push({
        type: 'follow_up_sent',
        timestamp: new Date().toISOString(),
        details: 'Follow-up reminder sent to parent for response'
      });

      await base44.asServiceRole.entities.StudentDocument.update(doc.id, {
        follow_up_sent: true,
        follow_up_sent_at: new Date().toISOString(),
        communication_log: updatedLog,
        status: 'follow_up_sent'
      });
    }
  }

  return Response.json({ success: true, followUpsSent });
});