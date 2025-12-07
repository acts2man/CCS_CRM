import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const useGrades = () => {
  const queryClient = useQueryClient();

  const { data: grades = [], isLoading: gradesLoading, error: gradesError } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const gradesList = await base44.entities.Grade.list('-created_date', 500);
      
      // Fetch related student data for each grade
      const gradesWithStudents = await Promise.all(
        gradesList.map(async (grade) => {
          if (grade.student_id) {
            try {
              const students = await base44.entities.Student.filter({ id: grade.student_id }, '', 1);
              const student = students[0];
              return {
                ...grade,
                students: student ? {
                  id: student.id,
                  first_name: student.first_name,
                  last_name: student.last_name,
                  grade: student.grade_level
                } : null
              };
            } catch (err) {
              console.error('Error fetching student for grade:', err);
              return grade;
            }
          }
          return grade;
        })
      );
      
      return gradesWithStudents;
    }
  });

  // Generate assignments from grades (simplified - in production you'd have a separate Assignment entity)
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', grades.length],
    queryFn: async () => {
      const uniqueAssignments = grades.reduce((acc, grade) => {
        const existing = acc.find(a => 
          a.subject === grade.subject && 
          a.assignment_name === grade.assignment_name
        );
        if (!existing && grade.assignment_name) {
          acc.push({
            id: `${grade.subject}-${grade.assignment_name}`,
            name: grade.assignment_name,
            subject: grade.subject,
            category: grade.assignment_category || 'other',
            max_score: grade.max_score || 100,
            weight: grade.weight || 1,
            due_date: grade.due_date,
            teacher_id: grade.teacher_id,
            grade_level: 'all'
          });
        }
        return acc;
      }, []);
      
      return uniqueAssignments;
    },
    enabled: grades.length > 0
  });

  const addGradeMutation = useMutation({
    mutationFn: async (grade) => {
      const result = await base44.entities.Grade.create(grade);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      console.log('✅ Grade added successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to add grade:', error);
    }
  });

  const updateGradeMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const result = await base44.entities.Grade.update(id, updates);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      console.log('✅ Grade updated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to update grade:', error);
    }
  });

  const deleteGradeMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Grade.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      console.log('✅ Grade deleted successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to delete grade:', error);
    }
  });

  const calculateGPA = (studentId) => {
    const studentGrades = grades.filter(g => g.student_id === studentId);
    if (studentGrades.length === 0) return 0;

    const totalPoints = studentGrades.reduce((sum, grade) => {
      return sum + (grade.score * (grade.weight || 1));
    }, 0);

    const totalWeight = studentGrades.reduce((sum, grade) => {
      return sum + (grade.weight || 1);
    }, 0);

    const avgScore = totalWeight > 0 ? totalPoints / totalWeight : 0;
    
    // Convert percentage to 4.0 scale
    return (avgScore / 100) * 4.0;
  };

  const getLetterGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return {
    grades,
    assignments,
    isLoading: gradesLoading || assignmentsLoading,
    error: gradesError,
    addGrade: (grade) => addGradeMutation.mutateAsync(grade),
    updateGrade: (grade) => updateGradeMutation.mutateAsync(grade),
    deleteGrade: (id) => deleteGradeMutation.mutateAsync(id),
    calculateGPA,
    getLetterGrade,
  };
};