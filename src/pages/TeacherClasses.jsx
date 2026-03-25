import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getTeacherByUserEmail } from "@/lib/entitySyncUtils";
import { useImpersonation } from "@/lib/ImpersonationContext";

export default function TeacherClasses() {
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { impersonatedTeacher } = useImpersonation();

  useEffect(() => {
    loadTeacherClasses();
  }, [impersonatedTeacher]);

  const loadTeacherClasses = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Priority: URL param > impersonation context > user's own email
      const urlParams = new URLSearchParams(window.location.search);
      let teacherId = urlParams.get('teacherId') || impersonatedTeacher?.id;

      if (!teacherId) {
        const { teacher, error } = await getTeacherByUserEmail(currentUser.email);
        if (error || !teacher) {
          console.error("Teacher sync error:", error);
          return;
        }
        teacherId = teacher.id;
      }

      const allClasses = await base44.entities.ClassSection.list();
      const teacherClasses = allClasses.filter(c => c.teacher_id === teacherId);
      setClasses(teacherClasses);
    } catch (error) {
      console.error("Error loading teacher classes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-2">Manage your class sections and students</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No classes assigned yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Link key={cls.id} to={createPageUrl("TeacherGradebook")}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Grade {cls.grade_level}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {cls.student_ids?.length || 0} Students
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {cls.period || "—"}
                  </div>
                  {cls.room_number && (
                    <div className="text-sm text-gray-600">
                      Room {cls.room_number}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}