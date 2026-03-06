import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, BookOpen, ChevronRight, Settings } from 'lucide-react';
import GradebookView from '@/components/gradebook/GradebookView';
import ClassSetupModal from '@/components/gradebook/ClassSetupModal';

export default function Gradebook() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [schoolYear, setSchoolYear] = useState('2025-2026');

  useEffect(() => { loadData(); }, [schoolYear]);

  const loadData = async () => {
    setLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const teachers = await base44.entities.Teacher.filter({ email: currentUser.email }, '', 1);
    const isTeacher = teachers?.length > 0;

    let classSections;
    if (isTeacher && teachers[0]) {
      classSections = await base44.entities.ClassSection.filter({ teacher_id: teachers[0].id, school_year: schoolYear });
    } else {
      classSections = await base44.entities.ClassSection.filter({ school_year: schoolYear });
    }
    setClasses(classSections);
    if (classSections.length > 0 && !selectedClass) setSelectedClass(classSections[0]);
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
          <p className="text-sm text-gray-500 mt-1">Manage assignments, grades, and grade categories per class</p>
        </div>
        <div className="flex gap-3 items-center">
          <Select value={schoolYear} onValueChange={setSchoolYear}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-2026">2025–2026</SelectItem>
              <SelectItem value="2024-2025">2024–2025</SelectItem>
              <SelectItem value="2026-2027">2026–2027</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => setShowSetup(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Class
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-130px)]">
        {/* Class list sidebar */}
        <div className="w-64 border-r bg-white overflow-y-auto">
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Classes ({classes.length})</p>
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
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors ${selectedClass?.id === cls.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
              >
                <div className="font-medium text-sm">{cls.name}</div>
                <div className="text-xs text-gray-500">{cls.teacher_name || 'No teacher'} · Gr {cls.grade_level}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Gradebook main area */}
        <div className="flex-1 overflow-auto">
          {selectedClass ? (
            <GradebookView classSection={selectedClass} onRefresh={loadData} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a class to view the gradebook</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSetup && <ClassSetupModal onClose={() => setShowSetup(false)} onCreated={loadData} />}
    </div>
  );
}