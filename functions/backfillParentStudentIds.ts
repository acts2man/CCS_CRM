import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const [allStudents, allParents] = await Promise.all([
    base44.asServiceRole.entities.Student.list(),
    base44.asServiceRole.entities.Parent.list(),
  ]);

  let studentsFixed = 0;
  let parentsFixed = 0;
  const log = [];

  // For each parent that has student_ids, make sure those students have this parent's id in their parent_ids
  for (const parent of allParents) {
    const linkedStudentIds = parent.student_ids || [];
    for (const studentId of linkedStudentIds) {
      const student = allStudents.find(s => s.id === studentId);
      if (!student) {
        log.push(`⚠️ Parent "${parent.first_name} ${parent.last_name}" references missing student ID: ${studentId}`);
        continue;
      }
      const studentParentIds = student.parent_ids || [];
      if (!studentParentIds.includes(parent.id)) {
        await base44.asServiceRole.entities.Student.update(studentId, {
          parent_ids: [...studentParentIds, parent.id]
        });
        log.push(`✅ Added parent "${parent.first_name} ${parent.last_name}" to student "${student.first_name} ${student.last_name}"`);
        studentsFixed++;
      }
    }
  }

  // For each student that has parent_ids, make sure those parents have this student's id in their student_ids
  // Re-fetch students since we just updated some
  const updatedStudents = await base44.asServiceRole.entities.Student.list();
  for (const student of updatedStudents) {
    const linkedParentIds = student.parent_ids || [];
    for (const parentId of linkedParentIds) {
      const parent = allParents.find(p => p.id === parentId);
      if (!parent) {
        log.push(`⚠️ Student "${student.first_name} ${student.last_name}" references missing parent ID: ${parentId}`);
        continue;
      }
      const parentStudentIds = parent.student_ids || [];
      if (!parentStudentIds.includes(student.id)) {
        await base44.asServiceRole.entities.Parent.update(parentId, {
          student_ids: [...parentStudentIds, student.id]
        });
        log.push(`✅ Added student "${student.first_name} ${student.last_name}" to parent "${parent.first_name} ${parent.last_name}"`);
        parentsFixed++;
      }
    }
  }

  if (log.length === 0) {
    log.push('✅ All parent-student relationships are already in sync. Nothing to fix.');
  }

  return Response.json({ studentsFixed, parentsFixed, log });
});