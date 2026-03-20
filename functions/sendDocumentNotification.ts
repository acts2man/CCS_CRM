import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const PINGRAM_API_KEY = Deno.env.get('PINGRAM_API_KEY');

// ── Document-type specific copy ──────────────────────────────────────────────
const DOC_COPY = {
  behavior_report: {
    subject: '⚠️ Behavior Report Filed — Action Required',
    headline: 'A Behavior Report Has Been Filed',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fcd34d',
    icon: '⚠️',
    intro: 'We want to keep you informed about your child\'s day. A behavior report has been completed by school staff and requires your awareness.',
    smsPrefix: 'BEHAVIOR REPORT',
  },
  accident_report: {
    subject: '🚑 Accident Report — Your Child Was Involved in an Incident',
    headline: 'An Accident Report Has Been Filed',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    icon: '🚑',
    intro: 'We want to inform you that your child was involved in an accident at school today. Please review the details below and contact us if you have any questions.',
    smsPrefix: 'ACCIDENT REPORT',
  },
  dress_code_violation: {
    subject: 'Dress Code Notice — Calvary Christian School',
    headline: 'Dress Code Notification',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    icon: '👔',
    intro: 'This notice is to inform you of a dress code concern regarding your child. Please review the details below.',
    smsPrefix: 'DRESS CODE NOTICE',
  },
  suspension_notice: {
    subject: '🔴 Suspension Notice — Immediate Attention Required',
    headline: 'Suspension Notice',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    icon: '🔴',
    intro: 'This notice requires your immediate attention. Please contact the school office as soon as possible.',
    smsPrefix: 'SUSPENSION NOTICE',
  },
  preschool_notes: {
    subject: 'Daily Notes from Calvary Preschool',
    headline: 'Preschool Daily Notes',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#7dd3fc',
    icon: '📝',
    intro: 'Here are today\'s notes from your child\'s preschool classroom.',
    smsPrefix: 'PRESCHOOL NOTES',
  },
  other: {
    subject: 'School Notification — Calvary Christian School',
    headline: 'School Notification',
    color: '#1e3a5f',
    bg: '#f0f4ff',
    border: '#a5b4fc',
    icon: '📄',
    intro: 'You have received a notification from Calvary Christian School regarding your child.',
    smsPrefix: 'SCHOOL NOTICE',
  },
};

function getCopy(templateType) {
  return DOC_COPY[templateType] || DOC_COPY.other;
}

function buildEmail(copy, parentName, studentName, doc, submittedBy) {
  const formRows = doc.form_data
    ? Object.entries(doc.form_data)
        .filter(([k, v]) => v && !Array.isArray(v) && k !== 'student_id')
        .map(([k, v]) => `
          <tr>
            <td style="padding:8px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;width:40%;">${k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
            <td style="padding:8px 12px;color:#1f2937;border:1px solid #e5e7eb;">${v}</td>
          </tr>`).join('')
    : '';

  const arrayRows = doc.form_data
    ? Object.entries(doc.form_data)
        .filter(([k, v]) => Array.isArray(v) && v.length > 0)
        .map(([k, v]) => `
          <tr>
            <td style="padding:8px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;width:40%;">${k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
            <td style="padding:8px 12px;color:#1f2937;border:1px solid #e5e7eb;">${v.join(', ')}</td>
          </tr>`).join('')
    : '';

  const notesRow = doc.notes
    ? `<div style="margin-top:16px;padding:12px 16px;background:#f9fafb;border-left:4px solid ${copy.color};border-radius:4px;">
        <strong style="color:#374151;">Notes:</strong>
        <p style="margin:4px 0 0;color:#4b5563;">${doc.notes}</p>
       </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:#1e293b;padding:28px 32px;text-align:center;">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6934d527b5d299be1ef1388b/45bebf8b0_71bb1844-5ca0-4a10-849d-ad0872b11863.png"
           alt="CCS Logo" style="height:56px;width:auto;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
      <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;letter-spacing:0.5px;">Calvary Christian School</h1>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">4911 47th Avenue · Sacramento, CA 95824 · (916) 393-3633</p>
    </div>

    <!-- Alert Banner -->
    <div style="background:${copy.bg};border-bottom:3px solid ${copy.border};padding:20px 32px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">${copy.icon}</div>
      <h2 style="margin:0;color:${copy.color};font-size:20px;font-weight:700;">${copy.headline}</h2>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 8px;">Dear <strong>${parentName}</strong>,</p>
      <p style="color:#4b5563;font-size:15px;margin:0 0 20px;line-height:1.6;">${copy.intro}</p>

      <!-- Student Info -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#64748b;">Student</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1e293b;">${studentName}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Document: <strong>${doc.title}</strong></p>
        <p style="margin:2px 0 0;font-size:13px;color:#64748b;">Filed by: ${submittedBy} · ${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      </div>

      <!-- Form Data Table -->
      ${(formRows || arrayRows) ? `
      <h3 style="margin:0 0 10px;font-size:14px;color:#374151;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Report Details</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
        ${formRows}${arrayRows}
      </table>` : ''}

      ${notesRow}

      <!-- CTA -->
      <div style="margin-top:24px;padding:16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;text-align:center;">
        <p style="margin:0;color:#0369a1;font-size:14px;font-weight:600;">Questions or concerns?</p>
        <p style="margin:4px 0 0;color:#0c4a6e;font-size:14px;">Please contact the school office at <strong>(916) 393-3633</strong> or reply to this email.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Calvary Christian School · Sacramento, CA 95824</p>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">This is an automated notification. Please do not reply directly to this email.</p>
    </div>

  </div>
</body>
</html>`;
}

