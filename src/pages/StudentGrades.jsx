import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { useImpersonation } from "@/lib/ImpersonationContext";

export default function StudentGrades() {
  const { impersonatedStudent } = useImpersonation();
  const [studentRecord, setStudentRecord] = useState(null);
  const [gradesBySubject, setGradesBySubject] = useState([]);
  const [overallGPA, setOverallGPA] = useState(null);
  const [allGrades, setAllGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrades();
  }, [impersonatedStudent]);

  const loadGrades = async () => {
    try {
      let student;
      
      if (impersonatedStudent) {
        student = impersonatedStudent;
      } else {
        const user = await base44.auth.me();
        const students = await base44.entities.Student.filter({ email: user.email });
        if (students.length === 0) return;
        student = students[0];
      }
      setStudentRecord(student);

      // SINGLE SOURCE OF TRUTH: Use AssignmentGrade ONLY (Grade entity is deprecated)
      const [classes, grades, assignments] = await Promise.all([
        base44.entities.ClassSection.list(),
        base44.entities.AssignmentGrade.filter({ student_id: student.id }),
        base44.entities.Assignment.list()
      ]);

      // Get enrolled classes
      const enrolledClasses = classes.filter(c => c.student_ids?.includes(student.id));

      // Calculate grades by subject
      const subjectGrades = {};
      enrolledClasses.forEach(cls => {
        subjectGrades[cls.id] = {
          className: cls.name,
          teacherName: cls.teacher_name,
          grades: []
        };
      });

      // Group grades by class
      grades.forEach(grade => {
        const assignment = assignments.find(a => a.id === grade.assignment_id);
        if (assignment && subjectGrades[assignment.class_section_id]) {
          subjectGrades[assignment.class_section_id].grades.push({
            ...grade,
            assignmentTitle: assignment.title
          });
        }
      });

      // Calculate averages and format
      const formattedSubjects = Object.entries(subjectGrades).map(([classId, data]) => {
        const percentages = data.grades
          .filter(g => g.percentage)
          .map(g => g.percentage);
        
        const average = percentages.length > 0
          ? (percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(1)
          : null;

        return {
          classId,
          className: data.className,
          teacherName: data.teacherName,
          average,
          grades: data.grades,
          letterGrade: getLetterGrade(average)
        };
      });

      setGradesBySubject(formattedSubjects);
      setAllGrades(grades);

      // Calculate overall GPA
      const allAverages = formattedSubjects
        .filter(s => s.average)
        .map(s => parseFloat(s.average));
      
      if (allAverages.length > 0) {
        const gpa = (allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(1);
        setOverallGPA(gpa);
      }
    } catch (error) {
      console.error("Error loading grades:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLetterGrade = (percentage) => {
    if (!percentage) return "—";
    const num = parseFloat(percentage);
    if (num >= 90) return "A";
    if (num >= 80) return "B";
    if (num >= 70) return "C";
    if (num >= 60) return "D";
    return "F";
  };

  const getGradeColor = (percentage) => {
    if (!percentage) return "text-gray-600";
    const num = parseFloat(percentage);
    if (num >= 90) return "text-green-600";
    if (num >= 80) return "text-blue-600";
    if (num >= 70) return "text-yellow-600";
    if (num >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeBgColor = (percentage) => {
    if (!percentage) return "bg-gray-100";
    const num = parseFloat(percentage);
    if (num >= 90) return "bg-green-100";
    if (num >= 80) return "bg-blue-100";
    if (num >= 70) return "bg-yellow-100";
    if (num >= 60) return "bg-orange-100";
    return "bg-red-100";
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Grades</h1>
        <p className="text-gray-600 mt-1">View your academic performance</p>
      </div>

      {/* Overall GPA */}
      {overallGPA && (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Overall GPA</p>
                <p className="text-4xl font-bold text-blue-900">{overallGPA}%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grades by Subject */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Grades by Class</h2>
        
        {gradesBySubject.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">No grades available yet.</p>
            </CardContent>
          </Card>
        ) : (
          gradesBySubject.map((subject) => (
            <Card key={subject.classId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{subject.className}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{subject.teacherName}</p>
                  </div>
                  {subject.average && (
                    <div className={`text-right ${getGradeColor(subject.average)}`}>
                      <p className="text-4xl font-bold">{subject.average}%</p>
                      <p className="text-sm font-semibold">{subject.letterGrade}</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {subject.grades.length === 0 ? (
                  <p className="text-sm text-gray-500">No grades recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {subject.grades.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{grade.assignmentTitle}</p>
                          <p className="text-xs text-gray-600">{grade.status}</p>
                        </div>
                        {grade.percentage && (
                          <div className={`px-3 py-1 rounded ${getGradeBgColor(grade.percentage)}`}>
                            <p className={`text-sm font-semibold ${getGradeColor(grade.percentage)}`}>
                              {grade.percentage}%
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}