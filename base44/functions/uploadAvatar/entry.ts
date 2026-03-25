import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { avatarData } = body;

    if (!avatarData) {
      return Response.json({ error: 'No avatar data provided' }, { status: 400 });
    }

    // Update user with avatar
    await base44.asServiceRole.entities.User.update(user.id, { avatar: avatarData });

    return Response.json({ success: true, avatar: avatarData });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});