import { base44 } from '@/api/base44Client';

/**
 * Get all students associated with a parent by their email
 * Queries Student records where parent_ids includes the parent's ID
 */
export const getParentStudents = async (parentEmail) => {
  try {
    // Get all students
    const allStudents = await base44.entities.Student.list();
    
    // Filter students where the parent email matches any parent's email in their linked parents
    const parentStudents = [];
    
    for (const student of allStudents) {
      if (student.parent_ids && student.parent_ids.length > 0) {
        const parentRecords = await base44.entities.Parent.filter({ 
          email: parentEmail 
        });
        
        if (parentRecords.length > 0) {
          const parentId = parentRecords[0].id;
          if (student.parent_ids.includes(parentId)) {
            parentStudents.push(student);
          }
        }
      }
    }
    
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
    // Find parent record by email
    const parentRecords = await base44.entities.Parent.filter({ email: parentEmail });
    if (parentRecords.length === 0) return null;
    
    const parent = parentRecords[0];
    
    // Get all students linked to this parent
    const allStudents = await base44.entities.Student.list();
    const students = allStudents.filter(student => 
      student.parent_ids && student.parent_ids.includes(parent.id)
    );
    
    return {
      ...parent,
      students
    };
  } catch (error) {
    console.error('Error fetching parent with students:', error);
    return null;
  }
};