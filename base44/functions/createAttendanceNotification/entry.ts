import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Automation: Creates Notification records when Attendance is marked absent/tardy
 * Alerts parents immediately when attendance changes
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { event, data } = payload;

    if (!data || !data.student_id || !data.status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { student_id, status, id: attendanceId, date, reason } = data;

    // Only create notifications for absent or tardy
    if (status !== 'absent' && status !== 'tardy') {
      return Response.json({
        success: true,
        message: 'No notification needed for present status'
      });
    }

    // Fetch student
    const students = await base44.asServiceRole.entities.Student.filter({ id: student_id });
    if (!students || students.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentData = students[0];
    const parentIds = studentData.parent_ids || [];

    if (parentIds.length === 0) {
      return Response.json({
        success: true,
        message: 'No parents linked to student'
      });
    }

    // Fetch all parents
    const allParents = await base44.asServiceRole.entities.Parent.list();
    const parentList = allParents.filter(p => parentIds.includes(p.id));

    let createdCount = 0;
    const statusLabel = status === 'absent' ? 'Absent' : 'Tardy';

    // Create notification for each parent
    for (const parent of parentList) {
      if (!parent.email) continue;

      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_id: parent.id,
          recipient_email: parent.email,
          type: 'attendance',
          title: `Attendance Alert: ${statusLabel}`,
          message: `${studentData.first_name} ${studentData.last_name} was marked ${status} on ${date}. ${reason ? `Reason: ${reason}` : ''}`,
          related_entity_id: attendanceId,
          related_entity_type: 'Attendance',
          is_read: false,
          delivery_status: 'pending'
        });
        createdCount++;
      } catch (err) {
        console.error(`Failed to create notification for parent ${parent.id}:`, err);
      }
    }

    return Response.json({
      success: true,
      notification_count: createdCount,
      status: status,
      message: `Created ${createdCount} attendance notification(s)`
    });
  } catch (error) {
    console.error('Create attendance notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});