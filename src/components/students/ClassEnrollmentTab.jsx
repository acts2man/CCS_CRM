import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, BookOpen, ChevronDown, ChevronRight } from "lucide-react";

const CURRENT_YEAR = "2025-2026";
const SCHOOL_YEARS = ["2026-2027", "2025-2026", "2024-2025", "2023-2024", "2022-2023"];

export default function ClassEnrollmentTab({ studentId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedYears, setExpandedYears] = useState({ [CURRENT_YEAR]: true });
  const [newClass, setNewClass] = useState({ class_name: "", school_year: CURRENT_YEAR, subject: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEnrollments();
  }, [studentId]);

  const loadEnrollments = async () => {
    try {
      const data = await base44.entities.ClassEnrollment.filter({ student_id: studentId }, '-school_year', 200);
      setEnrollments(data);
    } catch (error) {
      console.error("Error loading enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClass.class_name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.ClassEnrollment.create({ ...newClass, student_id: studentId });
      setNewClass({ class_name: "", school_year: CURRENT_YEAR, subject: "" });
      setShowAddForm(false);
      await loadEnrollments();
    } catch (error) {
      console.error("Error adding class:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (enrollmentId) => {
    if (!window.confirm("Remove this class?")) return;
    try {
      await base44.entities.ClassEnrollment.delete(enrollmentId);
      await loadEnrollments();
    } catch (error) {
      console.error("Error deleting enrollment:", error);
    }
  };

  const toggleYear = (year) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  // Group enrollments by school year
  const byYear = enrollments.reduce((acc, e) => {
    if (!acc[e.school_year]) acc[e.school_year] = [];
    acc[e.school_year].push(e);
    return acc;
  }, {});

  const sortedYears = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  if (loading) return <div className="text-gray-500 py-8 text-center">Loading enrollments...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Class Enrollment</h2>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" /> Add Class
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <form onSubmit={handleAddClass} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Class Name *</Label>
                  <Input
                    placeholder="e.g., English 11"
                    value={newClass.class_name}
                    onChange={(e) => setNewClass(prev => ({ ...prev, class_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input
                    placeholder="e.g., English"
                    value={newClass.subject}
                    onChange={(e) => setNewClass(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>School Year *</Label>
                  <Select value={newClass.school_year} onValueChange={(v) => setNewClass(prev => ({ ...prev, school_year: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SCHOOL_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? "Adding..." : "Add Class"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {sortedYears.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p>No classes enrolled yet.</p>
          <p className="text-sm">Click "Add Class" to enroll in classes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedYears.map((year) => (
            <Card key={year}>
              <CardContent className="pt-0 pb-0">
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    {expandedYears[year] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-semibold text-gray-900">{year}</span>
                    <Badge variant="secondary">{byYear[year].length} {byYear[year].length === 1 ? "class" : "classes"}</Badge>
                  </div>
                  {year === CURRENT_YEAR && <Badge className="bg-green-100 text-green-800">Current Year</Badge>}
                </button>
                {expandedYears[year] && (
                  <div className="border-t pb-4 pt-3 space-y-2">
                    {byYear[year].map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{enrollment.class_name}</div>
                            {enrollment.subject && (
                              <div className="text-xs text-gray-500">{enrollment.subject}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            enrollment.status === 'active' ? 'bg-green-100 text-green-800' :
                            enrollment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-600'
                          }>
                            {enrollment.status || 'active'}
                          </Badge>
                          <button
                            onClick={() => handleDelete(enrollment.id)}
                            className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}