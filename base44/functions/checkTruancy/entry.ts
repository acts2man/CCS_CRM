import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const students = await base44.asServiceRole.entities.Student.filter({ enrollment_status: 'active' });
  const allAttendance = await base44.asServiceRole.entities.Attendance.list('-date', 2000);

  const truancyAlerts = [];

  for (const student of students) {
     // Check absences (now synced from StudentClockInOut via Attendance)
     const absenceRecords = allAttendance
       .filter(a => a.student_id === student.id && a.status === 'absent')
       .sort((a, b) => new Date(b.date) - new Date(a.date));

     // Check tardies (also synced from StudentClockInOut)
     const tardyRecords = allAttendance
       .filter(a => a.student_id === student.id && a.status === 'tardy')
       .sort((a, b) => new Date(b.date) - new Date(a.date));

     if (absenceRecords.length < 3 && tardyRecords.length < 5) continue;

     let alertRecords = absenceRecords;
     let alertType = 'absences';

     // Check for 3 consecutive absences
     if (absenceRecords.length >= 3) {
       const dates = absenceRecords.map(r => r.date);
       let consecutive = 1;
       for (let i = 1; i < dates.length; i++) {
         const prev = new Date(dates[i - 1]);
         const curr = new Date(dates[i]);
         const diff = (prev - curr) / (1000 * 60 * 60 * 24);
         if (diff <= 3) { // allow for weekends
           consecutive++;
           if (consecutive >= 3) break;
         } else {
           consecutive = 1;
         }
       }

       if (consecutive >= 3) {
         alertRecords = absenceRecords.slice(0, 3);
         alertType = 'absences';
       } else if (tardyRecords.length >= 5) {
         // Check for 5+ tardies in last 2 weeks
         const twoWeeksAgo = new Date();
         twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
         const recentTardies = tardyRecords.filter(r => new Date(r.date) >= twoWeeksAgo);
         if (recentTardies.length >= 5) {
           alertRecords = recentTardies.slice(0, 5);
           alertType = 'tardies';
         } else {
           continue;
         }
       } else {
         continue;
       }
     } else if (tardyRecords.length >= 5) {
       // Check for 5+ tardies in last 2 weeks
       const twoWeeksAgo = new Date();
       twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
       const recentTardies = tardyRecords.filter(r => new Date(r.date) >= twoWeeksAgo);
       if (recentTardies.length >= 5) {
         alertRecords = recentTardies.slice(0, 5);
         alertType = 'tardies';
       } else {
         continue;
       }
     } else {
       continue;
     }

     if (alertRecords.length > 0) {
      truancyAlerts.push({ student, records: alertRecords, type: alertType });

      const parents = await base44.asServiceRole.entities.Parent.list();
      const studentParents = parents.filter(p =>
        student.parent_ids && student.parent_ids.includes(p.id)
      );

      for (const parent of studentParents) {
        if (!parent.email) continue;
        const message = alertType === 'tardies'
          ? `has been marked tardy 5 or more times in the past 2 weeks`
          : `has been marked absent for 3 or more consecutive school days`;

        await resend.emails.send({
          from: 'Calvary Christian School <noreply@calvarycs.org>',
          to: parent.email,
          subject: `Attendance Alert — ${student.first_name} ${student.last_name}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#1e3a5f;">Calvary Christian School — Attendance Alert</h2>
              <p>Dear ${parent.first_name},</p>
              <p>We are reaching out because <strong>${student.first_name} ${student.last_name}</strong> ${message}.</p>
              <p>Please contact the school office as soon as possible to discuss your child's attendance.</p>
              <hr/>
              <p style="font-size:12px;color:#888;">Calvary Christian School</p>
            </div>
          `
        });
      }
    }
  }

  return Response.json({ checked: students.length, alerts: truancyAlerts.length });
});