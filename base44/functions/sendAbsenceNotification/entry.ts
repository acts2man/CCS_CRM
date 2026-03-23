import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { event, data } = await req.json();

  // Only process absence/tardy events
  if (!data || !['absent', 'tardy'].includes(data.status)) {
    return Response.json({ skipped: true });
  }

  const students = await base44.asServiceRole.entities.Student.filter({ id: data.student_id });
  if (!students || students.length === 0) return Response.json({ error: 'Student not found' });
  const student = students[0];

  const parents = await base44.asServiceRole.entities.Parent.list();
  const studentParents = parents.filter(p =>
    student.parent_ids && student.parent_ids.includes(p.id)
  );

  if (studentParents.length === 0) return Response.json({ skipped: true, reason: 'No parents' });

  const isAbsent = data.status === 'absent';
  const subject = isAbsent
    ? `Absence Notice — ${student.first_name} ${student.last_name}`
    : `Tardy Notice — ${student.first_name} ${student.last_name}`;

  const body = isAbsent
    ? `<p>Your child, <strong>${student.first_name} ${student.last_name}</strong>, was marked <strong>absent</strong> today (${data.date}).</p>
       <p>If this absence is incorrect, please contact the school office immediately.</p>`
    : `<p>Your child, <strong>${student.first_name} ${student.last_name}</strong>, was marked <strong>tardy</strong> today (${data.date}).</p>
       <p>Please ensure your child arrives on time. If you have questions, contact the school office.</p>`;

  for (const parent of studentParents) {
    if (!parent.email) continue;
    await resend.emails.send({
      from: 'Calvary Christian School <noreply@calvarycs.org>',
      to: parent.email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#1e3a5f;">Calvary Christian School</h2>
          ${body}
          <hr/>
          <p style="font-size:12px;color:#888;">Calvary Christian School Attendance System</p>
        </div>
      `
    });
  }

  await base44.asServiceRole.entities.Attendance.update(data.id, { parent_notified: true, notification_sent_at: new Date().toISOString() });

  return Response.json({ success: true });
});