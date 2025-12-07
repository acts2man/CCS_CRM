import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const [studentsData, attendanceData] = await Promise.all([
        base44.entities.Student.filter({ enrollment_status: 'active' }),
        base44.entities.Attendance.filter({ 
          date: format(selectedDate, 'yyyy-MM-dd') 
        })
      ]);
      setStudents(studentsData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      const existing = attendance.find(a => a.student_id === studentId);
      if (existing) {
        await base44.entities.Attendance.update(existing.id, { status });
      } else {
        await base44.entities.Attendance.create({
          student_id: studentId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          status,
          recorded_by: (await base44.auth.me()).id
        });
      }
      loadData();
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const getAttendanceStatus = (studentId) => {
    const record = attendance.find(a => a.student_id === studentId);
    return record?.status || 'unmarked';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading attendance...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Attendance</h1>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border rounded-md px-3 py-2"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Attendance for {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.map((student) => {
                const status = getAttendanceStatus(student.id);
                return (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-gray-600">Grade {student.grade_level}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={status === 'present' ? 'default' : 'outline'}
                        onClick={() => markAttendance(student.id, 'present')}
                        className={status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'absent' ? 'default' : 'outline'}
                        onClick={() => markAttendance(student.id, 'absent')}
                        className={status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Absent
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'tardy' ? 'default' : 'outline'}
                        onClick={() => markAttendance(student.id, 'tardy')}
                        className={status === 'tardy' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Tardy
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}