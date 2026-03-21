import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BookOpen, Users, TrendingUp, Pencil } from 'lucide-react';
import EditClassModal from './EditClassModal';

export default function ClassesOverview() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [editingClass, setEditingClass] = useState(null);

  useEffect(() => { loadData(); }, [schoolYear]);

  const loadData = async () => {
    setLoading(true);
    const cls = await base44.entities.ClassSection.filter({ school_year: schoolYear });
    setClasses(cls);
    setLoading(false);
  };

  const getClassStats = async (classId) => {
    const grades = await base44.entities.AssignmentGrade.filter({ class_section_id: classId });
    if (grades.length === 0) return { avg: null, graded: 0, total: 0 };
    const graded = grades.filter(g => g.status === 'graded').length;
    const total = grades.length;
    const avg = grades.filter(g => g.percentage).length > 0
      ? grades.filter(g => g.percentage).reduce((sum, g) => sum + g.percentage, 0) / grades.filter(g => g.percentage).length
      : null;
    return { avg, graded, total };
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Classes</h2>
        <Select value={schoolYear} onValueChange={setSchoolYear}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-2025">2024–2025</SelectItem>
            <SelectItem value="2025-2026">2025–2026</SelectItem>
            <SelectItem value="2026-2027">2026–2027</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No classes for this school year</p>
            <p className="text-sm mt-1">Create classes in the Classes tab</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map(cls => {
            const studentCount = cls.student_ids?.length || 0;
            return (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{cls.name}</h3>
                      <p className="text-sm text-gray-600">{cls.teacher_name || 'No teacher assigned'}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700" onClick={() => setEditingClass(cls)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded p-3 text-center">
                      <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-blue-600">{studentCount}</div>
                      <div className="text-xs text-gray-600">Students</div>
                    </div>
                    <div className="bg-green-50 rounded p-3 text-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-green-600">{cls.grade_level ? `Gr ${cls.grade_level}` : '—'}</div>
                      <div className="text-xs text-gray-600">Grade Level</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {cls.period && <Badge variant="outline">Period {cls.period}</Badge>}
                    {cls.school_year && <Badge className="bg-gray-100 text-gray-700">{cls.school_year}</Badge>}
                    {cls.room_number && <Badge variant="outline">Room {cls.room_number}</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {editingClass && (
          <EditClassModal
            classSection={editingClass}
            onClose={() => setEditingClass(null)}
            onSaved={() => { setEditingClass(null); loadData(); }}
          />
        )}
      )}
    </div>
  );
}