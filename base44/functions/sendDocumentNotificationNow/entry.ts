import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Manual/test trigger to send document notification immediately
 * Called by "Send Now" button in teacher UI for testing
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { document_id } = payload;

    if (!document_id) {
      return Response.json({ error: 'Missing document_id' }, { status: 400 });
    }

    // Fetch the document
    const docs = await base44.asServiceRole.entities.StudentDocument.filter({ id: document_id });
    if (!docs || docs.length === 0) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = docs[0];

    // Check if already sent
    if (doc.parent_notified || doc.parent_notification_sent) {
      return Response.json({
        success: false,
        message: 'Document notification already sent'
      });
    }

    // Fetch student to get parents
    const students = await base44.asServiceRole.entities.Student.filter({ id: doc.student_id });
    if (!students || students.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentData = students[0];
    const parentIds = studentData.parent_ids || [];

    if (parentIds.length === 0) {
      return Response.json({
        success: false,
        message: 'No parents linked to student'
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

      // Create notification record
      try {
        const notification = await base44.asServiceRole.entities.Notification.create({
          recipient_id: parent.id,
          recipient_email: parent.email,
          type: 'document',
          title: `New Document: ${doc.title}`,
          message: `A new document "${doc.title}" has been shared. ${doc.submitted_by_name ? `Posted by ${doc.submitted_by_name}.` : ''} (Sent manually for testing)`,
          related_entity_id: doc.id,
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
          await base44.functions.invoke('sendParentEmail', {
            parentEmail: parent.email,
            parentName: parent.first_name,
            studentName: `${studentData.first_name} ${studentData.last_name}`,
            subject: `New Document: ${doc.title}`,
            message: `A new document has been shared with you: <strong>${doc.title}</strong>${doc.submitted_by_name ? ` Posted by ${doc.submitted_by_name}.` : ''} Please log in to view the full document.`,
            parentId: parent.id,
            studentId: doc.student_id
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
          break;
        } catch (error) {
          lastError = error;
          retries++;

          if (notificationId) {
            await base44.asServiceRole.entities.Notification.update(notificationId, {
              delivery_attempts: retries,
              last_attempt_at: new Date().toISOString(),
              error_message: error.message
            });
          }

          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries - 1) * 1000));
          }
        }
      }

      if (retries >= maxRetries && lastError) {
        failureCount++;
        console.error(`Failed to notify parent ${parent.email}:`, lastError);

        if (notificationId) {
          await base44.asServiceRole.entities.Notification.update(notificationId, {
            delivery_status: 'failed',
            error_message: `Failed after ${maxRetries} attempts: ${lastError.message}`
          });
        }
      }
    }

    // Update StudentDocument to mark notification sent
    try {
      await base44.asServiceRole.entities.StudentDocument.update(document_id, {
        status: 'parent_notified',
        parent_notified: true,
        parent_notification_sent: true,
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
      trigger: 'manual',
      message: `Notified ${successCount} parent(s) immediately`
    });
  } catch (error) {
    console.error('Manual notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});