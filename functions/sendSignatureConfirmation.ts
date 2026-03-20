import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { studentDocumentId, signatureId, parentEmail } = await req.json();

    const doc = await base44.asServiceRole.entities.StudentDocument.list('', 1);
    const studentDoc = doc.find(d => d.id === studentDocumentId);
    if (!studentDoc) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const students = await base44.asServiceRole.entities.Student.filter({ id: studentDoc.student_id }, '', 1);
    const student = students[0];

    const teachers = await base44.asServiceRole.entities.Teacher.filter({ email: studentDoc.submitted_by }, '', 1);
    const teacher = teachers[0];

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #10b981; margin: 0;">✓ Signature Received</h2>
        </div>
        
        <p>Thank you for acknowledging the document.</p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0 0 10px 0; font-weight: 600;">Document:</p>
          <p style="margin: 0 0 5px 0;">${studentDoc.title}</p>
          <p style="margin: 0; font-size: 14px; color: #666;">Student: ${student.first_name} ${student.last_name}</p>
        </div>
        
        <p style="font-size: 14px; color: #666;">This is a confirmation that we received your acknowledgment on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
          <p style="margin: 0;">Calvary Christian School</p>
        </div>
      </div>
    `;

    const notifyHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #3b82f6; margin: 0;">Document Acknowledged</h2>
        </div>
        
        <p>A parent has acknowledged a document you sent.</p>
        
        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0 0 10px 0; font-weight: 600;">Document:</p>
          <p style="margin: 0 0 5px 0;">${studentDoc.title}</p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Student: ${student.first_name} ${student.last_name}</p>
          <p style="margin: 0; font-size: 14px; color: #666;">Parent: ${parentEmail}</p>
        </div>
        
        <p style="font-size: 14px; color: #666;">Signed: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
          <p style="margin: 0;">Calvary Christian School Management System</p>
        </div>
      </div>
    `;

    await Promise.all([
      base44.asServiceRole.integrations.Core.SendEmail({
        to: parentEmail,
        subject: `Signature Received - ${studentDoc.title}`,
        body: html,
      }),
      teacher && base44.asServiceRole.integrations.Core.SendEmail({
        to: teacher.email,
        subject: `Document Acknowledged - ${studentDoc.title}`,
        body: notifyHTML,
      }),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});