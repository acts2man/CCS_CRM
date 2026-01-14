import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, BookOpen, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    myStudents: 0,
    myClasses: 0,
    pendingGrades: 0,
    todayAttendance: 0
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [classes, students, grades] = await Promise.all([
        base44.entities.Class.list(),
        base44.entities.Student.list(),
        base44.entities.Grade.list()
      ]);

      setStats({
        myStudents: students.length,
        myClasses: classes.length,
        pendingGrades: grades.filter(g => !g.grade).length,
        todayAttendance: 0
      });
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "My Students", value: stats.myStudents, icon: Users, color: "text-blue-600", link: "Students" },
    { title: "My Classes", value: stats.myClasses, icon: BookOpen, color: "text-green-600", link: "Classes" },
    { title: "Pending Grades", value: stats.pendingGrades, icon: ClipboardList, color: "text-orange-600", link: "Grading" },
    { title: "Today's Attendance", value: stats.todayAttendance, icon: Calendar, color: "text-purple-600", link: "Attendance" }
  ];

  return (
    <div className="space-y-6 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.full_name}!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={createPageUrl(stat.link)}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{loading ? "..." : stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to={createPageUrl("Attendance")}>
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium">Take Attendance</div>
                <div className="text-sm text-gray-600">Mark attendance for today</div>
              </button>
            </Link>
            <Link to={createPageUrl("Grading")}>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">Enter Grades</div>
                <div className="text-sm text-gray-600">Update student grades</div>
              </button>
            </Link>
            <Link to={createPageUrl("Chat")}>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">Message Parents</div>
                <div className="text-sm text-gray-600">Send messages to parents</div>
              </button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              No upcoming events scheduled.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}