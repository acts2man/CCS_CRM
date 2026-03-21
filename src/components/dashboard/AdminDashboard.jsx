import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Calendar, UserCheck, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { Button } from "@/components/ui/button";
import ClassesOverview from "@/components/gradebook/ClassesOverview";
import ImpersonationModal from "@/components/admin/ImpersonationModal";
import RoleSwitcher from "@/components/admin/RoleSwitcher";
import { useImpersonation } from "@/lib/ImpersonationContext";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [showImpersonation, setShowImpersonation] = useState(false);
  const { startImpersonation } = useImpersonation();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    parents: 0
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

      const [students, teachers, parents] = await Promise.all([
        base44.entities.Student.filter({ enrollment_status: 'active' }),
        base44.entities.Teacher.filter({ status: 'Active' }),
        base44.entities.Parent.list()
      ]);

      setStats({
        students: students.length,
        teachers: teachers.length,
        parents: parents.length
      });

      setRecentActivities([]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.full_name || 'Admin'}</p>
        </div>
        <Button variant="outline" onClick={() => setShowImpersonation(true)} className="flex items-center gap-2">
          <Eye className="h-4 w-4" /> View as Teacher
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-blue-600 mb-1">Total Students</div>
                  <div className="text-3xl font-bold">{loading ? "..." : stats.students}</div>
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
                <div className="text-sm text-gray-600 mb-1">Total Parents</div>
                <div className="text-3xl font-bold">{loading ? "..." : stats.parents}</div>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={createPageUrl("Students")}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-semibold">Students</div>
                  <div className="text-sm text-gray-600">Manage records</div>
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
                  <div className="text-sm text-gray-600">Manage profiles</div>
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
                  <div className="text-sm text-gray-600">View records</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl("Courses")}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <div className="font-semibold">Classes</div>
                  <div className="text-sm text-gray-600">Manage classes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Classes Overview */}
      <div className="pt-4">
        <ClassesOverview />
      </div>

      <ImpersonationModal
        open={showImpersonation}
        onClose={() => setShowImpersonation(false)}
        onSelect={(teacher) => startImpersonation(teacher)}
      />
    </div>
  );
}