function buildSMS(copy, parentName, studentName, docTitle, submittedBy) {
  return `[CCS ${copy.smsPrefix}] Hi ${parentName}, a ${docTitle} has been filed for ${studentName} by ${submittedBy}. Please check your email for full details or call us at (916) 393-3633. - Calvary Christian School`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { studentDocumentId } = await req.json();

  // Fetch document
  const docs = await base44.asServiceRole.entities.StudentDocument.filter({ id: studentDocumentId });
  if (!docs || docs.length === 0) return Response.json({ error: 'Document not found' }, { status: 404 });
  const doc = docs[0];

  // Fetch student
  const students = await base44.asServiceRole.entities.Student.filter({ id: doc.student_id });
  if (!students || students.length === 0) return Response.json({ error: 'Student not found' }, { status: 404 });
  const student = students[0];
  const studentName = `${student.first_name} ${student.last_name}`;

  // Find parents — support BOTH linkage directions
  const allParents = await base44.asServiceRole.entities.Parent.list();
  const studentParents = allParents.filter(p =>
    (p.student_ids && p.student_ids.includes(doc.student_id)) ||
    (student.parent_ids && student.parent_ids.includes(p.id))
  );

  if (studentParents.length === 0) {
    return Response.json({ error: 'No parents found for student', notified: 0 }, { status: 200 });
  }

  const copy = getCopy(doc.template_type);
  const submittedBy = doc.submitted_by_name || doc.submitted_by || 'School Staff';
  let emailCount = 0;
  let smsCount = 0;

  for (const parent of studentParents) {
    const parentName = parent.first_name || 'Parent';

    // Send Email
    if (parent.email) {
      await resend.emails.send({
        from: 'Calvary Christian School <noreply@calvaryforkidscrm.com>',
        to: parent.email,
        subject: `${copy.subject} — ${studentName}`,
        html: buildEmail(copy, parentName, studentName, doc, submittedBy),
      });
      emailCount++;
    }

    // Send SMS via Pingram
    if (parent.phone) {
      const smsBody = buildSMS(copy, parentName, studentName, doc.title, submittedBy);
      // Normalize phone to E.164 format (+1XXXXXXXXXX)
      const digits = parent.phone.replace(/\D/g, '');
      const formattedPhone = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
      const smsResp = await fetch('https://api.pingroom.com/v1/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: formattedPhone, message: smsBody }),
      });
      const smsResult = await smsResp.json().catch(() => ({}));
      console.log('Pingram SMS result:', JSON.stringify(smsResult));
      smsCount++;
    }
  }

  // Mark document as notified
  await base44.asServiceRole.entities.StudentDocument.update(doc.id, {
    parent_notified: true,
    parent_notified_at: new Date().toISOString(),
    status: 'parent_notified',
  });

  return Response.json({ success: true, emailCount, smsCount, parents: studentParents.length });
});