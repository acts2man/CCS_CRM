import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { studentDocumentId } = await req.json();

  const studentDoc = await base44.entities.StudentDocument.filter({ id: studentDocumentId });
  if (!studentDoc || studentDoc.length === 0) {
    return Response.json({ error: 'Document not found' }, { status: 404 });
  }
  const doc = studentDoc[0];

  const students = await base44.entities.Student.filter({ id: doc.student_id });
  if (!students || students.length === 0) {
    return Response.json({ error: 'Student not found' }, { status: 404 });
  }
  const student = students[0];

  // Find parents
  const parents = await base44.entities.Parent.list();
  const studentParents = parents.filter(p =>
    student.parent_ids && student.parent_ids.includes(p.id)
  );

  if (studentParents.length === 0) {
    return Response.json({ error: 'No parents found for student' }, { status: 404 });
  }

  const notesHtml = doc.notes ? `<p><strong>Notes:</strong> ${doc.notes}</p>` : '';
  const formDataHtml = doc.form_data
    ? Object.entries(doc.form_data)
        .map(([k, v]) => `<tr><td style="padding:4px 8px;font-weight:600;">${k}</td><td style="padding:4px 8px;">${v}</td></tr>`)
        .join('')
    : '';

  for (const parent of studentParents) {
    if (!parent.email) continue;

    await resend.emails.send({
      from: 'Calvary Christian School <noreply@calvarycs.org>',
      to: parent.email,
      subject: `${doc.title} — ${student.first_name} ${student.last_name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#1e3a5f;">Calvary Christian School</h2>
          <h3>${doc.title}</h3>
          <p>Dear ${parent.first_name},</p>
          <p>A document has been filed for your child, <strong>${student.first_name} ${student.last_name}</strong>.</p>
          ${formDataHtml ? `<table style="border-collapse:collapse;width:100%;">${formDataHtml}</table>` : ''}
          ${notesHtml}
          <p>If you have any questions, please contact the school office.</p>
          <hr/>
          <p style="font-size:12px;color:#888;">Calvary Christian School</p>
        </div>
      `
    });
  }

  await base44.asServiceRole.entities.StudentDocument.update(doc.id, {
    parent_notified: true,
    parent_notified_at: new Date().toISOString(),
    status: 'parent_notified'
  });

  return Response.json({ success: true, notified: studentParents.length });
});