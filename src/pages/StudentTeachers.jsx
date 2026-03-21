import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, User } from "lucide-react";
import { useImpersonation } from "@/lib/ImpersonationContext";

export default function StudentTeachers() {
  const { impersonatedStudent } = useImpersonation();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeachers();
  }, [impersonatedStudent]);

  const loadTeachers = async () => {
    try {
      const user = await base44.auth.me();
      
      // Get student record
      const students = await base44.entities.Student.filter({ email: user.email });
      if (students.length === 0) return;
      
      const studentId = students[0].id;

      // Get enrolled classes
      const classes = await base44.entities.ClassSection.list();
      const enrolledClasses = classes.filter(c => c.student_ids?.includes(studentId));

      // Get all teachers
      const allTeachers = await base44.entities.Teacher.list();

      // Map teachers to their classes
      const teachersMap = new Map();
      enrolledClasses.forEach(cls => {
        if (cls.teacher_id) {
          const teacher = allTeachers.find(t => t.id === cls.teacher_id);
          if (teacher) {
            if (!teachersMap.has(cls.teacher_id)) {
              teachersMap.set(cls.teacher_id, {
                ...teacher,
                classes: []
              });
            }
            teachersMap.get(cls.teacher_id).classes.push(cls.name);
          }
        }
      });

      setTeachers(Array.from(teachersMap.values()));
    } catch (error) {
      console.error("Error loading teachers:", error);
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
        <h1 className="text-3xl font-bold text-gray-900">My Teachers</h1>
        <p className="text-gray-600 mt-1">Contact information for your instructors</p>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No teachers assigned yet.</p>
            </CardContent>
          </Card>
        ) : (
          teachers.map((teacher) => (
            <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">
                  {teacher.first_name} {teacher.last_name}
                </CardTitle>
                {teacher.department && (
                  <Badge variant="outline" className="w-fit mt-2">
                    {teacher.department}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Classes */}
                {teacher.classes && teacher.classes.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-2">TEACHES</p>
                    <div className="space-y-1">
                      {teacher.classes.map((className, idx) => (
                        <Badge key={idx} variant="secondary" className="mr-2 mb-2">
                          {className}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-3 pt-4 border-t">
                  {teacher.email && (
                    <a 
                      href={`mailto:${teacher.email}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Mail className="h-4 w-4" />
                      {teacher.email}
                    </a>
                  )}
                  {teacher.phone && (
                    <a 
                      href={`tel:${teacher.phone}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Phone className="h-4 w-4" />
                      {teacher.phone}
                    </a>
                  )}
                  {!teacher.email && !teacher.phone && (
                    <p className="text-xs text-gray-500">No contact information available</p>
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