import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * generateReportCard(studentId, period)
 *
 * 1. Get all AssignmentGrade for student
 * 2. Group by class_section_id
 * 3. Calculate average per class (using graded entries only)
 * 4. Build and SAVE ReportCard entity
 * 5. Return generated ReportCard
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { student_id, period_id, school_year, reporting_period, period_start_date, period_end_date } = await req.json();

    if (!student_id || !reporting_period) {
      return Response.json({ error: 'student_id and reporting_period are required' }, { status: 400 });
    }

    // --- 1. Fetch student ---
    const students = await base44.asServiceRole.entities.Student.filter({ id: student_id });
    if (!students || students.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }
    const student = students[0];

    // --- 2. Fetch all AssignmentGrades for student ---
    const allGrades = await base44.asServiceRole.entities.AssignmentGrade.filter({
      student_id: student_id
    });

    // Use only graded entries
    const gradedEntries = allGrades.filter(g => g.status === 'graded' && g.percentage !== null && g.percentage !== undefined);

    // --- 3. Group by class_section_id ---
    const byClass = {};
    for (const grade of gradedEntries) {
      if (!grade.class_section_id) continue;
      if (!byClass[grade.class_section_id]) {
        byClass[grade.class_section_id] = [];
      }
      byClass[grade.class_section_id].push(grade);
    }

    // --- 4. Fetch class sections to get names ---
    const classSectionIds = Object.keys(byClass);
    let classSections = [];
    if (classSectionIds.length > 0) {
      classSections = await base44.asServiceRole.entities.ClassSection.list();
    }

    // --- 5. Calculate average per class ---
    const toLetter = (avg) => {
      if (avg === null || avg === undefined) return '—';
      if (avg >= 90) return 'A';
      if (avg >= 80) return 'B';
      if (avg >= 70) return 'C';
      if (avg >= 60) return 'D';
      return 'F';
    };

    const classResults = classSectionIds.map(classId => {
      const classGrades = byClass[classId];
      const avg = classGrades.reduce((sum, g) => sum + g.percentage, 0) / classGrades.length;
      const section = classSections.find(c => c.id === classId);

      return {
        class_id: classId,
        class_name: section?.name || `Class ${classId.slice(-6)}`,
        teacher_name: section?.teacher_name || '',
        number_grade: Math.round(avg * 10) / 10,
        letter_grade: toLetter(avg),
        grade_components: {
          assignment_count: classGrades.length,
          grades: classGrades.map(g => ({
            assignment_id: g.assignment_id,
            percentage: g.percentage,
            points_earned: g.points_earned,
            points_possible: g.points_possible
          }))
        }
      };
    });

    // Sort by class name
    classResults.sort((a, b) => a.class_name.localeCompare(b.class_name));

    // --- 6. Overall grade ---
    const clasesWithGrades = classResults.filter(c => c.number_grade !== null);
    const overallAvg = clasesWithGrades.length > 0
      ? clasesWithGrades.reduce((sum, c) => sum + c.number_grade, 0) / clasesWithGrades.length
      : null;

    // --- 7. Attendance for period ---
    let attendance = { present: 0, absent: 0, tardy: 0, excused: 0, attendance_rate: 0 };
    if (period_start_date && period_end_date) {
      const allAttendance = await base44.asServiceRole.entities.Attendance.filter({
        student_id: student_id
      });
      const periodAttendance = allAttendance.filter(a => a.date >= period_start_date && a.date <= period_end_date);
      const present = periodAttendance.filter(a => a.status === 'present').length;
      const absent = periodAttendance.filter(a => a.status === 'absent').length;
      const tardy = periodAttendance.filter(a => a.status === 'tardy').length;
      const excused = periodAttendance.filter(a => a.status === 'excused').length;
      const total = periodAttendance.length;
      attendance = {
        present,
        absent,
        tardy,
        excused,
        attendance_rate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0
      };
    }

    // --- 8. Build ReportCard object ---
    const reportCardData = {
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      student_grade_level: student.grade_level,
      school_year: school_year || '2025-2026',
      reporting_period: reporting_period,
      period_start_date: period_start_date || null,
      period_end_date: period_end_date || null,
      classes: classResults,
      overall_number_grade: overallAvg !== null ? Math.round(overallAvg * 10) / 10 : null,
      overall_letter_grade: toLetter(overallAvg),
      attendance: attendance,
      grade_scale: { A: '90-100%', B: '80-89%', C: '70-79%', D: '60-69%', F: '<60%' },
      generated_date: new Date().toISOString(),
      generated_by: user.email,
      is_final: false
    };

    // --- 9. Save to ReportCard entity ---
    // Check if one already exists for this student + period + year (upsert)
    const existing = await base44.asServiceRole.entities.ReportCard.filter({
      student_id: student.id,
      school_year: reportCardData.school_year,
      reporting_period: reporting_period
    });

    let savedCard;
    if (existing.length > 0) {
      savedCard = await base44.asServiceRole.entities.ReportCard.update(existing[0].id, reportCardData);
    } else {
      savedCard = await base44.asServiceRole.entities.ReportCard.create(reportCardData);
    }

    return Response.json({
      success: true,
      report_card: savedCard,
      summary: {
        student_name: reportCardData.student_name,
        reporting_period: reporting_period,
        classes_with_grades: classResults.length,
        total_graded_assignments: gradedEntries.length,
        overall_average: reportCardData.overall_number_grade,
        overall_letter: reportCardData.overall_letter_grade,
        was_updated: existing.length > 0
      }
    });
  } catch (error) {
    console.error('generateReportCard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});