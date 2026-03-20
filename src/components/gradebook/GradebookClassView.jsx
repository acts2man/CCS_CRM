import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import GradeEntryRow from './GradeEntryRow';

const gradeColor = (pct) => {
  if (pct === null) return 'text-gray-400';
  if (pct >= 90) return 'text-green-600';
  if (pct >= 80) return 'text-blue-600';
  if (pct >= 70) return 'text-yellow-600';
  if (pct >= 60) return 'text-orange-600';
  return 'text-red-600';
};

export default function GradebookClassView({ categories, assignments, students, grades, expandedCategories, setExpandedCategories, selectedCategory, setSelectedCategory, onAddAssignment, onGradeUpdated, classSection }) {
  const calcCategoryAvg = (studentId, categoryId) => {
    const catAssignments = assignments.filter(a => a.grade_category_id === categoryId);
    const catGrades = catAssignments.map(a => {
      const g = grades.find(gr => gr.assignment_id === a.id && gr.student_id === studentId);
      return g?.status === 'graded' ? g.percentage : null;
    }).filter(x => x !== null);
    return catGrades.length ? catGrades.reduce((s, v) => s + v, 0) / catGrades.length : null;
  };

  return (
    <div className="space-y-3">
      {categories.map(cat => {
        const catAssignments = assignments.filter(a => a.grade_category_id === cat.id);
        const isExpanded = expandedCategories[cat.id];
        return (
          <Card key={cat.id}>
            <CardContent className="p-0">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedCategories(e => ({ ...e, [cat.id]: !e[cat.id] }))}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  <span className="font-semibold">{cat.name}</span>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">{cat.weight}% of grade</Badge>
                  <span className="text-xs text-gray-400">{catAssignments.length} assignment(s)</span>
                </div>
                <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setSelectedCategory(cat); onAddAssignment(); }} className="text-xs h-7">
                  + Add Assignment
                </Button>
              </button>

              {isExpanded && (
                <div className="border-t">
                  {catAssignments.length === 0 ? (
                    <div className="py-4 text-center text-sm text-gray-400">No assignments yet in this category.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left px-4 py-2 font-medium text-gray-600 w-48">Student</th>
                            {catAssignments.map(a => (
                              <th key={a.id} className="text-center px-2 py-2 font-medium text-gray-600 min-w-[100px]">
                                <div className="text-xs font-normal">{a.title}</div>
                                <div className="text-xs text-gray-400">/{a.points_possible} pts</div>
                              </th>
                            ))}
                            <th className="text-center px-3 py-2 font-medium text-gray-600 bg-blue-50">Category Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(student => {
                            const categoryAvg = calcCategoryAvg(student.id, cat.id);
                            return (
                              <tr key={student.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium text-sm">{student.first_name} {student.last_name}</td>
                                {catAssignments.map(assignment => (
                                  <GradeEntryRow
                                    key={assignment.id}
                                    assignment={assignment}
                                    student={student}
                                    existingGrade={grades.find(g => g.assignment_id === assignment.id && g.student_id === student.id)}
                                    onGradeUpdated={onGradeUpdated}
                                    classSectionId={classSection.id}
                                  />
                                ))}
                                <td className={`text-center px-3 py-2 font-semibold text-sm ${gradeColor(categoryAvg)} bg-blue-50`}>
                                  {categoryAvg !== null ? `${categoryAvg.toFixed(1)}%` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}