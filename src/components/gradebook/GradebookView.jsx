import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import CategoryManager from './CategoryManager';
import AddAssignmentModal from './AddAssignmentModal';
import GradeEntryRow from './GradeEntryRow';

export default function GradebookView({ classSection, onRefresh }) {
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => { loadData(); }, [classSection.id]);

  const loadData = async () => {
    setLoading(true);
    const [cats, asns, grds] = await Promise.all([
      base44.entities.GradeCategory.filter({ class_section_id: classSection.id }),
      base44.entities.Assignment.filter({ class_section_id: classSection.id }),
      base44.entities.AssignmentGrade.filter({ class_section_id: classSection.id })
    ]);

    // Load enrolled students
    let studs = [];
    if (classSection.student_ids?.length) {
      const all = await base44.entities.Student.filter({ enrollment_status: 'active' });
      studs = all.filter(s => classSection.student_ids.includes(s.id));
    } else {
      studs = await base44.entities.Student.filter({ enrollment_status: 'active', grade_level: classSection.grade_level });
    }

    setCategories(cats);
    setAssignments(asns);
    setGrades(grds);
    setStudents(studs);

    // Default expand all categories
    const expanded = {};
    cats.forEach(c => { expanded[c.id] = true; });
    setExpandedCategories(expanded);
    setLoading(false);
  };

  const totalWeight = categories.reduce((sum, c) => sum + (c.weight || 0), 0);

  // Calculate final grade for a student
  const calcStudentGrade = (studentId) => {
    let finalGrade = 0;
    let hasAnyGrade = false;
    categories.forEach(cat => {
      const catAssignments = assignments.filter(a => a.grade_category_id === cat.id);
      if (!catAssignments.length) return;
      const catGrades = catAssignments.map(a => {
        const g = grades.find(gr => gr.assignment_id === a.id && gr.student_id === studentId);
        return g?.status === 'graded' ? (g.percentage || 0) : null;
      }).filter(x => x !== null);
      if (!catGrades.length) return;
      hasAnyGrade = true;
      const catAvg = catGrades.reduce((s,v) => s+v, 0) / catGrades.length;
      finalGrade += (catAvg * (cat.weight / 100));
    });
    return hasAnyGrade ? finalGrade : null;
  };

  const getLetterGrade = (pct) => {
    if (pct === null || pct === undefined) return '—';
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  const gradeColor = (pct) => {
    if (pct === null) return 'text-gray-400';
    if (pct >= 90) return 'text-green-600';
    if (pct >= 80) return 'text-blue-600';
    if (pct >= 70) return 'text-yellow-600';
    if (pct >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{classSection.name}</h2>
          <p className="text-sm text-gray-500">{classSection.teacher_name} · {classSection.school_year} · {students.length} students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCategoryManager(true)}>
            <Settings className="h-4 w-4 mr-1" /> Grade Categories
          </Button>
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800" onClick={() => { setSelectedCategory(null); setShowAddAssignment(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Assignment
          </Button>
        </div>
      </div>

      {/* Weight warning */}
      {categories.length > 0 && totalWeight !== 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          ⚠️ Grade categories total {totalWeight}% — must equal 100% for accurate final grades.
        </div>
      )}

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-3">No grade categories set up yet.</p>
          <Button onClick={() => setShowCategoryManager(true)}>Set Up Grade Categories</Button>
        </div>
      )}

      {/* Categories & Assignments */}
      {categories.map(cat => {
        const catAssignments = assignments.filter(a => a.grade_category_id === cat.id);
        const isExpanded = expandedCategories[cat.id];
        return (
          <Card key={cat.id}>
            <CardContent className="p-0">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedCategories(e => ({...e, [cat.id]: !e[cat.id]}))}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  <span className="font-semibold">{cat.name}</span>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">{cat.weight}% of grade</Badge>
                  <span className="text-xs text-gray-400">{catAssignments.length} assignment(s)</span>
                </div>
                <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setSelectedCategory(cat); setShowAddAssignment(true); }} className="text-xs h-7">
                  <Plus className="h-3 w-3 mr-1" /> Add
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
                                <div>{a.title}</div>
                                <div className="text-xs text-gray-400 font-normal">/{a.points_possible} pts</div>
                              </th>
                            ))}
                            <th className="text-center px-3 py-2 font-medium text-gray-600">Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(student => {
                            const catGrades = catAssignments.map(a => {
                              const g = grades.find(gr => gr.assignment_id === a.id && gr.student_id === student.id);
                              return g?.status === 'graded' ? g.percentage : null;
                            }).filter(x => x !== null);
                            const avg = catGrades.length ? catGrades.reduce((s,v)=>s+v,0)/catGrades.length : null;
                            return (
                              <tr key={student.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium">{student.first_name} {student.last_name}</td>
                                {catAssignments.map(assignment => (
                                  <GradeEntryRow
                                    key={assignment.id}
                                    assignment={assignment}
                                    student={student}
                                    existingGrade={grades.find(g => g.assignment_id === assignment.id && g.student_id === student.id)}
                                    onGradeUpdated={loadData}
                                    classSectionId={classSection.id}
                                  />
                                ))}
                                <td className={`text-center px-3 py-2 font-semibold ${gradeColor(avg)}`}>
                                  {avg !== null ? `${avg.toFixed(1)}%` : '—'}
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

      {/* Final Grade Summary */}
      {categories.length > 0 && students.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-3">Final Grade Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {students.map(student => {
                const fg = calcStudentGrade(student.id);
                return (
                  <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">{student.first_name} {student.last_name[0]}.</span>
                    <div className={`font-bold text-sm ${gradeColor(fg)}`}>
                      {fg !== null ? `${fg.toFixed(1)}% (${getLetterGrade(fg)})` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {showCategoryManager && <CategoryManager classSection={classSection} categories={categories} onClose={() => setShowCategoryManager(false)} onSaved={loadData} />}
      {showAddAssignment && <AddAssignmentModal classSection={classSection} categories={categories} preSelectedCategory={selectedCategory} onClose={() => setShowAddAssignment(false)} onCreated={loadData} />}
    </div>
  );
}