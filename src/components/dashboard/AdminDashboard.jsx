import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, FileText, Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    documents: 0,
    attendance: 0,
    payments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [students, teachers, classes, documents, attendance, payments] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.Teacher.list(),
        base44.entities.Class.list(),
        base44.entities.Document.list(),
        base44.entities.Attendance.list(),
        base44.entities.Payment.list()
      ]);

      setStats({
        students: students.length,
        teachers: teachers.length,
        classes: classes.length,
        documents: documents.length,
        attendance: attendance.length,
        payments: payments.length
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Students", value: stats.students, icon: Users, color: "text-blue-600", link: "Students" },
    { title: "Teachers", value: stats.teachers, icon: GraduationCap, color: "text-green-600", link: "Teachers" },
    { title: "Classes", value: stats.classes, icon: BookOpen, color: "text-purple-600", link: "Classes" },
    { title: "Documents", value: stats.documents, icon: FileText, color: "text-orange-600", link: "Documents" },
    { title: "Attendance Records", value: stats.attendance, icon: Calendar, color: "text-indigo-600", link: "Attendance" },
    { title: "Payments", value: stats.payments, icon: DollarSign, color: "text-emerald-600", link: "Finance" }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">School Management System Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="text-sm text-gray-600">Mark student attendance for today</div>
              </button>
            </Link>
            <Link to={createPageUrl("Students")}>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">Add Student</div>
                <div className="text-sm text-gray-600">Register a new student</div>
              </button>
            </Link>
            <Link to={createPageUrl("ReportCenter")}>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">View Reports</div>
                <div className="text-sm text-gray-600">Access academic reports</div>
              </button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              No recent activity to display.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}