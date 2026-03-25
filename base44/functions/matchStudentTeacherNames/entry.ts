import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Matches students with teacher_names to actual Teacher IDs
 * Searches for teachers by first_name + last_name combination
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Only admins can run this
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all students and teachers
    const [students, teachers] = await Promise.all([
      base44.entities.Student.list(),
      base44.entities.Teacher.list(),
    ]);

    let matched = 0;
    let errors = [];

    // For each student, try to match teacher names to IDs
    for (const student of students) {
      // Skip if already has teacher_ids
      if (student.teacher_ids && student.teacher_ids.length > 0) {
        continue;
      }

      // Check if notes contain teacher name (flexible matching)
      const studentNotes = (student.notes || '').toLowerCase();
      const studentInfo = `${student.first_name} ${student.last_name}`.toLowerCase();
      
      const matchedTeacherIds = [];

      // Try to find teachers mentioned in notes or student info
      for (const teacher of teachers) {
        const teacherName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase();
        const teacherFirstName = teacher.first_name.toLowerCase();
        const teacherLastName = teacher.last_name.toLowerCase();

        // Check if teacher name is in student notes
        if (
          studentNotes.includes(teacherName) ||
          studentNotes.includes(teacherFirstName) ||
          studentNotes.includes(teacherLastName)
        ) {
          matchedTeacherIds.push(teacher.id);
        }
      }

      // If teachers found, update student
      if (matchedTeacherIds.length > 0) {
        try {
          await base44.entities.Student.update(student.id, {
            teacher_ids: matchedTeacherIds,
          });
          matched++;
        } catch (error) {
          errors.push({
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            error: error.message,
          });
        }
      }
    }

    return Response.json({
      success: true,
      matched,
      errors,
      message: `Successfully matched ${matched} students to teachers`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});