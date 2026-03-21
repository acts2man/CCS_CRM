import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight } from 'lucide-react';

const gradeColor = (pct) => {
  if (pct === null) return 'text-gray-400';
  if (pct >= 90) return 'text-green-600';
  if (pct >= 80) return 'text-blue-600';
  if (pct >= 70) return 'text-yellow-600';
  if (pct >= 60) return 'text-orange-600';
  return 'text-red-600';
};

const getLetterGrade = (pct) => {
  if (pct === null || pct === undefined) return '—';
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
};

export default function GradebookStudentView({ categories, assignments, students, grades }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students.length > 0 ? students[0].id : '');
  const [expandedCategories, setExpandedCategories] = useState({});

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const calcCategoryAvg = (studentId, categoryId) => {
    const catAssignments = assignments.filter(a => a.grade_category_id === categoryId);
    const catGrades = catAssignments.map(a => {
      const g = grades.find(gr => gr.assignment_id === a.id && gr.student_id === studentId);
      return g?.status === 'graded' ? g.percentage : null;
    }).filter(x => x !== null);
    return catGrades.length ? catGrades.reduce((s, v) => s + v, 0) / catGrades.length : null;
  };

  const calcFinalGrade = (studentId) => {
    const gradedCategories = categories
      .map(cat => ({ cat, avg: calcCategoryAvg(studentId, cat.id) }))
      .filter(({ avg }) => avg !== null);
    if (gradedCategories.length === 0) return null;
    const totalWeight = gradedCategories.reduce((sum, { cat }) => sum + (cat.weight || 0), 0);
    if (totalWeight === 0) return null;
    const weighted = gradedCategories.reduce((sum, { cat, avg }) => sum + avg * (cat.weight / totalWeight), 0);
    return weighted;
  };

  const studentFinalGrade = selectedStudent ? calcFinalGrade(selectedStudent.id) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">View student:</span>
        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedStudent && (
        <div className="space-y-4">
          {/* Final Grade Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Overall Course Grade</p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${gradeColor(studentFinalGrade)}`}>
                    {studentFinalGrade !== null ? `${studentFinalGrade.toFixed(1)}%` : '—'}
                  </div>
                  <div className={`text-2xl font-semibold ${gradeColor(studentFinalGrade)}`}>
                    {getLetterGrade(studentFinalGrade)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <div className="space-y-3">
            {categories.map(cat => {
              const catAssignments = assignments.filter(a => a.grade_category_id === cat.id);
              const catAvg = calcCategoryAvg(selectedStudent.id, cat.id);
              const isExpanded = expandedCategories[cat.id];
              return (
                <Card key={cat.id}>
                  <CardContent className="p-0">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedCategories(e => ({ ...e, [cat.id]: !e[cat.id] }))}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {isExpanded ? <ChevronRight className="h-4 w-4 text-gray-400 rotate-90 transition-transform" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                        <span className="font-semibold">{cat.name}</span>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">{cat.weight}%</Badge>
                      </div>
                      <div className={`text-lg font-bold ${gradeColor(catAvg)}`}>
                        {catAvg !== null ? `${catAvg.toFixed(1)}%` : '—'}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t bg-gray-50 px-4 py-3 space-y-2">
                        {catAssignments.length === 0 ? (
                          <p className="text-sm text-gray-400">No assignments in this category yet.</p>
                        ) : (
                          catAssignments.map(assignment => {
                            const g = grades.find(gr => gr.assignment_id === assignment.id && gr.student_id === selectedStudent.id);
                            const pct = g?.status === 'graded' ? g.percentage : null;
                            return (
                              <div key={assignment.id} className="flex items-center justify-between text-sm p-2 bg-white rounded-lg border">
                                <span className="font-medium">{assignment.title}</span>
                                <div className={`font-semibold ${gradeColor(pct)}`}>
                                  {pct !== null ? `${g.points_earned}/${assignment.points_possible} (${pct.toFixed(0)}%)` : '—'}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}