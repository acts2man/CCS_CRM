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
    if (!data || !data.student_id || !data.date) {
      return Response.json({ error: 'Missing student_id or date' }, { status: 400 });
    }

    const { student_id, date, is_tardy, clock_in_time } = data;

    // Determine attendance status
    let status = 'present';
    if (is_tardy) {
      status = 'tardy';
    } else if (!clock_in_time) {
      status = 'absent';
    }

    // Check if Attendance record already exists for this student + date
    const existingRecords = await base44.asServiceRole.entities.Attendance.filter({
      student_id,
      date
    });

    let result;

    if (existingRecords && existingRecords.length > 0) {
      // Update existing Attendance record
      const attendanceId = existingRecords[0].id;
      result = await base44.asServiceRole.entities.Attendance.update(attendanceId, {
        status,
        synced_from_clock_in_out: true,
        synced_at: new Date().toISOString()
      });
      return Response.json({
        success: true,
        action: 'updated',
        attendance_id: attendanceId,
        status,
        result
      });
    } else {
      // Create new Attendance record
      result = await base44.asServiceRole.entities.Attendance.create({
        student_id,
        date,
        status,
        synced_from_clock_in_out: true,
        synced_at: new Date().toISOString()
      });
      return Response.json({
        success: true,
        action: 'created',
        attendance_id: result.id,
        status,
        result
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});