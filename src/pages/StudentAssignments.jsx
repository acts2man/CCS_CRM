import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { isBefore } from "date-fns";
import { useImpersonation } from "@/lib/ImpersonationContext";

export default function StudentAssignments() {
  const { impersonatedStudent } = useImpersonation();
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, [impersonatedStudent]);

  useEffect(() => {
    filterAssignments();
  }, [assignments, filterStatus]);

  const loadAssignments = async () => {
    try {
      let studentId;
      
      if (impersonatedStudent) {
        studentId = impersonatedStudent.id;
      } else {
        const user = await base44.auth.me();
        const students = await base44.entities.Student.filter({ email: user.email });
        if (students.length === 0) return;
        studentId = students[0].id;
      }

      // Get enrolled classes
      const classes = await base44.entities.ClassSection.list();
      const enrolledClasses = classes.filter(c => c.student_ids?.includes(studentId));

      // Get all assignments for enrolled classes
      const allAssignments = await base44.entities.Assignment.list();
      const studentAssignments = allAssignments.filter(a => 
        enrolledClasses.some(c => c.id === a.class_section_id)
      );

      // Get grades to determine completion status
      const grades = await base44.entities.AssignmentGrade.filter({ student_id: studentId });
      const gradeMap = new Map(grades.map(g => [g.assignment_id, g]));

      // Enrich assignments with status and class info
      const enriched = studentAssignments.map(assignment => {
        const grade = gradeMap.get(assignment.id);
        const classInfo = enrolledClasses.find(c => c.id === assignment.class_section_id);
        const dueDate = new Date(assignment.due_date);
        const now = new Date();
        const isOverdue = isBefore(dueDate, now) && !grade?.graded_date;

        return {
          ...assignment,
          className: classInfo?.name || "Unknown Class",
          status: grade?.status || "missing",
          isOverdue,
          grade
        };
      });

      setAssignments(enriched);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    if (filterStatus === "all") {
      setFilteredAssignments(assignments);
    } else if (filterStatus === "pending") {
      setFilteredAssignments(assignments.filter(a => a.status !== "graded" && !a.isOverdue));
    } else if (filterStatus === "overdue") {
      setFilteredAssignments(assignments.filter(a => a.isOverdue));
    } else if (filterStatus === "completed") {
      setFilteredAssignments(assignments.filter(a => a.status === "graded"));
    }
  };

  const getStatusColor = (assignment) => {
    if (assignment.status === "graded") return "bg-green-100 text-green-800";
    if (assignment.isOverdue) return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusIcon = (assignment) => {
    if (assignment.status === "graded") return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (assignment.isOverdue) return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <Clock className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusLabel = (assignment) => {
    if (assignment.status === "graded") return "Graded";
    if (assignment.isOverdue) return "Overdue";
    return "Pending";
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-600 mt-1">Track your assignments and deadlines</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "overdue", label: "Overdue" },
          { value: "completed", label: "Completed" }
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === filter.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">No assignments found.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(assignment)}
                      <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{assignment.className}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getStatusColor(assignment)}>
                        {getStatusLabel(assignment)}
                      </Badge>
                      {assignment.due_date && (
                        <Badge variant="outline" className="text-xs">
                          Due {format(new Date(assignment.due_date), "MMM d, yyyy")}
                        </Badge>
                      )}
                      {assignment.points_possible && (
                        <Badge variant="outline" className="text-xs">
                          {assignment.points_possible} pts
                        </Badge>
                      )}
                    </div>
                  </div>
                  {assignment.grade?.percentage && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{assignment.grade.percentage}%</p>
                      <p className="text-xs text-gray-600">Score</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}