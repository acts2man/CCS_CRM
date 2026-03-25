import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { studentName } = await req.json();
    
    const students = await base44.entities.Student.list();
    const student = students.find(s => {
      const fullName = `${s.first_name} ${s.last_name}`;
      return fullName.toLowerCase() === studentName.toLowerCase();
    });

    if (!student) {
      return Response.json({ error: `Student not found: ${studentName}` }, { status: 404 });
    }

    const teachers = await base44.entities.Teacher.list();
    const assignedTeachers = teachers.filter(t => student.teacher_ids?.includes(t.id));

    return Response.json({
      studentId: student.id,
      studentName: `${student.first_name} ${student.last_name}`,
      teacher_ids: student.teacher_ids,
      assignedTeachers: assignedTeachers.map(t => ({
        id: t.id,
        name: `${t.first_name} ${t.last_name}`
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});