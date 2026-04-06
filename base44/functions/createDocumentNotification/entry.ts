import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Automation: Creates Notification records when StudentDocument is created
 * Runs immediately on document creation (before scheduled sending)
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

    if (!data || !data.student_id || !data.id || !data.title) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { student_id, id: documentId, title, submitted_by_name } = data;

    // Fetch student to get parents
    const students = await base44.asServiceRole.entities.Student.filter({ id: student_id });
    if (!students || students.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentData = students[0];
    const parentIds = studentData.parent_ids || [];

    if (parentIds.length === 0) {
      return Response.json({
        success: true,
        message: 'No parents linked to student',
        notification_count: 0
      });
    }

    // Fetch all parents
    const allParents = await base44.asServiceRole.entities.Parent.list();
    const parentList = allParents.filter(p => parentIds.includes(p.id));

    let createdCount = 0;

    // Create notification record for each parent
    for (const parent of parentList) {
      if (!parent.email) continue;

      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_id: parent.id,
          recipient_email: parent.email,
          type: 'document',
          title: `New Document: ${title}`,
          message: `A new document "${title}" has been shared for ${studentData.first_name} ${studentData.last_name}. ${submitted_by_name ? `Posted by ${submitted_by_name}.` : ''}`,
          related_entity_id: documentId,
          related_entity_type: 'StudentDocument',
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
      message: `Created ${createdCount} notification(s) for document`
    });
  } catch (error) {
    console.error('Create document notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});