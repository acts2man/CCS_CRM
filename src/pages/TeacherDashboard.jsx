import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useTeacherId } from "@/lib/useTeacherId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, BarChart3, Calendar, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function TeacherDashboard() {
  const { teacherId, teacher, loading: teacherLoading } = useTeacherId();
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalAssignments: 0
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const navUrl = (href) => {
    const base = `/${href}`;
    return teacherId && new URLSearchParams(location.search).get('teacherId') 
      ? `${base}?teacherId=${teacherId}` 
      : base;
  };

  useEffect(() => {
    if (teacherLoading) return;
    loadDashboardData();
  }, [teacherId, teacherLoading]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (!teacherId) {
        setLoading(false);
        return;
      }

      const [allClasses, allAssignments, allStudents] = await Promise.all([
        base44.entities.ClassSection.list(),
        base44.entities.Assignment.list(),
        base44.entities.Student.list()
      ]);

      const teacherClasses = allClasses.filter(c => c.teacher_id === teacherId);

      // Count students from Student entity teacher_ids - single source of truth
      const totalStudents = allStudents.filter(s => s.teacher_ids?.includes(teacherId)).length;

      const teacherAssignments = allAssignments.filter(a => 
        teacherClasses.some(c => c.id === a.class_section_id)
      );

      setStats({
        totalClasses: teacherClasses.length,
        totalStudents,
        totalAssignments: teacherAssignments.length
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (teacherLoading || loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Greeting */}
      {teacher && (
        <div className="flex items-start gap-6">
          {teacher.avatar ? (
            <img
              src={teacher.avatar}
              alt={`${teacher.first_name} ${teacher.last_name}`}
              className="h-24 w-24 rounded-full object-cover border-4 border-blue-100 shadow-md flex-shrink-0"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200 shadow-md flex-shrink-0">
              <User className="h-12 w-12 text-blue-600" />
            </div>
          )}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome back, <span className="text-blue-600">{teacher.first_name}</span>
            </h1>
            <p className="text-gray-600">{teacher.department || 'Teacher'}</p>
          </div>
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                <p className="text-3xl font-bold">{stats.totalClasses}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Assignments</p>
                <p className="text-3xl font-bold">{stats.totalAssignments}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to={navUrl("TeacherClasses")}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">My Classes</h3>
                    <p className="text-sm text-gray-600">View and manage your classes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={navUrl("TeacherGradebook")}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Gradebook</h3>
                    <p className="text-sm text-gray-600">Enter and review grades</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={navUrl("TeacherAttendance")}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Attendance</h3>
                    <p className="text-sm text-gray-600">Track student attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={navUrl("TeacherCommunications")}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Communications</h3>
                    <p className="text-sm text-gray-600">Parent communication log</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}