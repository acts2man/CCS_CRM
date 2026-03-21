import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Trash2, Plus, Loader2, GraduationCap, ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

function TeacherClassPicker({ allClasses, enrolledClassIds, saving, onToggle, onClose, schoolYear }) {
  const [expandedTeachers, setExpandedTeachers] = useState({});

  // Group all classes by teacher
  const byTeacher = allClasses.reduce((acc, cls) => {
    const key = cls.teacher_name || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(cls);
    return acc;
  }, {});

  const toggleTeacher = (name) => {
    setExpandedTeachers(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-4">
        <p className="text-sm font-medium text-blue-900 mb-3">Select classes by teacher:</p>
        {Object.keys(byTeacher).length === 0 ? (
          <p className="text-sm text-gray-500">No classes available for {schoolYear}.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(byTeacher).map(([teacherName, classes]) => {
              const isOpen = expandedTeachers[teacherName];
              const enrolledCount = classes.filter(c => enrolledClassIds.includes(c.id)).length;
              return (
                <div key={teacherName} className="bg-white rounded-lg border overflow-hidden">
                  <button
                    onClick={() => toggleTeacher(teacherName)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="font-medium text-sm">{teacherName}</span>
                      <span className="text-xs text-gray-400">{classes.length} {classes.length === 1 ? "class" : "classes"}</span>
                      {enrolledCount > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{enrolledCount} enrolled</span>
                      )}
                    </div>
                    {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="border-t divide-y">
                      {classes.map(cls => {
                        const isEnrolled = enrolledClassIds.includes(cls.id);
                        return (
                          <div key={cls.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                            <Checkbox
                              id={`cls-${cls.id}`}
                              checked={isEnrolled}
                              onCheckedChange={() => onToggle(cls)}
                              disabled={saving}
                            />
                            <label htmlFor={`cls-${cls.id}`} className="flex-1 cursor-pointer">
                              <div className="text-sm font-medium">{cls.name}</div>
                              <div className="text-xs text-gray-500">Grade {cls.grade_level}{cls.period ? ` · Period ${cls.period}` : ""}</div>
                            </label>
                            {isEnrolled && <span className="text-xs text-green-600 font-medium">Enrolled</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex justify-end mt-3">
          <Button size="sm" variant="outline" onClick={onClose}>Done</Button>
        </div>
      </CardContent>
    </Card>
  );
}

const CURRENT_YEAR = "2025-2026";

export default function ClassEnrollmentTab({ studentId }) {
  const [allClasses, setAllClasses] = useState([]);
  const [enrolledClassIds, setEnrolledClassIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [schoolYear, setSchoolYear] = useState(CURRENT_YEAR);

  useEffect(() => { loadData(); }, [studentId, schoolYear]);

  const loadData = async () => {
    setLoading(true);
    const classes = await base44.entities.ClassSection.filter({ school_year: schoolYear, is_active: true });
    setAllClasses(classes);

    // Which classes already have this student enrolled?
    const enrolled = classes.filter(c => (c.student_ids || []).includes(studentId)).map(c => c.id);
    setEnrolledClassIds(enrolled);
    setLoading(false);
  };

  const toggleEnrollment = async (cls) => {
    setSaving(true);
    const currentIds = cls.student_ids || [];
    const isEnrolled = currentIds.includes(studentId);
    const updatedIds = isEnrolled
      ? currentIds.filter(id => id !== studentId)
      : [...currentIds, studentId];

    await base44.entities.ClassSection.update(cls.id, { student_ids: updatedIds });
    await loadData();
    setSaving(false);
  };

  const enrolledClasses = allClasses.filter(c => enrolledClassIds.includes(c.id));
  const unenrolledClasses = allClasses.filter(c => !enrolledClassIds.includes(c.id));

  if (loading) return <div className="text-gray-500 py-8 text-center flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Class Enrollment</h2>
          <p className="text-sm text-gray-500">Manage which teacher classes this student is enrolled in</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={schoolYear}
            onChange={e => setSchoolYear(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 bg-white"
          >
            {["2026-2027", "2025-2026", "2024-2025"].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button size="sm" onClick={() => setShowPicker(!showPicker)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" /> Enroll
          </Button>
        </div>
      </div>

      {/* Enrollment picker */}
      {showPicker && (
        <TeacherClassPicker
          allClasses={allClasses}
          enrolledClassIds={enrolledClassIds}
          saving={saving}
          onToggle={toggleEnrollment}
          onClose={() => setShowPicker(false)}
          schoolYear={schoolYear}
        />
      )}

      {/* Currently enrolled */}
      {enrolledClasses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p>Not enrolled in any classes for {schoolYear}.</p>
          <p className="text-sm">Click "Enroll" to add classes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {enrolledClasses.map(cls => (
            <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">{cls.name}</div>
                  <div className="text-xs text-gray-500">{cls.teacher_name || "No teacher"} · Grade {cls.grade_level}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Enrolled</Badge>
                <button
                  onClick={() => toggleEnrollment(cls)}
                  disabled={saving}
                  className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}