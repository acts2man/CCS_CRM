import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { event, data } = payload;

    if (!data || !data.student_id || !data.id) {
      return Response.json({ error: 'Missing student_id or document_id' }, { status: 400 });
    }

    const { student_id, id: documentId, send_delay_minutes = 10, title, submitted_by_name } = data;

    // Calculate scheduled send time
    const now = new Date();
    const scheduledTime = new Date(now.getTime() + (send_delay_minutes * 60 * 1000));

    // Update document with scheduled send time and status
    await base44.asServiceRole.entities.StudentDocument.update(documentId, {
      status: 'scheduled',
      scheduled_send_at: scheduledTime.toISOString(),
      send_delay_minutes: send_delay_minutes
    });

    console.log(`Document ${documentId} scheduled for notification at ${scheduledTime.toISOString()}`);

    return Response.json({
      success: true,
      document_id: documentId,
      scheduled_send_at: scheduledTime.toISOString(),
      delay_minutes: send_delay_minutes,
      message: `Document notification scheduled for ${send_delay_minutes} minutes from now`
    });
  } catch (error) {
    console.error('Schedule notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});