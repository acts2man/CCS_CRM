import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Settings, BarChart3, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoryManager from './CategoryManager';
import AddAssignmentModal from './AddAssignmentModal';
import GradebookClassView from './GradebookClassView';
import GradebookStudentView from './GradebookStudentView';
import ReportCardPreview from './ReportCardPreview';

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
  const [activeView, setActiveView] = useState('class');

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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{classSection.name}</h2>
          <p className="text-sm text-gray-500">{classSection.teacher_name} · {classSection.school_year} · {students.length} students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCategoryManager(true)}>
            <Settings className="h-4 w-4 mr-1" /> Categories
          </Button>
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800" onClick={() => { setSelectedCategory(null); setShowAddAssignment(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Assignment
          </Button>
        </div>
      </div>

      {/* Weight warning */}
      {categories.length > 0 && totalWeight !== 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 mb-4">
          ⚠️ Categories total {totalWeight}% — must equal 100% for accurate grades.
        </div>
      )}

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-400 flex-1 flex items-center justify-center">
          <div>
            <p className="mb-3">No grade categories set up yet.</p>
            <Button onClick={() => setShowCategoryManager(true)}>Set Up Categories</Button>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <Tabs value={activeView} onValueChange={setActiveView} className="flex-1 flex flex-col">
          <TabsList className="mb-4">
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
              onGradeUpdated={loadData}
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

      {showCategoryManager && <CategoryManager classSection={classSection} categories={categories} onClose={() => setShowCategoryManager(false)} onSaved={loadData} />}
      {showAddAssignment && <AddAssignmentModal classSection={classSection} categories={categories} preSelectedCategory={selectedCategory} onClose={() => setShowAddAssignment(false)} onCreated={loadData} />}
    </div>
  );
}