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

    // Validate payload
    if (!data || !data.student_id || !data.title) {
      return Response.json({ error: 'Missing student_id or title' }, { status: 400 });
    }

    const { student_id, id: documentId, title, submitted_by_name } = data;

    // Fetch student to get parents
    const student = await base44.asServiceRole.entities.Student.filter(
      { id: student_id }
    );

    if (!student || student.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentData = student[0];
    const parentIds = studentData.parent_ids || [];

    if (parentIds.length === 0) {
      return Response.json({
        success: false,
        message: 'No parents linked to student',
        notification_count: 0
      });
    }

    // Fetch all parents
    const allParents = await base44.asServiceRole.entities.Parent.list();
    const parentList = allParents.filter(p => parentIds.includes(p.id));

    let successCount = 0;
    let failureCount = 0;
    const notificationIds = [];

    // Send notifications to each parent
    for (const parent of parentList) {
      if (!parent.email) continue;

      let retries = 0;
      const maxRetries = 3;
      let lastError = null;
      let notificationId = null;

      // Create notification record first (will update with delivery status)
      try {
        const notification = await base44.asServiceRole.entities.Notification.create({
          recipient_id: parent.id,
          recipient_email: parent.email,
          type: 'document',
          title: `New Document: ${title}`,
          message: `A new document "${title}" has been shared. ${submitted_by_name ? `Posted by ${submitted_by_name}.` : ''}`,
          related_entity_id: documentId,
          related_entity_type: 'StudentDocument',
          delivery_status: 'pending'
        });
        notificationId = notification.id;
      } catch (err) {
        console.error('Failed to create notification record:', err);
      }

      // Retry logic for email delivery
      while (retries < maxRetries) {
        try {
          const emailResult = await base44.functions.invoke('sendParentEmail', {
            parentEmail: parent.email,
            parentName: parent.first_name,
            studentName: `${studentData.first_name} ${studentData.last_name}`,
            subject: `New Document: ${title}`,
            message: `A new document has been shared with you: <strong>${title}</strong>${submitted_by_name ? ` Posted by ${submitted_by_name}.` : ''} Please log in to view the full document.`,
            parentId: parent.id,
            studentId: student_id
          });

          // Update notification to sent
          if (notificationId) {
            await base44.asServiceRole.entities.Notification.update(notificationId, {
              delivery_status: 'sent',
              delivery_attempts: retries + 1,
              last_attempt_at: new Date().toISOString()
            });
          }

          successCount++;
          notificationIds.push(notificationId);
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          retries++;

          // Update notification with attempt info
          if (notificationId) {
            await base44.asServiceRole.entities.Notification.update(notificationId, {
              delivery_attempts: retries,
              last_attempt_at: new Date().toISOString(),
              error_message: error.message
            });
          }

          if (retries < maxRetries) {
            // Wait before retry (exponential backoff: 1s, 2s, 4s)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries - 1) * 1000));
          }
        }
      }

      if (retries >= maxRetries && lastError) {
        failureCount++;
        console.error(`Failed to notify parent ${parent.email} after ${maxRetries} attempts:`, lastError);

        // Update notification to failed
        if (notificationId) {
          await base44.asServiceRole.entities.Notification.update(notificationId, {
            delivery_status: 'failed',
            error_message: `Failed after ${maxRetries} attempts: ${lastError.message}`
          });
        }
      }
    }

    // Update StudentDocument to mark parents notified
    try {
      await base44.asServiceRole.entities.StudentDocument.update(documentId, {
        parent_notified: true,
        parent_notified_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to update StudentDocument:', err);
    }

    return Response.json({
      success: successCount > 0,
      parents_notified: successCount,
      parents_failed: failureCount,
      notification_ids: notificationIds,
      message: `Notified ${successCount} parent(s), ${failureCount} failed`
    });
  } catch (error) {
    console.error('Document notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});