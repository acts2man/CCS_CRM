import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find student by email
    const students = await base44.entities.Student.filter({ email: user.email });
    
    if (students.length === 0) {
      return Response.json({ error: 'No student found with this email' }, { status: 404 });
    }

    const student = students[0];

    // Update user profile with student data
    await base44.auth.updateMe({
      first_name: student.first_name,
      last_name: student.last_name,
      student_id: student.id,
      grade_level: student.grade_level
    });

    return Response.json({ success: true, message: 'Student profile synced' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});