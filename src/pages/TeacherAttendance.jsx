import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useTeacherId } from "@/lib/useTeacherId";

export default function TeacherAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const { teacherId, loading: teacherLoading } = useTeacherId();

  useEffect(() => {
    if (teacherLoading) return;
    loadTeacherAttendance();
  }, [teacherId, teacherLoading]);

  useEffect(() => {
    if (selectedClass) {
      loadClassAttendance(selectedClass);
    }
  }, [selectedClass]);

  const loadTeacherAttendance = async () => {
    setLoading(true);
    try {
      if (!teacherId) { setLoading(false); return; }
      const allClasses = await base44.entities.ClassSection.list();
      const teacherClasses = allClasses.filter(c => c.teacher_id === teacherId);
      setClasses(teacherClasses);
      if (teacherClasses.length > 0) setSelectedClass(teacherClasses[0]);
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassAttendance = async (classData) => {
    try {
      const allAttendance = await base44.entities.StudentClockInOut.list();
      const studentIds = classData.student_ids || [];
      
      const classAttendance = allAttendance.filter(a => studentIds.includes(a.student_id));
      
      // Group by date
      const grouped = {};
      classAttendance.forEach(record => {
        const date = record.date;
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(record);
      });

      setAttendance(Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0])));
    } catch (error) {
      console.error("Error loading class attendance:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-2">Track student attendance records</p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No classes to view attendance for.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedClass?.id === cls.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>

          {selectedClass && (
            <div className="space-y-4">
              {attendance.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    No attendance records yet.
                  </CardContent>
                </Card>
              ) : (
                attendance.map(([date, records]) => (
                  <Card key={date}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5" />
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {records.map((record) => (
                        <div key={record.id} className="flex items-center justify-between pb-2 border-b last:border-b-0">
                          <div>
                            <div className="font-medium">{record.student_name}</div>
                            <div className="text-sm text-gray-600">
                              {record.clock_in_time && `In: ${record.clock_in_time}`}
                              {record.clock_in_time && record.clock_out_time && ' • '}
                              {record.clock_out_time && `Out: ${record.clock_out_time}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {record.is_tardy ? (
                              <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Tardy
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Present
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}