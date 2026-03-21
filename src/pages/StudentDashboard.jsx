import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, BookOpen, ClipboardList, Zap, Clock, FileText, User, Mail, Phone, Users, X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { useImpersonation } from "@/lib/ImpersonationContext";
import DocumentDetailModal from "@/components/students/DocumentDetailModal";

export default function StudentDashboard() {
  const { impersonatedStudent, stopImpersonation } = useImpersonation();
  const [student, setStudent] = useState(null);
  const [parents, setParents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [stats, setStats] = useState({
    subjects: 0,
    assignments: 0,
    upcomingDeadlines: 0,
    averageGrade: null
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, [impersonatedStudent]);

  const loadStudentData = async () => {
    try {
      // Use impersonated student if available, otherwise get logged-in student
      let studentData;
      
      if (impersonatedStudent) {
        studentData = impersonatedStudent;
      } else {
        const user = await base44.auth.me();
        const students = await base44.entities.Student.filter({ email: user.email });
        if (students.length === 0) return;
        studentData = students[0];
      }
      
      setStudent(studentData);

      // Get all related data in parallel
      const [classes, assignments, grades, allParents, docs, clockInOut] = await Promise.all([
        base44.entities.ClassSection.list(),
        base44.entities.Assignment.list(),
        base44.entities.AssignmentGrade.list(),
        base44.entities.Parent.list(),
        base44.entities.StudentDocument.filter({ student_id: studentData.id }),
        base44.entities.StudentClockInOut.filter({ student_id: studentData.id })
      ]);

      // Filter data relevant to this student
      const enrolledClasses = classes.filter(c => c.student_ids?.includes(studentData.id));
      const studentAssignments = assignments.filter(a => 
        enrolledClasses.some(c => c.id === a.class_section_id)
      );
      const studentGrades = grades.filter(g => g.student_id === studentData.id);

      // Get parent information
      const studentParents = allParents.filter(p => 
        studentData.parent_ids?.includes(p.id)
      );
      setParents(studentParents);

      // Get documents
      setDocuments(docs.slice(0, 3));

      // Get recent attendance (last 5 records)
      const recentAttendanceData = clockInOut
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      setRecentAttendance(recentAttendanceData);

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
      {/* Profile Header */}
      <div className="relative">
        {impersonatedStudent && (
          <div className="absolute -top-2 -right-2 z-10">
            <button
              onClick={stopImpersonation}
              className="flex items-center gap-2 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full hover:bg-amber-600 transition-colors shadow-md"
            >
              <span>Viewing as {student?.first_name}</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {student?.photo_url ? (
                <img 
                  src={student.photo_url} 
                  alt={`${student.first_name} ${student.last_name}`}
                  className="h-24 w-24 rounded-lg object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-gray-300 flex items-center justify-center border-4 border-white shadow-md">
                  <User className="h-12 w-12 text-gray-500" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{student?.first_name} {student?.last_name}</h1>
                <p className="text-lg text-gray-600 mt-1">Grade {student?.grade_level}</p>
                {student?.email && (
                  <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {student.email}
                  </p>
                )}
                {student?.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {student.phone}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Parent Information */}
      {parents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Parent Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parents.map((parent) => (
              <Card key={parent.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{parent.first_name} {parent.last_name}</p>
                      <p className="text-xs text-gray-600 capitalize">{parent.relationship}</p>
                      {parent.email && (
                        <a href={`mailto:${parent.email}`} className="text-sm text-blue-600 hover:text-blue-800 truncate block">
                          {parent.email}
                        </a>
                      )}
                      {parent.phone && (
                        <a href={`tel:${parent.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                          {parent.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Attendance */}
      {recentAttendance.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attendance</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {recentAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between pb-3 border-b last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium text-gray-900">{format(new Date(record.date), "MMMM d, yyyy")}</p>
                      <p className="text-sm text-gray-600">
                        {record.clock_in_time && `In: ${record.clock_in_time}`}
                        {record.clock_out_time && ` • Out: ${record.clock_out_time}`}
                      </p>
                    </div>
                    <Badge variant={record.is_tardy ? "destructive" : "default"}>
                      {record.is_tardy ? "Tardy" : "On Time"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span>Documents</span>
            <Link to={createPageUrl("StudentDocuments")}>
              <span className="text-sm text-blue-600 hover:text-blue-800 font-normal">View All</span>
            </Link>
          </h2>
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card 
                key={doc.id} 
                className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                onClick={() => setSelectedDocument(doc)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                      </div>
                      {doc.submitted_by_name && (
                        <p className="text-sm text-gray-600">From: {doc.submitted_by_name}</p>
                      )}
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedDocument && (
            <DocumentDetailModal 
              document={selectedDocument} 
              onClose={() => setSelectedDocument(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}