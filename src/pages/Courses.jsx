import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, BookOpen } from 'lucide-react';
import ClassSetupModal from '@/components/gradebook/ClassSetupModal';
import SubjectView from '@/components/gradebook/SubjectView';

export default function Courses() {
  const [classes, setClasses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClassSetup, setShowClassSetup] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [schoolYear, setSchoolYear] = useState('2025-2026');

  useEffect(() => { loadData(); }, [schoolYear]);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const cls = await base44.entities.ClassSection.filter({ school_year: schoolYear });
    setClasses(cls);
    if (cls.length > 0 && !selectedClass) setSelectedClass(cls[0]);
    setLoading(false);
  };

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Classes</h1>
            <p className="text-sm text-gray-500 mt-1 hidden sm:block">Manage classes, subjects, and assignments</p>
          </div>
          <div className="flex gap-2">
            <Select value={schoolYear} onValueChange={setSchoolYear}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-2025">2024–2025</SelectItem>
                <SelectItem value="2025-2026">2025–2026</SelectItem>
                <SelectItem value="2026-2027">2026–2027</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => setShowClassSetup(true)}>
              <Plus className="h-4 w-4 mr-1" /> New Class
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-4">
        {/* Mobile: horizontal pill selector. Desktop: sidebar + content */}
        
        {/* Mobile class selector */}
        <div className="md:hidden">
          {classes.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No classes yet — create one above
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => handleClassSelect(cls)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm border transition-colors text-left ${
                    selectedClass?.id === cls.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium whitespace-nowrap">{cls.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: sidebar + content */}
        <div className="hidden md:flex h-[calc(100vh-220px)]">
          <div className="w-64 border-r bg-white rounded-lg mr-6 overflow-y-auto flex-shrink-0">
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
                  onClick={() => handleClassSelect(cls)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${selectedClass?.id === cls.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                >
                  <div className="font-medium">{cls.name}</div>
                  <div className="text-xs text-gray-500">{cls.teacher_name || 'No teacher'}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {selectedClass ? (
              <SubjectView key={selectedClass.id} classSection={selectedClass} onRefresh={loadData} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Select a class to manage subjects</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: selected class content */}
        <div className="md:hidden">
          {selectedClass ? (
            <SubjectView key={selectedClass.id} classSection={selectedClass} onRefresh={loadData} />
          ) : classes.length > 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a class above</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showClassSetup && <ClassSetupModal onClose={() => setShowClassSetup(false)} onCreated={loadData} />}
    </div>
  );
}