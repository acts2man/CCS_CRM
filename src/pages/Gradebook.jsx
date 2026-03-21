import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BookOpen } from 'lucide-react';
import SubjectView from '@/components/gradebook/SubjectView';

export default function Gradebook() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
          <p className="text-sm text-gray-500 mt-1">Enter and view grades for your classes</p>
        </div>
        <Select value={schoolYear} onValueChange={setSchoolYear}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-2025">2024–2025</SelectItem>
            <SelectItem value="2025-2026">2025–2026</SelectItem>
            <SelectItem value="2026-2027">2026–2027</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="p-6">
        <div className="flex h-[calc(100vh-220px)]">
          <div className="w-64 border-r bg-white rounded-lg mr-6 overflow-y-auto">
            <div className="p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Your Classes</p>
              {classes.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No classes assigned
                </div>
              )}
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    selectedClass?.id === cls.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{cls.name}</div>
                  <div className="text-xs text-gray-500">Grade {cls.grade_level}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            {selectedClass ? (
              <TeacherGradebookView key={selectedClass.id} classSection={selectedClass} schoolYear={schoolYear} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Select a class to view subjects and grades</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}