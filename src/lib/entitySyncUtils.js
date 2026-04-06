import { base44 } from '@/api/base44Client';

/**
 * Standardized sync process:
 * 1. Get authenticated user email
 * 2. Find Student/Parent entity by email
 * 3. Traverse relationships via IDs, not emails
 */

export async function getStudentByUserEmail(userEmail) {
  try {
    const students = await base44.entities.Student.filter({ email: userEmail });
    if (students.length === 0) {
      return { student: null, error: `No Student record found with email: ${userEmail}` };
    }
    return { student: students[0], error: null };
  } catch (error) {
    return { student: null, error: `Failed to fetch student: ${error.message}` };
  }
}

export async function getParentByUserEmail(userEmail) {
  try {
    const parents = await base44.entities.Parent.filter({ email: userEmail });
    if (parents.length === 0) {
      return { parent: null, error: `No Parent record found with email: ${userEmail}` };
    }
    return { parent: parents[0], error: null };
  } catch (error) {
    return { parent: null, error: `Failed to fetch parent: ${error.message}` };
  }
}

export async function getStudentsForParent(parentId) {
  try {
    const allStudents = await base44.entities.Student.list();
    // SINGLE SOURCE OF TRUTH: Student.parent_ids[] is the only authority
    const children = allStudents.filter(s => s.parent_ids?.includes(parentId));
    return { students: children, error: null };
  } catch (error) {
    return { students: [], error: `Failed to fetch parent's students: ${error.message}` };
  }
}

export async function getTeacherByUserEmail(userEmail) {
  try {
    const teachers = await base44.entities.Teacher.filter({ email: userEmail });
    if (teachers.length === 0) {
      return { teacher: null, error: `No Teacher record found with email: ${userEmail}` };
    }
    return { teacher: teachers[0], error: null };
  } catch (error) {
    return { teacher: null, error: `Failed to fetch teacher: ${error.message}` };
  }
}

export async function getParentsForStudent(studentId) {
  try {
    // Get student to get parent_ids
    const students = await base44.entities.Student.filter({ id: studentId });
    if (students.length === 0) {
      return { parents: [], error: `Student not found: ${studentId}` };
    }
    
    const student = students[0];
    if (!student.parent_ids || student.parent_ids.length === 0) {
      return { parents: [], error: null };
    }

    // SINGLE SOURCE OF TRUTH: Fetch parents via Student.parent_ids[] ONLY
    const allParents = await base44.entities.Parent.list();
    const parents = allParents.filter(p => student.parent_ids.includes(p.id));
    
    return { parents, error: null };
  } catch (error) {
    return { parents: [], error: `Failed to fetch student's parents: ${error.message}` };
  }
}

export async function getStudentsForTeacher(teacherId) {
  try {
    // SINGLE SOURCE OF TRUTH: Teacher → Students via ClassSection ONLY
    // Never use Student.teacher_ids[]
    const allClasses = await base44.entities.ClassSection.list();
    const teacherClasses = allClasses.filter(c => c.teacher_id === teacherId);
    
    // Collect all unique student IDs from teacher's classes
    const studentIds = new Set();
    teacherClasses.forEach(cls => {
      if (cls.student_ids && Array.isArray(cls.student_ids)) {
        cls.student_ids.forEach(id => studentIds.add(id));
      }
    });
    
    // Fetch all students and filter by the collected IDs
    const allStudents = await base44.entities.Student.list();
    const students = allStudents.filter(s => studentIds.has(s.id));
    
    return { students, classes: teacherClasses, error: null };
  } catch (error) {
    return { students: [], classes: [], error: `Failed to fetch teacher's students: ${error.message}` };
  }
}