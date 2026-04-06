import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Automation: Syncs Payment to StudentBalance
 * When Payment is created → StudentBalance total_paid increases, outstanding_balance decreases
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

    if (!data || !data.student_id || !data.amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { student_id, student_name, amount, payment_date } = data;

    // Fetch or create StudentBalance
    const balances = await base44.asServiceRole.entities.StudentBalance.filter({
      student_id: student_id
    });

    let balance;

    if (balances.length === 0) {
      // Create new balance with payment already applied
      balance = await base44.asServiceRole.entities.StudentBalance.create({
        student_id: student_id,
        student_name: student_name || '',
        total_charged: 0,
        total_paid: amount,
        outstanding_balance: 0,
        last_payment_date: payment_date,
        last_payment_amount: amount,
        status: 'current'
      });
    } else {
      // Update existing balance
      balance = balances[0];
      const newTotalPaid = (balance.total_paid || 0) + amount;
      const newOutstanding = Math.max(0, (balance.total_charged || 0) - newTotalPaid);

      // Determine status
      let status = 'current';
      if (newOutstanding > 0) {
        const charges = await base44.asServiceRole.entities.Charge.filter({
          student_id: student_id
        });
        const today = new Date().toISOString().split('T')[0];
        const hasOverdue = charges.some(c => c.due_date && c.due_date < today && c.status !== 'paid' && c.status !== 'waived');
        status = hasOverdue ? 'overdue' : 'outstanding';
      }

      balance = await base44.asServiceRole.entities.StudentBalance.update(balance.id, {
        total_paid: newTotalPaid,
        outstanding_balance: newOutstanding,
        last_payment_date: payment_date,
        last_payment_amount: amount,
        status: status
      });
    }

    return Response.json({
      success: true,
      student_id: student_id,
      payment_amount: amount,
      new_total_paid: balance.total_paid,
      new_outstanding_balance: balance.outstanding_balance,
      balance_status: balance.status
    });
  } catch (error) {
    console.error('Sync payment to balance error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});