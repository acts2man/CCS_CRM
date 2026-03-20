import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, BookOpen, Pencil, Trash2, Search, Settings } from 'lucide-react';
import ClassSetupModal from '@/components/gradebook/ClassSetupModal';
import GradebookView from '@/components/gradebook/GradebookView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SUBJECTS = ['english','math','science','history','bible','art','pe','technology','music','other'];
const GRADES = ['K','1','2','3','4','5','6','7','8','9','10','11','12'];

export default function Courses() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showClassSetup, setShowClassSetup] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [form, setForm] = useState({ name: '', code: '', description: '', subject_area: 'english', grade_levels: [], credits: 1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [schoolYear]);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const [c, cls] = await Promise.all([base44.entities.Course.list(), base44.entities.ClassSection.filter({ school_year: schoolYear })]);
    setCourses(c);
    setClasses(cls);
    if (cls.length > 0 && !selectedClass) setSelectedClass(cls[0]);
    setLoading(false);
  };

  const openAdd = () => { setEditCourse(null); setForm({ name: '', code: '', description: '', subject_area: 'english', grade_levels: [], credits: 1 }); setShowModal(true); };
  const openEdit = (c) => { setEditCourse(c); setForm({ name: c.name, code: c.code||'', description: c.description||'', subject_area: c.subject_area||'english', grade_levels: c.grade_levels||[], credits: c.credits||1 }); setShowModal(true); };

  const save = async () => {
    setSaving(true);
    if (editCourse) await base44.entities.Course.update(editCourse.id, form);
    else await base44.entities.Course.create(form);
    setSaving(false);
    setShowModal(false);
    loadData();
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    await base44.entities.Course.delete(id);
    loadData();
  };

  const toggleGrade = (g) => {
    setForm(f => ({...f, grade_levels: f.grade_levels.includes(g) ? f.grade_levels.filter(x=>x!==g) : [...f.grade_levels, g]}));
  };

  const filtered = courses.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.code||'').toLowerCase().includes(search.toLowerCase()));

  const sectionCountFor = (courseId) => sections.filter(s => s.course_id === courseId).length;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  const isTeacher = user?.role === 'teacher';
  if (isTeacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">Admin only</p>
          <p className="text-sm text-gray-400 mt-1">Teachers manage classes in the Gradebook module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Course Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Reference only — Classes are now the primary structure</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800" onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Course</Button>
      </div>

      <div className="px-6 py-6">
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search courses..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-lg">{course.name}</div>
                    {course.code && <div className="text-xs text-gray-400 font-mono">{course.code}</div>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(course)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => deleteCourse(course.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                {course.description && <p className="text-sm text-gray-500 mb-3">{course.description}</p>}
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge className="bg-blue-100 text-blue-800 capitalize">{course.subject_area}</Badge>
                  {(course.grade_levels||[]).map(g => <Badge key={g} variant="outline" className="text-xs">Gr {g}</Badge>)}
                </div>
                <div className="text-xs text-gray-500">{sectionCountFor(course.id)} active section(s) · {course.credits} credit(s)</div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No courses found. Add your first course.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editCourse ? 'Edit Course' : 'Add Course'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Course Name *</Label>
                <Input value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} placeholder="e.g. English" />
              </div>
              <div>
                <Label>Course Code</Label>
                <Input value={form.code} onChange={e => setForm(f=>({...f, code: e.target.value}))} placeholder="e.g. ENG11" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(f=>({...f, description: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subject Area</Label>
                <Select value={form.subject_area} onValueChange={v => setForm(f=>({...f, subject_area: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Credits</Label>
                <Input type="number" value={form.credits} onChange={e => setForm(f=>({...f, credits: parseFloat(e.target.value)||1}))} />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Grade Levels</Label>
              <div className="flex flex-wrap gap-2">
                {GRADES.map(g => (
                  <button key={g} onClick={() => toggleGrade(g)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.grade_levels.includes(g) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}>
                    {g === 'K' ? 'K' : `Gr ${g}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="bg-slate-900 hover:bg-slate-800" onClick={save} disabled={!form.name || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editCourse ? 'Save Changes' : 'Create Course'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}