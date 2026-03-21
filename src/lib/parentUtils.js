import { base44 } from '@/api/base44Client';

/**
 * Get all students associated with a parent by their email
 * Queries Student records where parent_ids includes the parent's ID
 */
export const getParentStudents = async (parentEmail) => {
  try {
    // First, find the parent record by email
    const parentRecords = await base44.entities.Parent.filter({ email: parentEmail });
    if (parentRecords.length === 0) return [];
    
    const parentId = parentRecords[0].id;
    
    // Get all students
    const allStudents = await base44.entities.Student.list();
    
    // Filter students where this parent is in their parent_ids
    const parentStudents = allStudents.filter(student => 
      student.parent_ids && student.parent_ids.includes(parentId)
    );
    
    return parentStudents;
  } catch (error) {
    console.error('Error fetching parent students:', error);
    return [];
  }
};

/**
 * Get parent record by email, ensuring parent is linked to their students
 */
export const getParentWithStudents = async (parentEmail) => {
  try {
    const parentRecords = await base44.entities.Parent.filter({ email: parentEmail });
    if (parentRecords.length === 0) return null;
    
    const parent = parentRecords[0];
    const students = await getParentStudents(parentEmail);
    
    return {
      ...parent,
      students
    };
  } catch (error) {
    console.error('Error fetching parent with students:', error);
    return null;
  }
};