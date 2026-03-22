import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Settings, BarChart3, Users, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubjectCategoryManager from './SubjectCategoryManager';
import SubjectAddAssignmentModal from './SubjectAddAssignmentModal';
import GradebookClassView from './GradebookClassView';
import GradebookStudentView from './GradebookStudentView';
import ReportCardPreview from './ReportCardPreview';

export default function SubjectView({ classSection, onRefresh }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeView, setActiveView] = useState('class');

  useEffect(() => { loadInit(); }, [classSection.id]);

  const loadInit = async () => {
    setLoading(true);
    const subs = await base44.entities.Subject.filter({ class_section_id: classSection.id });
    setSubjects(subs);

    // Load students
    let studs = [];
    if (classSection.student_ids?.length) {
      const all = await base44.entities.Student.filter({ enrollment_status: 'active' });
      studs = all.filter(s => classSection.student_ids.includes(s.id));
    } else {
      studs = await base44.entities.Student.filter({ enrollment_status: 'active', grade_level: classSection.grade_level });
    }
    setStudents(studs);

    if (subs.length > 0) {
      setSelectedSubject(subs[0]);
      await loadSubjectData(subs[0].id);
    }
    setLoading(false);
  };

  const loadSubjectData = async (subjectId) => {
    setSubjectLoading(true);
    const [cats, asns, grds] = await Promise.all([
      base44.entities.GradeCategory.filter({ class_section_id: classSection.id, subject_id: subjectId }),
      base44.entities.Assignment.filter({ class_section_id: classSection.id }),
      base44.entities.AssignmentGrade.filter({ class_section_id: classSection.id })
    ]);
    setCategories(cats);
    setAssignments(asns);
    setGrades(grds);
    const expanded = {};
    cats.forEach(c => { expanded[c.id] = true; });
    setExpandedCategories(expanded);
    setSubjectLoading(false);
  };

  const handleSubjectSelect = async (subj) => {
    setSelectedSubject(subj);
    setSelectedCategory(null);
    await loadSubjectData(subj.id);
  };

  const addSubject = async () => {
    if (!newSubjectName.trim()) return;
    const newSubj = await base44.entities.Subject.create({
      class_section_id: classSection.id,
      name: newSubjectName
    });
    setNewSubjectName('');
    setShowAddSubject(false);
    const subs = await base44.entities.Subject.filter({ class_section_id: classSection.id });
    setSubjects(subs);
    setSelectedSubject(newSubj);
    await loadSubjectData(newSubj.id);
  };

  const totalWeight = categories.reduce((sum, c) => sum + (c.weight || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border overflow-hidden">
      {/* Subject tabs row */}
      <div className="flex items-center gap-2 border-b bg-gray-50 px-4 py-3 overflow-x-auto flex-shrink-0">
        {subjects.length === 0 && (
          <span className="text-sm text-gray-400 flex items-center gap-2 mr-2">
            <BookOpen className="h-4 w-4" /> No subjects yet
          </span>
        )}
        {subjects.map(subj => (
          <button
            key={subj.id}
            onClick={() => handleSubjectSelect(subj)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors font-medium ${
              selectedSubject?.id === subj.id
                ? 'bg-slate-900 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-100'
            }`}
          >
            {subj.name}
          </button>
        ))}
        <Button size="sm" variant="outline" onClick={() => setShowAddSubject(true)} className="whitespace-nowrap ml-1">
          <Plus className="h-4 w-4 mr-1" /> Add Subject
        </Button>
      </div>

      {/* Subject content */}
      {selectedSubject ? (
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          {subjectLoading ? (
            <div className="flex items-center justify-center flex-1"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 flex-shrink-0">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-bold">{selectedSubject.name}</h2>
                  <p className="text-xs md:text-sm text-gray-500 truncate">{classSection.name} · {students.length} students</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setShowCategoryManager(true)}>
                    <Settings className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Components</span><span className="sm:hidden">Setup</span>
                  </Button>
                  <Button size="sm" className="bg-slate-900 hover:bg-slate-800" onClick={() => { setSelectedCategory(null); setShowAddAssignment(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Assignment</span><span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </div>

              {/* Weight warning */}
              {categories.length > 0 && totalWeight !== 100 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 mb-4 flex-shrink-0">
                  ⚠️ Components total {totalWeight}% — must equal 100% for accurate grades.
                </div>
              )}

              {categories.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="mb-3">No grade components set up for {selectedSubject.name} yet.</p>
                    <Button onClick={() => setShowCategoryManager(true)}>Set Up Components</Button>
                  </div>
                </div>
              ) : (
                <Tabs value={activeView} onValueChange={setActiveView} className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="mb-4 flex-shrink-0">
                    <TabsTrigger value="class" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Class View
                    </TabsTrigger>
                    <TabsTrigger value="student" className="flex items-center gap-2">
                      <Users className="h-4 w-4" /> Student View
                    </TabsTrigger>
                    <TabsTrigger value="report" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Report Card
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="class" className="flex-1 overflow-auto">
                    <GradebookClassView
                      categories={categories}
                      assignments={assignments}
                      students={students}
                      grades={grades}
                      expandedCategories={expandedCategories}
                      setExpandedCategories={setExpandedCategories}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      onAddAssignment={() => setShowAddAssignment(true)}
                      onGradeUpdated={() => loadSubjectData(selectedSubject.id)}
                      classSection={classSection}
                    />
                  </TabsContent>

                  <TabsContent value="student" className="flex-1 overflow-auto">
                    <GradebookStudentView
                      categories={categories}
                      assignments={assignments}
                      students={students}
                      grades={grades}
                    />
                  </TabsContent>

                  <TabsContent value="report" className="flex-1 overflow-auto">
                    <ReportCardPreview
                      classSection={classSection}
                      categories={categories}
                      assignments={assignments}
                      students={students}
                      grades={grades}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Add a subject to get started</p>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Subject name (e.g., Math, English, Science)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddSubject(false)}>Cancel</Button>
              <Button className="bg-slate-900 hover:bg-slate-800" onClick={addSubject}>Add Subject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showCategoryManager && selectedSubject && (
        <SubjectCategoryManager
          classSection={classSection}
          subject={selectedSubject}
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
          onSaved={() => loadSubjectData(selectedSubject.id)}
        />
      )}

      {showAddAssignment && selectedSubject && (
        <SubjectAddAssignmentModal
          classSection={classSection}
          subject={selectedSubject}
          categories={categories}
          preSelectedCategory={selectedCategory}
          onClose={() => setShowAddAssignment(false)}
          onCreated={() => loadSubjectData(selectedSubject.id)}
        />
      )}
    </div>
  );
}