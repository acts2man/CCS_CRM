import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { parentPhone, parentName, studentName, message, parentId, studentId } = await req.json();

  if (!parentPhone || !message || !studentId || !parentId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const apiKey = Deno.env.get('PINGRAM_API_KEY');
    if (!apiKey) {
      throw new Error('SMS service not configured');
    }

    // Send SMS via Pingram
    const smsResponse = await fetch('https://api.pingram.com/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: parentPhone,
        message: message,
        from: 'CCS'
      })
    });

    if (!smsResponse.ok) {
      throw new Error(`SMS service returned ${smsResponse.status}`);
    }

    // Log the communication
    await base44.asServiceRole.entities.ParentCommunicationLog.create({
      student_id: studentId,
      student_name: studentName,
      parent_id: parentId,
      parent_name: parentName,
      parent_phone: parentPhone,
      communication_type: 'sms',
      message: message,
      direction: 'outbound',
      status: 'sent',
      initiated_by: user.email,
      initiated_by_name: user.full_name,
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true, message: 'SMS sent successfully' });
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Log failed communication attempt
    try {
      await base44.asServiceRole.entities.ParentCommunicationLog.create({
        student_id: studentId,
        student_name: studentName,
        parent_id: parentId,
        parent_name: parentName,
        parent_phone: parentPhone,
        communication_type: 'sms',
        message: message,
        direction: 'outbound',
        status: 'failed',
        initiated_by: user.email,
        initiated_by_name: user.full_name,
        timestamp: new Date().toISOString(),
        notes: `Error: ${error.message}`
      });
    } catch (logError) {
      console.error('Error logging failed SMS:', logError);
    }
    
    return Response.json({ error: error.message }, { status: 500 });
  }
});