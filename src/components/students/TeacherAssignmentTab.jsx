import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, X, Plus, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeacherAssignmentTab({ studentId }) {
  const [teachers, setTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, [studentId]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const [studentData, teacherData] = await Promise.all([
        base44.entities.Student.filter({ id: studentId }),
        base44.entities.Teacher.list(),
      ]);

      setAllTeachers(teacherData);

      if (studentData.length > 0 && studentData[0].teacher_ids) {
        const assignedTeachers = teacherData.filter((t) =>
          studentData[0].teacher_ids.includes(t.id)
        );
        setTeachers(assignedTeachers);
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!selectedTeacherId) return;

    setSaving(true);
    try {
      const student = await base44.entities.Student.filter({ id: studentId });
      const currentTeacherIds = student[0]?.teacher_ids || [];

      if (!currentTeacherIds.includes(selectedTeacherId)) {
        await base44.entities.Student.update(studentId, {
          teacher_ids: [...currentTeacherIds, selectedTeacherId],
        });
        
        await loadTeachers();
        setSelectedTeacherId("");
      }
    } catch (error) {
      console.error("Error adding teacher:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTeacher = async (teacherId) => {
    setSaving(true);
    try {
      const student = await base44.entities.Student.filter({ id: studentId });
      const currentTeacherIds = student[0]?.teacher_ids || [];
      const updatedIds = currentTeacherIds.filter((id) => id !== teacherId);

      await base44.entities.Student.update(studentId, {
        teacher_ids: updatedIds,
      });

      await loadTeachers();
    } catch (error) {
      console.error("Error removing teacher:", error);
    } finally {
      setSaving(false);
    }
  };

  const availableTeachers = allTeachers.filter(
    (t) => !teachers.find((assigned) => assigned.id === t.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Assigned Teachers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teachers.length === 0 ? (
            <p className="text-gray-500">No teachers assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {teacher.first_name} {teacher.last_name}
                    </div>
                    <div className="text-sm text-gray-600">{teacher.department}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTeacher(teacher.id)}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {availableTeachers.length > 0 && (
            <div className="pt-4 border-t space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Assign Teacher
                </label>
                <div className="flex gap-2">
                  <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a teacher..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name} ({teacher.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddTeacher}
                    disabled={!selectedTeacherId || saving}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}