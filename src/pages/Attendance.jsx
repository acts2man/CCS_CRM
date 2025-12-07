import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, UserCheck, UserX, Clock, Search, Save } from 'lucide-react';
import { format } from 'date-fns';

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState({});

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const [studentsData, attendanceData, recentData] = await Promise.all([
        base44.entities.Student.filter({ enrollment_status: 'active' }, '', 200),
        base44.entities.Attendance.filter({ 
          date: format(selectedDate, 'yyyy-MM-dd') 
        }, '', 500),
        base44.entities.Attendance.list('-created_date', 50)
      ]);
      setStudents(studentsData);
      setAttendance(attendanceData);
      setRecentRecords(recentData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = (studentId, status) => {
    setPendingChanges(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAllAttendance = async () => {
    try {
      const user = await base44.auth.me();
      
      for (const [studentId, status] of Object.entries(pendingChanges)) {
        const existing = attendance.find(a => a.student_id === studentId);
        if (existing) {
          await base44.entities.Attendance.update(existing.id, { status });
        } else {
          await base44.entities.Attendance.create({
            student_id: studentId,
            date: format(selectedDate, 'yyyy-MM-dd'),
            status,
            recorded_by: user.id
          });
        }
      }
      
      setPendingChanges({});
      await loadData();
      console.log('✅ Attendance saved successfully');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    }
  };

  const getAttendanceStatus = (studentId) => {
    if (pendingChanges[studentId]) {
      return pendingChanges[studentId];
    }
    const record = attendance.find(a => a.student_id === studentId);
    return record?.status || 'unmarked';
  };

  // Calculate stats
  const enrolledCount = students.length;
  const presentCount = attendance.filter(a => a.status === 'present' && a.date === format(selectedDate, 'yyyy-MM-dd')).length;
  const absentCount = attendance.filter(a => a.status === 'absent' && a.date === format(selectedDate, 'yyyy-MM-dd')).length;
  const tardyCount = attendance.filter(a => a.status === 'tardy' && a.date === format(selectedDate, 'yyyy-MM-dd')).length;
  const attendanceRate = enrolledCount > 0 ? ((presentCount / enrolledCount) * 100).toFixed(1) : 0;

  // Get unique grade levels
  const gradeLevels = [...new Set(students.map(s => s.grade_level))].sort();

  // Filter students
  const filteredStudents = students.filter(student => {
    const gradeMatch = selectedGrade === 'all' || student.grade_level === selectedGrade;
    const searchMatch = searchTerm === '' || 
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    return gradeMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading attendance...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Attendance Management</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Students</div>
                <div className="text-3xl font-bold">{enrolledCount}</div>
                <div className="text-xs text-gray-500 mt-1">Enrolled students</div>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Present Today</div>
                <div className="text-3xl font-bold text-green-600">{presentCount}</div>
                <div className="text-xs text-gray-500 mt-1">{attendanceRate}% attendance rate</div>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Absent Today</div>
                <div className="text-3xl font-bold text-red-600">{absentCount}</div>
                <div className="text-xs text-gray-500 mt-1">Students absent</div>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Tardy Today</div>
                <div className="text-3xl font-bold text-yellow-600">{tardyCount}</div>
                <div className="text-xs text-gray-500 mt-1">Late arrivals</div>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="daily"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            Daily Attendance
          </TabsTrigger>
          <TabsTrigger 
            value="calendar"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            Calendar View
          </TabsTrigger>
          <TabsTrigger 
            value="automation"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6 mt-6">
          {/* Take Attendance Section */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Take Attendance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Grade</label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {gradeLevels.map(grade => (
                        <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Search Student</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={saveAllAttendance}
                    disabled={Object.keys(pendingChanges).length === 0}
                    className="w-full bg-slate-900 hover:bg-slate-800"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save All
                  </Button>
                </div>
              </div>

              {/* Student List */}
              <div className="space-y-3">
                {filteredStudents.map((student) => {
                  const status = getAttendanceStatus(student.id);
                  return (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">{student.first_name} {student.last_name}</div>
                        <div className="text-sm text-gray-600">Grade {student.grade_level}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={status === 'present' ? 'default' : 'outline'}
                          onClick={() => markAttendance(student.id, 'present')}
                          className={status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'absent' ? 'default' : 'outline'}
                          onClick={() => markAttendance(student.id, 'absent')}
                          className={status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'tardy' ? 'default' : 'outline'}
                          onClick={() => markAttendance(student.id, 'tardy')}
                          className={status === 'tardy' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                        >
                          Tardy
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'excused' ? 'default' : 'outline'}
                          onClick={() => markAttendance(student.id, 'excused')}
                          className={status === 'excused' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                          Excused
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredStudents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No students found.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance Records */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Recent Attendance Records</h2>
              <div className="space-y-2">
                {recentRecords.slice(0, 10).map((record) => {
                  const student = students.find(s => s.id === record.student_id);
                  if (!student) return null;
                  
                  return (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{student.first_name} {student.last_name}</div>
                        <div className="text-sm text-gray-600">{record.date}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        record.status === 'tardy' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {record.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500">Calendar view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500">Automation settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}