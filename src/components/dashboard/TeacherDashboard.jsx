import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, BookOpen, ClipboardList, Loader2, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SubjectView from "@/components/gradebook/SubjectView";

export default function TeacherDashboard({ impersonatedTeacher }) {
  const [user, setUser] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingGrades, setPendingGrades] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => { loadData(); }, [impersonatedTeacher]);

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]);
  }, [classes]);

  const loadData = async () => {
    setLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    // Use impersonated teacher if provided, otherwise find by logged-in email
    let teacherRecord;
    if (impersonatedTeacher) {
      teacherRecord = impersonatedTeacher;
    } else {
      const teacherRecords = await base44.entities.Teacher.filter({ email: currentUser.email }, '', 1);
      if (!teacherRecords?.length) { setLoading(false); return; }
      teacherRecord = teacherRecords[0];
    }
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

  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]);
  }, [classes]);

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

      {/* Quick Actions row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to={createPageUrl("Attendance")}>
          <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <div className="font-medium text-sm">Take Attendance</div>
            <div className="text-xs text-gray-500">Mark for today</div>
          </button>
        </Link>
        <Link to={createPageUrl("Documents")}>
          <button className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
            <div className="font-medium text-sm">Send Document</div>
            <div className="text-xs text-gray-500">Reports & notices</div>
          </button>
        </Link>
        <Link to={createPageUrl("Chat")}>
          <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <div className="font-medium text-sm">Message Parents</div>
            <div className="text-xs text-gray-500">Send messages</div>
          </button>
        </Link>
        <Link to={createPageUrl("TimeOff")}>
          <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <div className="font-medium text-sm">Time Off</div>
            <div className="text-xs text-gray-500">Request leave</div>
          </button>
        </Link>
      </div>

      {/* Gradebook section */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5" /> My Gradebook</h2>
        {classes.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-gray-400">No classes assigned yet.</CardContent></Card>
        ) : (
          <div className="flex h-[calc(100vh-460px)] min-h-[500px]">
            {/* Class list sidebar */}
            <div className="w-56 border-r bg-white rounded-l-lg overflow-y-auto flex-shrink-0">
              <div className="p-3 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Classes</p>
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${selectedClass?.id === cls.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                  >
                    <div className="font-medium">{cls.name}</div>
                    <div className="text-xs text-gray-500">Grade {cls.grade_level}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Subject view */}
            <div className="flex-1 overflow-hidden">
              {selectedClass ? (
                <SubjectView key={selectedClass.id} classSection={selectedClass} onRefresh={loadData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 bg-white rounded-r-lg border">
                  <p>Select a class to manage grades</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}