import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await base44.entities.Student.list('-created_date', 500);
      
      // Fetch related data for each student
      const studentsWithRelations = await Promise.all(
        studentsData.map(async (student) => {
          // Fetch emergency contacts
          let emergency_contacts = [];
          try {
            emergency_contacts = await base44.entities.ParentContact.filter(
              { student_id: student.id },
              '',
              10
            );
          } catch (err) {
            console.error('Error fetching emergency contacts:', err);
          }

          // Fetch documents
          let student_documents = [];
          try {
            student_documents = await base44.entities.Document.filter(
              { student_id: student.id },
              '',
              50
            );
          } catch (err) {
            console.error('Error fetching student documents:', err);
          }

          return {
            ...student,
            emergency_contacts,
            documents: student_documents
          };
        })
      );

      setStudents(studentsWithRelations);
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (studentData, emergencyContactData) => {
    try {
      console.log('Creating student with data:', studentData);
      
      const newStudent = await base44.entities.Student.create(studentData);
      
      if (!newStudent) {
        throw new Error('No student data returned from insert');
      }

      console.log('Student created successfully:', newStudent);

      // Create emergency contact if provided
      if (emergencyContactData && newStudent.id) {
        console.log('Creating emergency contact for student ID:', newStudent.id);
        try {
          await base44.entities.ParentContact.create({
            student_id: newStudent.id,
            name: emergencyContactData.name,
            relationship: emergencyContactData.relationship,
            phone: emergencyContactData.phone,
            email: emergencyContactData.email || '',
            is_primary: true,
            can_pickup: true
          });
          console.log('Emergency contact created successfully');
        } catch (contactError) {
          console.error('Emergency contact creation error:', contactError);
          console.log('⚠️ Student created but emergency contact failed to save');
        }
      }

      await fetchStudents();
      return { data: newStudent, error: null };
    } catch (err) {
      console.error('Error in addStudent:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error: { message: errorMessage } };
    }
  };

  const updateStudent = async (id, studentData, emergencyContactData) => {
    try {
      console.log('=== STUDENT UPDATE OPERATION START ===');
      console.log('Updating student with ID:', id);
      
      const updatedStudent = await base44.entities.Student.update(id, studentData);
      
      if (!updatedStudent) {
        throw new Error('No student data returned from update');
      }

      console.log('Student updated successfully:', updatedStudent);

      // Handle emergency contact update/creation if provided
      if (emergencyContactData) {
        console.log('Processing emergency contact update...');
        
        // Check if an emergency contact already exists for this student
        const existingContacts = await base44.entities.ParentContact.filter(
          { student_id: id },
          '',
          1
        );

        if (existingContacts && existingContacts.length > 0) {
          // Update existing emergency contact
          console.log('Updating existing emergency contact:', existingContacts[0].id);
          try {
            await base44.entities.ParentContact.update(existingContacts[0].id, {
              name: emergencyContactData.name,
              relationship: emergencyContactData.relationship,
              phone: emergencyContactData.phone,
              email: emergencyContactData.email || existingContacts[0].email
            });
            console.log('Emergency contact updated successfully');
          } catch (contactError) {
            console.error('Emergency contact update error:', contactError);
            console.log('⚠️ Student updated but emergency contact failed to update');
          }
        } else {
          // Create new emergency contact
          console.log('Creating new emergency contact for student:', id);
          try {
            await base44.entities.ParentContact.create({
              student_id: id,
              name: emergencyContactData.name,
              relationship: emergencyContactData.relationship,
              phone: emergencyContactData.phone,
              email: emergencyContactData.email || '',
              is_primary: true,
              can_pickup: true
            });
            console.log('Emergency contact created successfully');
          } catch (contactError) {
            console.error('Emergency contact creation error:', contactError);
            console.log('⚠️ Student updated but emergency contact failed to create');
          }
        }
      }

      await fetchStudents();
      console.log('=== STUDENT UPDATE OPERATION SUCCESS ===');
      return { data: updatedStudent, error: null };
      
    } catch (err) {
      console.error('=== STUDENT UPDATE OPERATION FAILED ===');
      console.error('Error in updateStudent:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error: { message: errorMessage } };
    }
  };

  const deleteStudent = async (id) => {
    try {
      await base44.entities.Student.delete(id);
      await fetchStudents();
      console.log('✅ Student deleted successfully!');
      return { error: null };
    } catch (err) {
      console.error('Error deleting student:', err);
      return { error: err };
    }
  };

  const uploadProfileImage = async (file, studentId) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Update student with new profile image URL
      await base44.entities.Student.update(studentId, {
        photo_url: file_url
      });

      return { url: file_url, error: null };
    } catch (err) {
      console.error('Error uploading profile image:', err);
      return { url: null, error: err };
    }
  };

  const getStudentGrades = async (studentId) => {
    try {
      const grades = await base44.entities.Grade.filter(
        { student_id: studentId },
        '-created_date',
        100
      );
      return grades || [];
    } catch (err) {
      console.error('Error fetching grades:', err);
      return [];
    }
  };

  const getGPA = async (studentId) => {
    try {
      const grades = await getStudentGrades(studentId);
      if (grades.length === 0) return 0;
      
      const totalPoints = grades.reduce((sum, grade) => 
        sum + (grade.score || 0) * (grade.weight || 1), 0
      );
      const totalWeight = grades.reduce((sum, grade) => 
        sum + (grade.weight || 1), 0
      );
      
      const avgScore = totalWeight > 0 ? totalPoints / totalWeight : 0;
      
      // Convert to 4.0 scale
      return (avgScore / 100) * 4.0;
    } catch (err) {
      console.error('Error calculating GPA:', err);
      return 0;
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    uploadProfileImage,
    getStudentGrades,
    getGPA,
    refetch: fetchStudents
  };
};