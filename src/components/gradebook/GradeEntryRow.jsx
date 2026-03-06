import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function GradeEntryRow({ assignment, student, existingGrade, onGradeUpdated, classSectionId }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(existingGrade?.points_earned ?? '');
  const [saving, setSaving] = useState(false);

  const pct = existingGrade?.status === 'graded' ? existingGrade.percentage : null;

  const save = async () => {
    if (value === '' || value === null) { setEditing(false); return; }
    setSaving(true);
    const points = parseFloat(value);
    const percentage = Math.min(100, (points / assignment.points_possible) * 100);
    const letter = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
    const data = { points_earned: points, percentage, letter_grade: letter, status: 'graded', graded_date: new Date().toISOString().split('T')[0], student_name: `${student.first_name} ${student.last_name}` };
    if (existingGrade?.id) await base44.entities.AssignmentGrade.update(existingGrade.id, data);
    else await base44.entities.AssignmentGrade.create({ assignment_id: assignment.id, class_section_id: classSectionId, student_id: student.id, ...data });
    setSaving(false);
    setEditing(false);
    onGradeUpdated();
  };

  const getColor = (p) => {
    if (p === null) return 'text-gray-400';
    if (p >= 90) return 'text-green-600';
    if (p >= 80) return 'text-blue-600';
    if (p >= 70) return 'text-yellow-600';
    if (p >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (editing) {
    return (
      <td className="px-2 py-1 text-center">
        <input
          autoFocus
          type="number"
          className="w-16 text-center border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          max={assignment.points_possible}
          min={0}
        />
      </td>
    );
  }

  return (
    <td className="px-2 py-1 text-center cursor-pointer hover:bg-blue-50 transition-colors rounded" onClick={() => { setValue(existingGrade?.points_earned ?? ''); setEditing(true); }}>
      {saving ? (
        <span className="text-gray-400 text-xs">...</span>
      ) : pct !== null ? (
        <div>
          <div className={`font-semibold text-xs ${getColor(pct)}`}>{existingGrade.points_earned}/{assignment.points_possible}</div>
          <div className={`text-xs ${getColor(pct)}`}>{pct.toFixed(0)}%</div>
        </div>
      ) : (
        <span className="text-gray-300 text-xs">—</span>
      )}
    </td>
  );
}