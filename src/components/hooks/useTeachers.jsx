import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const useTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const teachersData = await base44.entities.Teacher.list('-created_date', 500);
      
      // Fetch related data for each teacher
      const teachersWithRelations = await Promise.all(
        teachersData.map(async (teacher) => {
          // Fetch class assignments
          let classAssignments = [];
          try {
            classAssignments = await base44.entities.ClassPeriod.filter(
              { teacher_id: teacher.id },
              '',
              50
            );
          } catch (err) {
            console.error('Error fetching class assignments:', err);
          }

          // Fetch teacher activities
          let activities = [];
          try {
            activities = await base44.entities.TeacherActivity.filter(
              { teacher_id: teacher.id },
              '-timestamp',
              100
            );
          } catch (err) {
            console.error('Error fetching teacher activities:', err);
          }

          // Fetch admin notes
          let adminNotes = [];
          try {
            adminNotes = await base44.entities.AdminNote.filter(
              { teacher_id: teacher.id },
              '-created_date',
              50
            );
          } catch (err) {
            console.error('Error fetching admin notes:', err);
          }

          return {
            ...teacher,
            subjects: teacher.subjects || [],
            grade_levels: teacher.grade_levels || [],
            classAssignments,
            activities,
            adminNotes
          };
        })
      );

      setTeachers(teachersWithRelations);
      setError(null);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const addTeacher = async (teacherData, subjects, gradeLevels) => {
    try {
      console.log('Creating teacher with data:', teacherData);
      
      // Prepare teacher data with subjects and grade_levels arrays
      const teacherPayload = {
        ...teacherData,
        subjects: subjects || [],
        grade_levels: gradeLevels || []
      };

      const newTeacher = await base44.entities.Teacher.create(teacherPayload);
      
      if (!newTeacher) {
        throw new Error('No teacher data returned from insert');
      }

      console.log('Teacher created successfully:', newTeacher);

      await fetchTeachers();
      return { data: newTeacher, error: null };
    } catch (err) {
      console.error('Error in addTeacher:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error: { message: errorMessage } };
    }
  };

  const updateTeacher = async (id, teacherData, subjects, gradeLevels) => {
    try {
      console.log('=== TEACHER UPDATE OPERATION START ===');
      console.log('Updating teacher with ID:', id);

      // Prepare update payload
      const updatePayload = { ...teacherData };
      
      if (subjects !== undefined) {
        updatePayload.subjects = subjects;
      }
      
      if (gradeLevels !== undefined) {
        updatePayload.grade_levels = gradeLevels;
      }

      const updatedTeacher = await base44.entities.Teacher.update(id, updatePayload);
      
      if (!updatedTeacher) {
        throw new Error('No teacher data returned from update');
      }

      console.log('Teacher updated successfully:', updatedTeacher);

      await fetchTeachers();
      console.log('=== TEACHER UPDATE OPERATION SUCCESS ===');
      return { data: updatedTeacher, error: null };
    } catch (err) {
      console.error('=== TEACHER UPDATE OPERATION FAILED ===');
      console.error('Error in updateTeacher:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      return { data: null, error: { message: errorMessage } };
    }
  };

  const deleteTeacher = async (id) => {
    try {
      await base44.entities.Teacher.delete(id);
      await fetchTeachers();
      console.log('✅ Teacher deleted successfully!');
      return { error: null };
    } catch (err) {
      console.error('Error deleting teacher:', err);
      return { error: err };
    }
  };

  const addActivity = async (activity) => {
    try {
      await base44.entities.TeacherActivity.create(activity);
      await fetchTeachers();
      return { error: null };
    } catch (err) {
      console.error('Error adding teacher activity:', err);
      return { error: err };
    }
  };

  const addAdminNote = async (note) => {
    try {
      await base44.entities.AdminNote.create(note);
      await fetchTeachers();
      console.log('✅ Admin note added successfully!');
      return { error: null };
    } catch (err) {
      console.error('Error adding admin note:', err);
      return { error: err };
    }
  };

  const addClassAssignment = async (assignment) => {
    try {
      await base44.entities.ClassPeriod.create(assignment);
      await fetchTeachers();
      console.log('✅ Class assignment added successfully!');
      return { error: null };
    } catch (err) {
      console.error('Error adding class assignment:', err);
      return { error: err };
    }
  };

  const uploadAvatar = async (file, teacherId) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Update teacher with new avatar URL
      await base44.entities.Teacher.update(teacherId, {
        avatar: file_url
      });

      return { url: file_url, error: null };
    } catch (err) {
      console.error('Error uploading avatar:', err);
      return { url: null, error: err };
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  return {
    teachers,
    loading,
    error,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addActivity,
    addAdminNote,
    addClassAssignment,
    uploadAvatar,
    refetch: fetchTeachers
  };
};