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
import { Users, UserCheck, UserX, Clock, Search, Save, ChevronLeft, ChevronRight, Settings, Zap, Flame } from 'lucide-react';
import FireDrillMode from '@/components/attendance/FireDrillMode';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns';

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [monthAttendance, setMonthAttendance] = useState([]);
  const [user, setUser] = useState(null);
  const [fireDrillMode, setFireDrillMode] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  useEffect(() => {
    loadMonthAttendance();
  }, [calendarMonth]);

  const loadMonthAttendance = async () => {
    try {
      const start = format(startOfMonth(calendarMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(calendarMonth), 'yyyy-MM-dd');
      
      const data = await base44.entities.Attendance.list('', 2000);
      const filtered = data.filter(a => a.date >= start && a.date <= end);
      setMonthAttendance(filtered);
    } catch (error) {
      console.error('Error loading month attendance:', error);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      // Check if user has a matching Teacher record
      const teachers = await base44.entities.Teacher.filter({ email: currentUser.email }, '', 1);
      if (teachers && teachers.length > 0) {
        currentUser.role = 'teacher';
      }
      
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

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
    
    // Teachers only see grades 7 and higher
    const teacherGradeMatch = user?.role !== 'teacher' || ['7', '8', '9', '10', '11', '12'].includes(student.grade_level);
    
    return gradeMatch && searchMatch && teacherGradeMatch;
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {format(calendarMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCalendarMonth(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}

                {(() => {
                  const monthStart = startOfMonth(calendarMonth);
                  const monthEnd = endOfMonth(calendarMonth);
                  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                  const startDay = getDay(monthStart);
                  
                  const calendarDays = [];
                  for (let i = 0; i < startDay; i++) {
                    calendarDays.push(<div key={`empty-${i}`} className="aspect-square" />);
                  }
                  
                  days.forEach(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const dayRecords = monthAttendance.filter(a => a.date === dayStr);
                    const presentCount = dayRecords.filter(a => a.status === 'present').length;
                    const absentCount = dayRecords.filter(a => a.status === 'absent').length;
                    const tardyCount = dayRecords.filter(a => a.status === 'tardy').length;
                    const totalMarked = dayRecords.length;
                    
                    calendarDays.push(
                      <button
                        key={dayStr}
                        onClick={() => setSelectedDate(day)}
                        className={`aspect-square p-2 rounded-lg border transition-all ${
                          isToday(day) ? 'border-blue-600 bg-blue-50' :
                          isSameDay(day, selectedDate) ? 'border-slate-900 bg-slate-100' :
                          'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col h-full">
                          <div className={`text-sm font-semibold mb-1 ${
                            isToday(day) ? 'text-blue-600' :
                            isSameDay(day, selectedDate) ? 'text-slate-900' :
                            'text-gray-900'
                          }`}>
                            {format(day, 'd')}
                          </div>
                          {totalMarked > 0 && (
                            <div className="flex-1 flex flex-col gap-1 text-xs">
                              {presentCount > 0 && (
                                <div className="bg-green-100 text-green-800 px-1 rounded">
                                  {presentCount}P
                                </div>
                              )}
                              {absentCount > 0 && (
                                <div className="bg-red-100 text-red-800 px-1 rounded">
                                  {absentCount}A
                                </div>
                              )}
                              {tardyCount > 0 && (
                                <div className="bg-yellow-100 text-yellow-800 px-1 rounded">
                                  {tardyCount}T
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  });
                  
                  return calendarDays;
                })()}
              </div>

              <div className="mt-6 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                  <span>Tardy</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Attendance Automation</h2>
                    <p className="text-gray-600">Set up automated workflows based on attendance patterns</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Zap className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>

                <div className="grid gap-4">
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <UserX className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Truancy Alert</h3>
                          <p className="text-sm text-gray-600">Notify parents after 3 consecutive absences</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Active</span>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 ml-13">
                      Last triggered: 2 hours ago • 3 students notified
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Late Arrival Notification</h3>
                          <p className="text-sm text-gray-600">Send SMS when student marked tardy</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Active</span>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 ml-13">
                      Last triggered: Today at 8:45 AM • 12 notifications sent
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow opacity-60">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Perfect Attendance Award</h3>
                          <p className="text-sm text-gray-600">Monthly recognition for 100% attendance</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">Paused</span>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 ml-13">
                      Next run: End of month
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow opacity-60">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <UserX className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Weekly Attendance Report</h3>
                          <p className="text-sm text-gray-600">Email summary to parents every Friday</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">Paused</span>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 ml-13">
                      Next run: Friday at 3:00 PM
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Automation Templates</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 hover:border-blue-600 transition-colors cursor-pointer">
                    <h4 className="font-semibold mb-2">Daily Attendance Summary</h4>
                    <p className="text-sm text-gray-600 mb-3">Send daily attendance stats to administrators</p>
                    <Button variant="outline" size="sm">Use Template</Button>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-blue-600 transition-colors cursor-pointer">
                    <h4 className="font-semibold mb-2">Absence Follow-up</h4>
                    <p className="text-sm text-gray-600 mb-3">Automated check-in calls for unexcused absences</p>
                    <Button variant="outline" size="sm">Use Template</Button>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-blue-600 transition-colors cursor-pointer">
                    <h4 className="font-semibold mb-2">Attendance Improvement Plan</h4>
                    <p className="text-sm text-gray-600 mb-3">Trigger intervention after attendance threshold</p>
                    <Button variant="outline" size="sm">Use Template</Button>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-blue-600 transition-colors cursor-pointer">
                    <h4 className="font-semibold mb-2">Positive Reinforcement</h4>
                    <p className="text-sm text-gray-600 mb-3">Reward students for improved attendance patterns</p>
                    <Button variant="outline" size="sm">Use Template</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}