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
    // Filter students where parent_ids contains this parentId
    const children = allStudents.filter(s => s.parent_ids?.includes(parentId));
    return { students: children, error: null };
  } catch (error) {
    return { students: [], error: `Failed to fetch parent's students: ${error.message}` };
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

    // Fetch all parents and filter by IDs
    const allParents = await base44.entities.Parent.list();
    const parents = allParents.filter(p => student.parent_ids.includes(p.id));
    
    return { parents, error: null };
  } catch (error) {
    return { parents: [], error: `Failed to fetch student's parents: ${error.message}` };
  }
}