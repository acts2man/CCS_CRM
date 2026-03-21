import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getParentWithStudents } from "@/lib/parentUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, DollarSign, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ParentDashboard() {
  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [stats, setStats] = useState({
    totalChildren: 0,
    upcomingAssignments: 0,
    pendingBills: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      // Fetch parent data using email to get synced information
      const parentData = await getParentWithStudents(currentUser.email);
      setParent(parentData);
      
      const myChildren = parentData?.students || [];
      
      setChildren(myChildren);

      // Calculate stats
      let totalAssignments = 0;
      let totalCharges = 0;
      let totalAttendance = 0;
      let totalDays = 0;

      for (const child of myChildren) {
        // Get assignments
        const classes = await base44.entities.ClassSection.list();
        const enrolledClasses = classes.filter(c => c.student_ids?.includes(child.id));
        const assignments = await base44.entities.Assignment.list();
        const childAssignments = assignments.filter(a => 
          enrolledClasses.some(c => c.id === a.class_section_id)
        );
        
        const today = new Date();
        const upcoming = childAssignments.filter(a => {
          if (!a.due_date) return false;
          const dueDate = new Date(a.due_date);
          return dueDate >= today;
        });
        totalAssignments += upcoming.length;

        // Get charges
        const charges = await base44.entities.Charge.filter({ student_id: child.id });
        const unpaid = charges.filter(c => c.status === 'unpaid' || c.status === 'partial');
        totalCharges += unpaid.length;

        // Get attendance
        const clockRecords = await base44.entities.StudentClockInOut.filter({ student_id: child.id });
        const present = clockRecords.filter(r => r.clock_in_time).length;
        totalAttendance += present;
        totalDays += clockRecords.length;
      }

      const attendanceRate = totalDays > 0 ? ((totalAttendance / totalDays) * 100).toFixed(0) : 0;

      setStats({
        totalChildren: myChildren.length,
        upcomingAssignments: totalAssignments,
        pendingBills: totalCharges,
        attendanceRate
      });
    } catch (error) {
      console.error("Error loading parent data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {parent?.first_name} {parent?.last_name}!</h1>
        <p className="text-gray-600 mt-1">Overview of your children's academic progress</p>
      </div>

      {/* No Children Alert */}
      {children.length === 0 && !loading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-blue-900">No children linked to your account yet. Please contact the school to link your children.</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {children.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Children</p>
                <p className="text-3xl font-bold">{stats.totalChildren}</p>
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
                <p className="text-sm text-gray-600 mb-1">Upcoming Assignments</p>
                <p className="text-3xl font-bold">{stats.upcomingAssignments}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Bills</p>
                <p className="text-3xl font-bold">{stats.pendingBills}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold">{stats.attendanceRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Children Overview */}
      {children.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Children</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map(child => (
              <Card key={child.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{child.first_name} {child.last_name}</h3>
                      <p className="text-sm text-gray-600">Grade {child.grade_level}</p>
                    </div>
                    <Badge variant="outline">{child.enrollment_status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium truncate">{child.email}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium">{child.phone || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to={createPageUrl("ParentGrades")}>
            <Card className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300">
              <CardContent className="pt-6">
                <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-gray-900">View Grades</h3>
                <p className="text-sm text-gray-600 mt-1">Check your children's academic performance</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl("ParentBilling")}>
            <Card className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300">
              <CardContent className="pt-6">
                <DollarSign className="h-8 w-8 text-orange-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Manage Billing</h3>
                <p className="text-sm text-gray-600 mt-1">View charges and payment history</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl("ParentAttendance")}>
            <Card className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300">
              <CardContent className="pt-6">
                <Calendar className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Attendance</h3>
                <p className="text-sm text-gray-600 mt-1">Track daily attendance records</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl("ParentDocuments")}>
            <Card className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300">
              <CardContent className="pt-6">
                <BookOpen className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Documents</h3>
                <p className="text-sm text-gray-600 mt-1">View shared school documents</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}