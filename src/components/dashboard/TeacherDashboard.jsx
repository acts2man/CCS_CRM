import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, BookOpen, ClipboardList, Loader2, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingGrades, setPendingGrades] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    // Find this teacher's record
    const teacherRecords = await base44.entities.Teacher.filter({ email: currentUser.email }, '', 1);
    if (!teacherRecords?.length) { setLoading(false); return; }
    const teacherRecord = teacherRecords[0];
    setTeacher(teacherRecord);

    // Load this teacher's class sections
    const teacherClasses = await base44.entities.ClassSection.filter({ teacher_id: teacherRecord.id });
    setClasses(teacherClasses);

    if (teacherClasses.length === 0) { setLoading(false); return; }

    const classIds = teacherClasses.map(c => c.id);

    // Gather all enrolled student IDs
    const allStudentIds = [...new Set(teacherClasses.flatMap(c => c.student_ids || []))];

    // Load subjects, assignments, grades, attendance in parallel
    const today = new Date().toISOString().split('T')[0];
    const [allSubjects, allAssignments, allGrades, todayAttendanceRecords] = await Promise.all([
      Promise.all(classIds.map(id => base44.entities.Subject.filter({ class_section_id: id }))).then(r => r.flat()),
      Promise.all(classIds.map(id => base44.entities.Assignment.filter({ class_section_id: id }))).then(r => r.flat()),
      Promise.all(classIds.map(id => base44.entities.AssignmentGrade.filter({ class_section_id: id }))).then(r => r.flat()),
      base44.entities.Attendance.filter({ date: today })
    ]);

    setSubjects(allSubjects);

    // Count assignments with missing grades
    let missingCount = 0;
    for (const asn of allAssignments) {
      const graded = allGrades.filter(g => g.assignment_id === asn.id && g.status === 'graded').length;
      missingCount += Math.max(0, allStudentIds.length - graded);
    }
    setPendingGrades(missingCount);

    // Today's attendance
    const relevantAttendance = todayAttendanceRecords.filter(a => allStudentIds.includes(a.student_id));
    const presentCount = relevantAttendance.filter(a => a.status === 'present').length;
    setTodayAttendance({ present: presentCount, total: allStudentIds.length });

    // Load student details for display
    if (allStudentIds.length > 0) {
      const allStudents = await base44.entities.Student.filter({ enrollment_status: 'active' });
      setStudents(allStudents.filter(s => allStudentIds.includes(s.id)));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const statCards = [
    { title: "My Students", value: students.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50", link: "Students" },
    { title: "My Classes", value: classes.length, icon: BookOpen, color: "text-green-600", bg: "bg-green-50", link: "Gradebook" },
    { title: "Pending Grades", value: pendingGrades, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50", link: "Gradebook" },
    { title: "Today's Attendance", value: `${todayAttendance.present}/${todayAttendance.total}`, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50", link: "Attendance" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {teacher?.avatar ? (
          <img src={teacher.avatar} alt={teacher.first_name} className="h-14 w-14 rounded-full object-cover border-2 border-white shadow" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center text-white text-xl font-bold shadow">
            {teacher?.first_name?.[0]}{teacher?.last_name?.[0]}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {teacher?.first_name || user?.full_name}!</h1>
          <p className="text-gray-500">{teacher?.department} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={createPageUrl(stat.link)}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.title}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> My Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {classes.length === 0 ? (
              <p className="text-sm text-gray-400">No classes assigned yet.</p>
            ) : (
              classes.map(cls => {
                const classSubjects = subjects.filter(s => s.class_section_id === cls.id);
                const studentCount = (cls.student_ids || []).length;
                return (
                  <Link key={cls.id} to={createPageUrl('Gradebook')}>
                    <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                      <div>
                        <div className="font-medium">{cls.name}</div>
                        <div className="text-sm text-gray-500">{classSubjects.map(s => s.name).join(', ') || 'No subjects yet'}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{studentCount} students</Badge>
                        {cls.period && <div className="text-xs text-gray-400 mt-1">Period {cls.period}</div>}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to={createPageUrl("Attendance")}>
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium">Take Attendance</div>
                <div className="text-sm text-gray-500">Mark attendance for today</div>
              </button>
            </Link>
            <Link to={createPageUrl("Gradebook")}>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">Enter Grades</div>
                <div className="text-sm text-gray-500">Update student grades by subject</div>
              </button>
            </Link>
            <Link to={createPageUrl("Documents")}>
              <button className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                <div className="font-medium">Send Document</div>
                <div className="text-sm text-gray-500">Behavior reports, notices, etc.</div>
              </button>
            </Link>
            <Link to={createPageUrl("Chat")}>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">Message Parents</div>
                <div className="text-sm text-gray-500">Send messages to parents</div>
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}