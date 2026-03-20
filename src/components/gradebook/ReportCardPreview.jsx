import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const gradeColor = (pct) => {
  if (pct === null) return 'text-gray-400';
  if (pct >= 90) return 'text-green-600 bg-green-50';
  if (pct >= 80) return 'text-blue-600 bg-blue-50';
  if (pct >= 70) return 'text-yellow-600 bg-yellow-50';
  if (pct >= 60) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

const getLetterGrade = (pct) => {
  if (pct === null || pct === undefined) return '—';
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
};

export default function ReportCardPreview({ classSection, categories, assignments, students, grades }) {
  const calcFinalGrade = (studentId) => {
    let finalGrade = 0;
    let hasAnyGrade = false;
    categories.forEach(cat => {
      const catAssignments = assignments.filter(a => a.grade_category_id === cat.id);
      const catGrades = catAssignments.map(a => {
        const g = grades.find(gr => gr.assignment_id === a.id && gr.student_id === studentId);
        return g?.status === 'graded' ? g.percentage : null;
      }).filter(x => x !== null);
      if (catGrades.length > 0) {
        hasAnyGrade = true;
        const catAvg = catGrades.reduce((s, v) => s + v, 0) / catGrades.length;
        finalGrade += (catAvg * (cat.weight / 100));
      }
    });
    return hasAnyGrade ? finalGrade : null;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Report Card Preview</h2>
            <p className="text-sm text-gray-500 mt-1">{classSection.name} • {classSection.school_year}</p>
          </div>
          <p className="text-xs text-gray-400">Automated Calculation</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left px-4 py-3 font-semibold text-gray-900 w-48">Student</th>
                {categories.map(cat => (
                  <th key={cat.id} className="text-center px-3 py-3 font-semibold text-gray-600 text-sm">
                    <div>{cat.name}</div>
                    <div className="text-xs font-normal text-gray-500">{cat.weight}%</div>
                  </th>
                ))}
                <th className="text-center px-4 py-3 font-semibold text-gray-900 bg-blue-50">Final Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const finalGrade = calcFinalGrade(student.id);
                return (
                  <tr key={student.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 text-sm">{student.first_name} {student.last_name}</td>
                    {categories.map(cat => {
                      const catAssignments = assignments.filter(a => a.grade_category_id === cat.id);
                      const catGrades = catAssignments.map(a => {
                        const g = grades.find(gr => gr.assignment_id === a.id && gr.student_id === student.id);
                        return g?.status === 'graded' ? g.percentage : null;
                      }).filter(x => x !== null);
                      const catAvg = catGrades.length ? catGrades.reduce((s, v) => s + v, 0) / catGrades.length : null;
                      return (
                        <td key={cat.id} className={`text-center px-3 py-3 font-semibold text-sm rounded ${catAvg !== null ? gradeColor(catAvg) : 'text-gray-300'}`}>
                          {catAvg !== null ? `${catAvg.toFixed(0)}%` : '—'}
                        </td>
                      );
                    })}
                    <td className={`text-center px-4 py-3 font-bold text-lg rounded ${finalGrade !== null ? gradeColor(finalGrade) : 'text-gray-300 bg-gray-50'} bg-blue-50`}>
                      {finalGrade !== null ? (
                        <div>
                          <div>{finalGrade.toFixed(1)}%</div>
                          <div className="text-xs font-semibold mt-1">{getLetterGrade(finalGrade)}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}