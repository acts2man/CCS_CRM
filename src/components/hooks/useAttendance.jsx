import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useAttendance = () => {
  const queryClient = useQueryClient();

  const { data: attendanceRecords = [], isLoading, error: attendanceError } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const records = await base44.entities.Attendance.list('-date', 500);
      
      // Fetch related student data for each record
      const recordsWithStudents = await Promise.all(
        records.map(async (record) => {
          if (record.student_id) {
            try {
              const students = await base44.entities.Student.filter({ id: record.student_id }, '', 1);
              const student = students[0];
              return {
                ...record,
                students: student ? {
                  id: student.id,
                  first_name: student.first_name,
                  last_name: student.last_name,
                  grade: student.grade_level
                } : null
              };
            } catch (err) {
              console.error('Error fetching student for attendance record:', err);
              return record;
            }
          }
          return record;
        })
      );
      
      return recordsWithStudents;
    }
  });

  const addAttendanceMutation = useMutation({
    mutationFn: async (record) => {
      const result = await base44.entities.Attendance.create(record);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      console.log('✅ Attendance recorded successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to record attendance:', error);
    }
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const result = await base44.entities.Attendance.update(id, updates);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      console.log('✅ Attendance updated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to update attendance:', error);
    }
  });

  const getAttendanceStats = (date) => {
    const dayRecords = attendanceRecords.filter(record => record.date === date);
    const totalStudents = dayRecords.length;
    const presentCount = dayRecords.filter(record => record.status === 'present').length;
    const absentCount = dayRecords.filter(record => record.status === 'absent').length;
    const tardyCount = dayRecords.filter(record => record.status === 'tardy').length;
    const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

    return {
      totalStudents,
      presentCount,
      absentCount,
      tardyCount,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    };
  };

  const addAttendance = (record) => {
    return addAttendanceMutation.mutateAsync(record);
  };

  const updateAttendance = (id, updates) => {
    return updateAttendanceMutation.mutateAsync({ id, updates });
  };

  return {
    attendanceRecords,
    isLoading,
    attendanceError,
    addAttendance,
    updateAttendance,
    getAttendanceStats,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['attendance'] })
  };
};