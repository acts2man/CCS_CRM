import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find Susan Arriaga in Teacher entity
    const teachers = await base44.entities.Teacher.list();
    const susan = teachers.find(t => {
      const fullName = `${t.first_name} ${t.last_name}`;
      return fullName.toLowerCase() === 'susan arriaga';
    });

    if (!susan) {
      return Response.json({ error: 'Susan Arriaga not found in teachers' }, { status: 404 });
    }

    // Update her teacher profile email
    await base44.entities.Teacher.update(susan.id, {
      email: 'sistersuesclass@gmail.com'
    });

    // Invite her as admin with the other email
    await base44.users.inviteUser('susanariaga@gmail.com', 'admin');

    return Response.json({
      success: true,
      message: 'Susan Arriaga admin account created and teacher email updated',
      teacherAvatar: susan.avatar,
      teacherEmail: 'sistersuesclass@gmail.com',
      adminEmail: 'susanariaga@gmail.com'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});