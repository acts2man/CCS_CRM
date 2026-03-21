import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getParentByUserEmail, getStudentsForParent } from "@/lib/entitySyncUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function ParentAssignments() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      const user = await base44.auth.me();
      
      // Use utility to get students associated with this parent by email
      const myChildren = await getParentStudents(user.email);
      
      setChildren(myChildren);
      if (myChildren.length > 0) {
        setSelectedChild(myChildren[0]);
        loadChildAssignments(myChildren[0].id);
      }
    } catch (error) {
      console.error("Error loading parent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildAssignments = async (studentId) => {
    try {
      const [allAssignments, assignmentGrades, classSections] = await Promise.all([
        base44.entities.Assignment.list(),
        base44.entities.AssignmentGrade.filter({ student_id: studentId }),
        base44.entities.ClassSection.list()
      ]);

      // Map assignments with grades and status
      const assignmentsWithStatus = allAssignments.map(assignment => {
        const grade = assignmentGrades.find(g => g.assignment_id === assignment.id);
        const classSection = classSections.find(c => c.id === assignment.class_section_id);
        const dueDate = new Date(assignment.due_date);
        const today = new Date();
        const isOverdue = dueDate < today && grade?.status !== 'graded';

        return {
          ...assignment,
          className: classSection?.name,
          grade,
          status: grade?.status || 'missing',
          isOverdue,
          points: grade?.points_earned || 0,
          percentage: grade?.percentage || 0
        };
      });

      setAssignments(assignmentsWithStatus);
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  };

  const getStatusIcon = (status, isOverdue) => {
    if (isOverdue) return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (status === 'graded') return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <Clock className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue) return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    if (status === 'graded') return <Badge className="bg-green-100 text-green-800">Graded</Badge>;
    if (status === 'turned_in') return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'graded') return a.status === 'graded';
    if (filter === 'pending') return a.status !== 'graded';
    if (filter === 'overdue') return a.isOverdue;
    return true;
  });

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Children's Assignments</h1>
        <p className="text-gray-600 mt-1">Track coursework and grades</p>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => {
                setSelectedChild(child);
                loadChildAssignments(child.id);
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedChild?.id === child.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {child.first_name} {child.last_name}
            </button>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'pending', 'graded', 'overdue'].map(filterOption => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded-lg transition-colors capitalize ${
              filter === filterOption
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            {filterOption}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No assignments found.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map(assignment => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(assignment.status, assignment.isOverdue)}
                      <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{assignment.className}</p>
                    {assignment.due_date && (
                      <p className="text-xs text-gray-500">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {assignment.grade ? (
                      <div className="space-y-2">
                        <Badge className="bg-blue-100 text-blue-800 text-base">
                          {assignment.percentage.toFixed(1)}%
                        </Badge>
                        <p className="text-xs text-gray-600">
                          {assignment.points}/{assignment.points_possible || 'N/A'}
                        </p>
                      </div>
                    ) : (
                      <div>{getStatusBadge(assignment.status, assignment.isOverdue)}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}