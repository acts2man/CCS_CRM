import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, ClipboardList, Trophy, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    myClasses: 0,
    assignments: 0,
    documents: 0,
    attendance: 0
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentRecord, setStudentRecord] = useState(null);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Find student record by email
      const students = await base44.entities.Student.filter({ email: currentUser.email });
      if (students.length > 0) {
        setStudentRecord(students[0]);
        
        // Get classes, assignments, and documents
        const [classSections, assignments, documents] = await Promise.all([
          base44.entities.ClassSection.list(),
          base44.entities.Assignment.list(),
          base44.entities.StudentDocument.list()
        ]);

        const studentClasses = classSections.filter(c => 
          c.student_ids?.includes(students[0].id)
        );

        setStats({
          myClasses: studentClasses.length,
          assignments: assignments.length,
          documents: documents.filter(d => d.student_id === students[0].id).length,
          attendance: 0
        });
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "My Classes", value: stats.myClasses, icon: BookOpen, color: "text-blue-600", link: "Courses" },
    { title: "Assignments", value: stats.assignments, icon: ClipboardList, color: "text-green-600", link: "Gradebook" },
    { title: "Documents", value: stats.documents, icon: FileText, color: "text-orange-600", link: "Documents" },
    { title: "Attendance", value: stats.attendance || "—", icon: Calendar, color: "text-purple-600", link: "Attendance" }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome, {user?.full_name || user?.email}!
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
            <Link to={createPageUrl("Assignments")}>
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium">View Assignments</div>
                <div className="text-sm text-gray-600">See your homework and projects</div>
              </button>
            </Link>
            <Link to={createPageUrl("Grades")}>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">Check Grades</div>
                <div className="text-sm text-gray-600">View your academic performance</div>
              </button>
            </Link>
            <Link to={createPageUrl("Chat")}>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">Message Teachers</div>
                <div className="text-sm text-gray-600">Ask questions or get help</div>
              </button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              No upcoming deadlines.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}