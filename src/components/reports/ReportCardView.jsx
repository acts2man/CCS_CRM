import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const gradeColor = (letter) => {
  const colors = {
    'A': 'text-green-700 bg-green-50',
    'B': 'text-blue-700 bg-blue-50',
    'C': 'text-yellow-700 bg-yellow-50',
    'D': 'text-orange-700 bg-orange-50',
    'F': 'text-red-700 bg-red-50'
  };
  return colors[letter] || 'text-gray-700 bg-gray-50';
};

export default function ReportCardView({ reportCard }) {
  if (!reportCard) return null;

  return (
    <div className="bg-white border rounded-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 pb-6 border-b">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{reportCard.student_name}</h2>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <div>Student ID: {reportCard.student_id}</div>
              <div>Grade Level: {reportCard.student_grade_level}</div>
              <div>School Year: {reportCard.school_year}</div>
              <div>Period: {reportCard.reporting_period}</div>
              {reportCard.period_start_date && reportCard.period_end_date && (
                <div>{reportCard.period_start_date} to {reportCard.period_end_date}</div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold mb-1 ${gradeColor(reportCard.overall_letter_grade)}`}>
              {reportCard.overall_letter_grade}
            </div>
            <div className="text-2xl font-semibold text-gray-700">
              {reportCard.overall_number_grade?.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Classes */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-3">Class Grades</h3>
        <div className="space-y-2">
          {reportCard.classes && reportCard.classes.map((cls, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div>
                <div className="font-medium text-gray-900">{cls.class_name}</div>
                <div className="text-xs text-gray-500">{cls.teacher_name}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{cls.number_grade?.toFixed(1)}%</div>
                <div className={`text-lg font-semibold ${gradeColor(cls.letter_grade)}`}>
                  {cls.letter_grade}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Summary */}
      {reportCard.attendance && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-3">Attendance Summary</h3>
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
              <div className="text-2xl font-bold text-green-700">{reportCard.attendance.present}</div>
              <div className="text-xs text-gray-600 mt-1">Present</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
              <div className="text-2xl font-bold text-red-700">{reportCard.attendance.absent}</div>
              <div className="text-xs text-gray-600 mt-1">Absent</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-100">
              <div className="text-2xl font-bold text-yellow-700">{reportCard.attendance.tardy}</div>
              <div className="text-xs text-gray-600 mt-1">Tardy</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
              <div className="text-2xl font-bold text-blue-700">{reportCard.attendance.excused}</div>
              <div className="text-xs text-gray-600 mt-1">Excused</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-100">
              <div className="text-2xl font-bold text-purple-700">{reportCard.attendance.attendance_rate?.toFixed(1)}%</div>
              <div className="text-xs text-gray-600 mt-1">Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Scale */}
      {reportCard.grade_scale && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-3">Grade Scale</h3>
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center p-2 bg-green-50 rounded border">
              <div className="font-bold text-green-700">A</div>
              <div className="text-xs text-gray-600">90-100%</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded border">
              <div className="font-bold text-blue-700">B</div>
              <div className="text-xs text-gray-600">80-89%</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded border">
              <div className="font-bold text-yellow-700">C</div>
              <div className="text-xs text-gray-600">70-79%</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded border">
              <div className="font-bold text-orange-700">D</div>
              <div className="text-xs text-gray-600">60-69%</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded border">
              <div className="font-bold text-red-700">F</div>
              <div className="text-xs text-gray-600">&lt;60%</div>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      {reportCard.comments && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-2">Comments</h3>
          <div className="p-4 bg-gray-50 rounded-lg border text-gray-700 whitespace-pre-wrap">
            {reportCard.comments}
          </div>
        </div>
      )}

      {/* Footer */}
      {reportCard.generated_date && (
        <div className="text-xs text-gray-500 pt-4 border-t">
          Generated on {new Date(reportCard.generated_date).toLocaleDateString()}
          {reportCard.generated_by && ` by ${reportCard.generated_by}`}
          {reportCard.is_final && <Badge className="ml-2 bg-green-100 text-green-800">Final</Badge>}
        </div>
      )}
    </div>
  );
}