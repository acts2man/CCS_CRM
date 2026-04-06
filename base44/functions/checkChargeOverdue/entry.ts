import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Automation: Checks if Charge is overdue
 * When Charge is created/updated → if due_date passed and status unpaid/partial:
 *   1. Update StudentBalance.status = "overdue"
 *   2. Create Notification for parent
 *   3. Send email reminder (optional)
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

    if (!data || !data.student_id || !data.due_date || !data.amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { student_id, due_date, status: chargeStatus, description, amount } = data;
    const today = new Date().toISOString().split('T')[0];

    // Only process unpaid/partial charges that are overdue
    if ((chargeStatus !== 'unpaid' && chargeStatus !== 'partial') || due_date >= today) {
      return Response.json({
        success: true,
        message: 'Charge not overdue or already paid'
      });
    }

    // Update StudentBalance status to overdue
    const balances = await base44.asServiceRole.entities.StudentBalance.filter({
      student_id: student_id
    });

    if (balances.length > 0) {
      await base44.asServiceRole.entities.StudentBalance.update(balances[0].id, {
        status: 'overdue'
      });
    }

    // Fetch student to get parent IDs
    const students = await base44.asServiceRole.entities.Student.filter({ id: student_id });
    if (!students || students.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = students[0];
    const parentIds = student.parent_ids || [];

    if (parentIds.length === 0) {
      return Response.json({
        success: true,
        message: 'No parents linked to student for notification'
      });
    }

    // Fetch all parents
    const allParents = await base44.asServiceRole.entities.Parent.list();
    const parents = allParents.filter(p => parentIds.includes(p.id));

    let notificationCount = 0;

    // Create Notification for each parent
    for (const parent of parents) {
      if (!parent.email) continue;

      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_id: parent.id,
          recipient_email: parent.email,
          type: 'billing',
          title: 'Overdue Payment Reminder',
          message: `Payment for "${description}" (due ${due_date}) is now overdue. Amount: $${amount}. Please pay as soon as possible.`,
          related_entity_type: 'Charge',
          is_read: false,
          delivery_status: 'pending'
        });
        notificationCount++;
      } catch (err) {
        console.error(`Failed to create notification for parent ${parent.id}:`, err);
      }
    }

    return Response.json({
      success: true,
      student_id: student_id,
      charge_amount: amount,
      due_date: due_date,
      days_overdue: Math.floor((new Date(today) - new Date(due_date)) / (1000 * 60 * 60 * 24)),
      notifications_created: notificationCount,
      message: `Marked charge as overdue and notified ${notificationCount} parent(s)`
    });
  } catch (error) {
    console.error('Check charge overdue error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});