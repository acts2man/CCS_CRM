import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function TeacherGradebookView({ classSection, schoolYear }) {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [components, setComponents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [classSection.id]);

  const loadData = async () => {
    setLoading(true);
    const [subs, studs] = await Promise.all([
      base44.entities.Subject.filter({ class_section_id: classSection.id }),
      classSection.student_ids?.length ? 
        base44.entities.Student.filter({ id: { $in: classSection.student_ids } }) :
        []
    ]);
    setSubjects(subs);
    setStudents(studs);
    if (subs.length > 0 && !selectedSubject) {
      setSelectedSubject(subs[0]);
      loadSubjectData(subs[0].id);
    }
    setLoading(false);
  };

  const loadSubjectData = async (subjectId) => {
    const [comps, asns, grds] = await Promise.all([
      base44.entities.GradeCategory.filter({ subject_id: subjectId }),
      base44.entities.Assignment.filter({ class_section_id: classSection.id }),
      base44.entities.AssignmentGrade.filter({ class_section_id: classSection.id })
    ]);
    setComponents(comps);
    setAssignments(asns.filter(a => a.grade_category_id && comps.some(c => c.id === a.grade_category_id)));
    setGrades(grds);
  };

  const handleSubjectSelect = (subj) => {
    setSelectedSubject(subj);
    loadSubjectData(subj.id);
  };

  const updateGrade = async (gradeId, newPercentage, newPoints) => {
    await base44.entities.AssignmentGrade.update(gradeId, {
      percentage: newPercentage,
      points_earned: newPoints,
      status: 'graded'
    });
    toast({ title: 'Grade updated' });
    loadSubjectData(selectedSubject.id);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  const subjectComponents = components.filter(c => c.subject_id === selectedSubject?.id);
  const subjectAssignments = assignments.filter(a => subjectComponents.some(c => c.id === a.grade_category_id));

  return (
    <div className="h-full flex flex-col">
      {/* Subject tabs */}
      <div className="flex items-center gap-2 border-b bg-white p-4 overflow-x-auto">
        {subjects.map(subj => (
          <button
            key={subj.id}
            onClick={() => handleSubjectSelect(subj)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedSubject?.id === subj.id
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {subj.name}
          </button>
        ))}
      </div>

      {/* Subject content */}
      {selectedSubject ? (
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold">{selectedSubject.name}</h2>
            <p className="text-sm text-gray-500">{classSection.name}</p>
          </div>

          {/* Components and assignments grid */}
          <div className="space-y-6">
            {subjectComponents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No components set up for this subject</p>
              </div>
            ) : (
              subjectComponents.map(comp => {
                const compAssignments = subjectAssignments.filter(a => a.grade_category_id === comp.id);
                return (
                  <div key={comp.id} className="border rounded-lg p-4">
                    <h3 className="font-bold mb-3">{comp.name} ({comp.weight}%)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Student</th>
                            {compAssignments.map(a => (
                              <th key={a.id} className="text-center py-2 px-2 whitespace-nowrap">{a.title}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(student => (
                            <tr key={student.id} className="border-b hover:bg-gray-50">
                              <td className="text-left py-2 px-2">{student.first_name} {student.last_name}</td>
                              {compAssignments.map(asn => {
                                const grade = grades.find(g => g.assignment_id === asn.id && g.student_id === student.id);
                                return (
                                  <td key={asn.id} className="text-center py-2 px-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="—"
                                      value={grade?.percentage || ''}
                                      onChange={(e) => {
                                        const pct = e.target.value ? parseFloat(e.target.value) : 0;
                                        const points = pct ? Math.round((pct / 100) * asn.points_possible) : 0;
                                        if (grade) {
                                          updateGrade(grade.id, pct, points);
                                        }
                                      }}
                                      className="w-16 p-1 border rounded text-center"
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p>Select a subject to view components and assignments</p>
        </div>
      )}
    </div>
  );
}