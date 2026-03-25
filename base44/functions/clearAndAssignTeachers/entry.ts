import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { teacherStudentMap } = await req.json();

    const [allTeachers, allStudents] = await Promise.all([
      base44.entities.Teacher.list(),
      base44.entities.Student.list(),
    ]);

    let updated = 0;
    let errors = [];

    for (const [teacherName, studentNames] of Object.entries(teacherStudentMap)) {
      const teacher = allTeachers.find(t => {
        const fullName = `${t.first_name} ${t.last_name}`;
        return fullName.toLowerCase() === teacherName.toLowerCase();
      });

      if (!teacher) {
        errors.push({ error: `Teacher not found: ${teacherName}`, teacherId: null });
        continue;
      }

      for (const studentName of studentNames) {
        const student = allStudents.find(s => {
          const fullName = `${s.first_name} ${s.last_name}`;
          return fullName.toLowerCase() === studentName.toLowerCase();
        });

        if (!student) {
          errors.push({ error: `Student not found: ${studentName}` });
          continue;
        }

        try {
          await base44.entities.Student.update(student.id, {
            teacher_ids: [teacher.id],
          });
          updated++;
        } catch (error) {
          errors.push({
            student: studentName,
            teacher: teacherName,
            error: error.message,
          });
        }
      }
    }

    return Response.json({
      success: true,
      updated,
      errors,
      message: `Updated ${updated} students`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});