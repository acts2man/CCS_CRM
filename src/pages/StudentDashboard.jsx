import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, BookOpen, ClipboardList, Zap, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState({
    subjects: 0,
    assignments: 0,
    upcomingDeadlines: 0,
    averageGrade: null
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      const user = await base44.auth.me();
      
      // Get student record
      const students = await base44.entities.Student.filter({ email: user.email });
      if (students.length === 0) return;
      
      const studentData = students[0];
      setStudent(studentData);

      // Get all related data
      const [classes, assignments, grades] = await Promise.all([
        base44.entities.ClassSection.list(),
        base44.entities.Assignment.list(),
        base44.entities.AssignmentGrade.list()
      ]);

      // Filter data relevant to this student
      const enrolledClasses = classes.filter(c => c.student_ids?.includes(studentData.id));
      const studentAssignments = assignments.filter(a => 
        enrolledClasses.some(c => c.id === a.class_section_id)
      );
      const studentGrades = grades.filter(g => g.student_id === studentData.id);

      // Calculate average grade
      const avgGrade = studentGrades.length > 0
        ? (studentGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / studentGrades.length).toFixed(1)
        : null;

      // Find upcoming deadlines
      const today = new Date();
      const upcomingDeadlines = studentAssignments.filter(a => {
        if (!a.due_date) return false;
        const dueDate = new Date(a.due_date);
        return dueDate >= today;
      }).length;

      // Get 5 most recent assignments
      const recent = studentAssignments
        .sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date))
        .slice(0, 5);

      setStats({
        subjects: enrolledClasses.length,
        assignments: studentAssignments.length,
        upcomingDeadlines,
        averageGrade: avgGrade
      });

      setRecentAssignments(recent);
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {student?.first_name}!</h1>
        <p className="text-gray-600 mt-1">Grade {student?.grade_level} • Academic Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current GPA</p>
                <p className="text-3xl font-bold">{stats.averageGrade ? `${stats.averageGrade}%` : "—"}</p>
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
                <p className="text-sm text-gray-600 mb-1">Enrolled Subjects</p>
                <p className="text-3xl font-bold">{stats.subjects}</p>
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
                <p className="text-sm text-gray-600 mb-1">Total Assignments</p>
                <p className="text-3xl font-bold">{stats.assignments}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Upcoming Deadlines</p>
                <p className="text-3xl font-bold">{stats.upcomingDeadlines}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Assignments</span>
                <Link to={createPageUrl("StudentAssignments")}>
                  <span className="text-sm text-blue-600 hover:text-blue-800 font-normal">View All</span>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAssignments.length === 0 ? (
                <p className="text-gray-500 text-sm">No assignments yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentAssignments.map((assignment) => (
                    <div key={assignment.id} className="pb-3 border-b last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{assignment.title}</p>
                          <p className="text-sm text-gray-600">{assignment.category_name}</p>
                        </div>
                        {assignment.due_date && (
                          <Badge variant="outline" className="text-xs">
                            Due {format(new Date(assignment.due_date), "MMM d")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to={createPageUrl("StudentGrades")}>
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <p className="font-medium text-sm">View Grades</p>
                <p className="text-xs text-gray-600">Check all your grades</p>
              </button>
            </Link>
            <Link to={createPageUrl("StudentSubjects")}>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <p className="font-medium text-sm">My Subjects</p>
                <p className="text-xs text-gray-600">View enrolled classes</p>
              </button>
            </Link>
            <Link to={createPageUrl("StudentTeachers")}>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <p className="font-medium text-sm">My Teachers</p>
                <p className="text-xs text-gray-600">Contact information</p>
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}