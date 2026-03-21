import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Clock } from "lucide-react";

export default function StudentSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const user = await base44.auth.me();
      
      // Get student record
      const students = await base44.entities.Student.filter({ email: user.email });
      if (students.length === 0) return;
      
      setStudent(students[0]);

      // Get all classes
      const classes = await base44.entities.ClassSection.list();
      
      // Filter classes where student is enrolled
      const enrolledClasses = classes.filter(c => 
        c.student_ids?.includes(students[0].id)
      );

      // Get all subjects
      const allSubjects = await base44.entities.Subject.list();
      
      // Map classes to include subject info
      const subjectsData = enrolledClasses.map(cls => {
        const classSubjects = allSubjects.filter(s => s.class_section_id === cls.id);
        return {
          ...cls,
          subjects: classSubjects
        };
      });

      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error loading subjects:", error);
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
        <h1 className="text-3xl font-bold text-gray-900">My Subjects</h1>
        <p className="text-gray-600 mt-1">View all your enrolled classes and subjects</p>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No subjects enrolled yet.</p>
            </CardContent>
          </Card>
        ) : (
          subjects.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{cls.name}</CardTitle>
                <div className="text-sm text-gray-600 mt-2">
                  {cls.teacher_name && (
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {cls.teacher_name}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {cls.period && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{cls.period}</span>
                  </div>
                )}
                
                {cls.room_number && (
                  <div className="text-sm">
                    <span className="text-gray-600">Room </span>
                    <Badge variant="outline">{cls.room_number}</Badge>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-2">Grade Level</p>
                  <Badge className="bg-blue-100 text-blue-800">Grade {cls.grade_level}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}