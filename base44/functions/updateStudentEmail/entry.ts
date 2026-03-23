import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { student_id, email } = await req.json();

    if (!student_id || !email) {
      return Response.json({ error: 'Missing student_id or email' }, { status: 400 });
    }

    // Update student with new email
    await base44.asServiceRole.entities.Student.update(student_id, { email });

    return Response.json({ success: true, message: `Updated student ${student_id} with email ${email}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});