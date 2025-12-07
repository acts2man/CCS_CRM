import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, Calendar, DollarSign, FileText } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    documents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [students, teachers, classes, documents] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.Teacher.list(),
        base44.entities.Class.list(),
        base44.entities.Document.list()
      ]);

      setStats({
        students: students.length,
        teachers: teachers.length,
        classes: classes.length,
        documents: documents.length
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Students", value: stats.students, icon: Users, color: "text-blue-600" },
    { title: "Teachers", value: stats.teachers, icon: GraduationCap, color: "text-green-600" },
    { title: "Classes", value: stats.classes, icon: BookOpen, color: "text-purple-600" },
    { title: "Documents", value: stats.documents, icon: FileText, color: "text-orange-600" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Calvary Christian School</h1>
          <p className="text-gray-600 mt-2">
            {user ? `Hello, ${user.full_name || user.email}!` : 'School Management System'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium">Take Attendance</div>
                <div className="text-sm text-gray-600">Mark student attendance for today</div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">Add Student</div>
                <div className="text-sm text-gray-600">Register a new student</div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">View Reports</div>
                <div className="text-sm text-gray-600">Access academic reports</div>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                No recent activity to display.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}