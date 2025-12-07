import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Calendar, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    parents: 0,
    attendanceRate: 0,
    lastMonthStudents: 0,
    lastMonthTeachers: 0,
    lastMonthParents: 0,
    lastMonthAttendance: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const todayStr = today.toISOString().split('T')[0];

      const [students, teachers, parents, attendanceToday, students30Days, teachers30Days] = await Promise.all([
        base44.entities.Student.filter({ enrollment_status: 'active' }),
        base44.entities.Teacher.filter({ status: 'Active' }),
        base44.entities.Parent.list(),
        base44.entities.Attendance.filter({ date: todayStr }),
        base44.entities.Student.filter({ created_date: { $gte: lastMonth.toISOString() } }),
        base44.entities.Teacher.filter({ created_date: { $gte: lastMonth.toISOString() } })
      ]);

      const activeStudents = students.length;
      const presentToday = attendanceToday.filter(a => a.status === 'present').length;
      const attendanceRate = activeStudents > 0 ? Math.round((presentToday / activeStudents) * 100) : 0;

      setStats({
        students: activeStudents,
        teachers: teachers.length,
        parents: parents.length,
        attendanceRate,
        lastMonthStudents: students30Days.length,
        lastMonthTeachers: teachers30Days.length,
        lastMonthParents: 0,
        lastMonthAttendance: 0
      });

      // Mock recent activities
      setRecentActivities([
        { title: "New student registration", description: "Emma Wilson", time: "Today, 10:26 AM" },
        { title: "Grade update", description: "Mr. Johnson", time: "Yesterday, 3:45 PM" },
        { title: "Attendance report generated", description: "Admin", time: "Yesterday, 9:15 AM" },
        { title: "Payment received", description: "Parker Family", time: "2 days ago" }
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeText = (current, previous) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous * 100).toFixed(1);
    const isPositive = change > 0;
    return (
      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
        {isPositive ? '↑' : '↓'} {Math.abs(change)}% from last month
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome, {user?.full_name || 'Admin'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-blue-600 mb-1">Total Students</div>
                <div className="text-3xl font-bold">{loading ? "..." : stats.students}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getChangeText(stats.students, stats.students - stats.lastMonthStudents)}
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Teachers</div>
                <div className="text-3xl font-bold">{loading ? "..." : stats.teachers}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getChangeText(stats.teachers, stats.teachers - stats.lastMonthTeachers)}
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Average Attendance</div>
                <div className="text-3xl font-bold">{loading ? "..." : stats.attendanceRate}%</div>
                <div className="text-xs text-green-600 mt-1">↑ 1% from last month</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Active Parents</div>
                <div className="text-3xl font-bold">{loading ? "..." : stats.parents}</div>
                <div className="text-xs text-green-600 mt-1">↑ 12% from last month</div>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{activity.title}</div>
                    <div className="text-sm text-gray-600">{activity.description}</div>
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Storage Usage</span>
                  <span className="text-gray-500">65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>User Accounts</span>
                  <span className="text-gray-500">329/500</span>
                </div>
                <Progress value={66} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>API Usage</span>
                  <span className="text-gray-500">42%</span>
                </div>
                <Progress value={42} className="h-2" />
              </div>
              <button className="text-sm text-blue-600 hover:underline mt-2">
                View System Details
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to={createPageUrl("Students")}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-semibold">Students</div>
                  <div className="text-sm text-gray-600">Manage student records and information</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl("Teachers")}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-semibold">Teachers</div>
                  <div className="text-sm text-gray-600">Manage teacher profiles and assignments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl("Attendance")}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-semibold">Attendance</div>
                  <div className="text-sm text-gray-600">View and manage student attendance records</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}