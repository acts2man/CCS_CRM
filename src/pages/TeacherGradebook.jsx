import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users } from "lucide-react";

export default function TeacherGradebook() {
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacherGradebook();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassGrades(selectedClass.id);
    }
  }, [selectedClass]);

  const loadTeacherGradebook = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const teachers = await base44.entities.Teacher.filter({ email: currentUser.email });
      if (teachers.length > 0) {
        const allClasses = await base44.entities.ClassSection.list();
        const teacherClasses = allClasses.filter(c => c.teacher_id === teachers[0].id);
        setClasses(teacherClasses);
        if (teacherClasses.length > 0) {
          setSelectedClass(teacherClasses[0]);
        }
      }
    } catch (error) {
      console.error("Error loading gradebook:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassGrades = async (classId) => {
    try {
      const classData = classes.find(c => c.id === classId);
      const allGrades = await base44.entities.AssignmentGrade.list();
      
      const classGrades = allGrades.filter(g => g.class_section_id === classId);
      const groupedByStudent = {};
      
      classGrades.forEach(grade => {
        if (!groupedByStudent[grade.student_id]) {
          groupedByStudent[grade.student_id] = {
            student_id: grade.student_id,
            student_name: grade.student_name,
            grades: []
          };
        }
        groupedByStudent[grade.student_id].grades.push(grade);
      });

      setGrades(Object.values(groupedByStudent));
    } catch (error) {
      console.error("Error loading class grades:", error);
    }
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (letter) => {
    const colors = { A: 'bg-green-100 text-green-800', B: 'bg-blue-100 text-blue-800', C: 'bg-yellow-100 text-yellow-800', D: 'bg-orange-100 text-orange-800', F: 'bg-red-100 text-red-800' };
    return colors[letter] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gradebook</h1>
        <p className="text-gray-600 mt-2">View and manage student grades</p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No classes to grade.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedClass?.id === cls.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>

          {selectedClass && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {selectedClass.name} - Grade Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {grades.length} Students
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {grades.map((studentGrades) => {
                  const avgPercentage = studentGrades.grades.length > 0
                    ? Math.round(studentGrades.grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / studentGrades.grades.length)
                    : 0;
                  const letterGrade = getLetterGrade(avgPercentage);

                  return (
                    <Card key={studentGrades.student_id}>
                      <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{studentGrades.student_name}</div>
                          <div className="text-sm text-gray-600">{studentGrades.grades.length} assignments</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Average</div>
                            <div className="text-2xl font-bold">{avgPercentage}%</div>
                          </div>
                          <Badge className={getGradeColor(letterGrade)}>
                            {letterGrade}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}