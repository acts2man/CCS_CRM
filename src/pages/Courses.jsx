import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, BookOpen, Pencil, Trash2, Search } from 'lucide-react';
import ClassSetupModal from '@/components/gradebook/ClassSetupModal';
import GradebookView from '@/components/gradebook/GradebookView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SUBJECTS = ['english','math','science','history','bible','art','pe','technology','music','other'];

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
  const [form, setForm] = useState({ name: '', code: '', description: '', subject_area: 'english' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [schoolYear]);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const [c, cls] = await Promise.all([
      base44.entities.Course.list(),
      base44.entities.ClassSection.filter({ school_year: schoolYear })
    ]);
    setCourses(c);
    setClasses(cls);
    if (cls.length > 0 && !selectedClass) setSelectedClass(cls[0]);
    setLoading(false);
  };

  const openAddCourse = () => { setEditCourse(null); setForm({ name: '', code: '', description: '', subject_area: 'english' }); setShowCourseModal(true); };
  const openEditCourse = (c) => { setEditCourse(c); setForm({ name: c.name, code: c.code||'', description: c.description||'', subject_area: c.subject_area||'english' }); setShowCourseModal(true); };

  const saveCourse = async () => {
    setSaving(true);
    if (editCourse) await base44.entities.Course.update(editCourse.id, form);
    else await base44.entities.Course.create(form);
    setSaving(false);
    setShowCourseModal(false);
    loadData();
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    await base44.entities.Course.delete(id);
    loadData();
  };

  const filtered = courses.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.code||'').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Classes</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage classes, categories, and assignments</p>
          </div>
          <div className="flex gap-2">
            {!isTeacher && <Button variant="outline" size="sm" onClick={openAddCourse}><Plus className="h-4 w-4 mr-1" /> Add Course</Button>}
            <Select value={schoolYear} onValueChange={setSchoolYear}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-2025">2024–2025</SelectItem>
                <SelectItem value="2025-2026">2025–2026</SelectItem>
                <SelectItem value="2026-2027">2026–2027</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => setShowClassSetup(true)}><Plus className="h-4 w-4 mr-2" /> New Class</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="classes" className="w-full">
        <TabsList className="ml-6 mt-4 bg-transparent border-b rounded-none h-auto p-0">
          <TabsTrigger value="classes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">Classes ({classes.length})</TabsTrigger>
          {!isTeacher && <TabsTrigger value="courses" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">Course Catalog ({courses.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="classes" className="p-6">
          <div className="flex h-[calc(100vh-220px)]">
            <div className="w-64 border-r bg-white rounded-lg mr-6 overflow-y-auto">
              <div className="p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Classes</p>
                {classes.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No classes yet
                  </div>
                )}
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${selectedClass?.id === cls.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                  >
                    <div className="font-medium">{cls.name}</div>
                    <div className="text-xs text-gray-500">{cls.teacher_name || 'No teacher'}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              {selectedClass ? (
                <GradebookView classSection={selectedClass} onRefresh={loadData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Select a class to manage structure</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {!isTeacher && (
          <TabsContent value="courses" className="p-6">
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
                        <div className="font-bold">{course.name}</div>
                        {course.code && <div className="text-xs text-gray-400">{course.code}</div>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCourse(course)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => deleteCourse(course.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    {course.description && <p className="text-sm text-gray-500 mb-2">{course.description}</p>}
                    {course.subject_area && <Badge className="bg-blue-100 text-blue-800 text-xs capitalize">{course.subject_area}</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showCourseModal} onOpenChange={setShowCourseModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editCourse ? 'Edit Course' : 'Add Course'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Course Name *</Label>
                <Input value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} />
              </div>
              <div>
                <Label>Course Code</Label>
                <Input value={form.code} onChange={e => setForm(f=>({...f, code: e.target.value}))} />
              </div>
            </div>
            <div>
              <Label>Subject Area</Label>
              <Select value={form.subject_area} onValueChange={v => setForm(f=>({...f, subject_area: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCourseModal(false)}>Cancel</Button>
              <Button className="bg-slate-900 hover:bg-slate-800" onClick={saveCourse} disabled={!form.name || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showClassSetup && <ClassSetupModal onClose={() => setShowClassSetup(false)} onCreated={loadData} />}
    </div>
  );
}