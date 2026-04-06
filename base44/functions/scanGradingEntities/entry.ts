import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Scan both Grade and AssignmentGrade entities
    const [gradeRecords, assignmentGradeRecords] = await Promise.all([
      base44.asServiceRole.entities.Grade.list('-created_date', 1000),
      base44.asServiceRole.entities.AssignmentGrade.list('-created_date', 1000)
    ]);

    // Analyze data
    const gradeCount = gradeRecords.length;
    const assignmentGradeCount = assignmentGradeRecords.length;

    // Sample Grade records for inspection
    const sampleGrades = gradeRecords.slice(0, 3).map(g => ({
      id: g.id,
      student_id: g.student_id,
      subject: g.subject,
      assignment_name: g.assignment_name,
      grade_value: g.grade_value,
      created_date: g.created_date
    }));

    // Sample AssignmentGrade records for inspection
    const sampleAssignmentGrades = assignmentGradeRecords.slice(0, 3).map(ag => ({
      id: ag.id,
      student_id: ag.student_id,
      assignment_id: ag.assignment_id,
      percentage: ag.percentage,
      created_date: ag.created_date
    }));

    // Check if any Grade records reference a student that also has AssignmentGrade records
    const gradeStudentIds = new Set(gradeRecords.map(g => g.student_id));
    const assignmentGradeStudentIds = new Set(assignmentGradeRecords.map(ag => ag.student_id));
    const overlappingStudents = [...gradeStudentIds].filter(id => assignmentGradeStudentIds.has(id)).length;

    return Response.json({
      status: 'success',
      summary: {
        grade_records_count: gradeCount,
        assignmentgrade_records_count: assignmentGradeCount,
        overlapping_students: overlappingStudents,
        data_integrity_risk: gradeCount > 0 ? 'HIGH - Grade records exist alongside AssignmentGrade' : 'LOW - No Grade records found'
      },
      sample_grade_records: sampleGrades,
      sample_assignmentgrade_records: sampleAssignmentGrades,
      recommendation: gradeCount > 0 ? 'MIGRATION REQUIRED: Grade records must be mapped to AssignmentGrade before disabling Grade entity' : 'SAFE: Can disable Grade entity immediately'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});