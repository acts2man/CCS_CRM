import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getParentStudents } from "@/lib/parentUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

export default function ParentGrades() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      const user = await base44.auth.me();
      
      // Use utility to get students associated with this parent by email
      const myChildren = await getParentStudents(user.email);
      
      setChildren(myChildren);
      if (myChildren.length > 0) {
        setSelectedChild(myChildren[0]);
        loadChildGrades(myChildren[0].id);
      }
    } catch (error) {
      console.error("Error loading parent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildGrades = async (studentId) => {
    try {
      // SINGLE SOURCE OF TRUTH: Use AssignmentGrade ONLY (Grade entity is deprecated)
      const [reportCards, assignments, assignmentGrades] = await Promise.all([
        base44.entities.ReportCard.filter({ student_id: studentId }),
        base44.entities.Assignment.list(),
        base44.entities.AssignmentGrade.filter({ student_id: studentId })
      ]);

      // Group by class/subject
      const gradesByClass = {};
      assignmentGrades.forEach(grade => {
        if (!gradesByClass[grade.class_section_id]) {
          gradesByClass[grade.class_section_id] = [];
        }
        gradesByClass[grade.class_section_id].push(grade);
      });

      setGrades(Object.entries(gradesByClass).map(([classId, classGrades]) => ({
        classId,
        grades: classGrades,
        average: classGrades.length > 0 
          ? (classGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / classGrades.length).toFixed(1)
          : 0
      })));
    } catch (error) {
      console.error("Error loading grades:", error);
    }
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Children's Grades</h1>
        <p className="text-gray-600 mt-1">View academic performance by subject</p>
      </div>

      {/* Child Selector */}
      {children.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => {
                setSelectedChild(child);
                loadChildGrades(child.id);
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedChild?.id === child.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {child.first_name} {child.last_name}
            </button>
          ))}
        </div>
      )}

      {/* Grades by Class */}
      <div className="space-y-4">
        {grades.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No grades available yet.</p>
            </CardContent>
          </Card>
        ) : (
          grades.map((classGrade) => (
            <Card key={classGrade.classId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Class {classGrade.classId}</CardTitle>
                  <Badge className={`text-lg px-3 py-1 ${getGradeColor(classGrade.average)}`}>
                    {getLetterGrade(classGrade.average)} ({classGrade.average}%)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {classGrade.grades.map((grade) => (
                    <div key={grade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{grade.letter_grade || 'N/A'}</span>
                      <span className="text-sm text-gray-600">{grade.percentage || 0}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}