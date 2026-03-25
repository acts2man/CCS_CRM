import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Calendar, Mail, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTeacherId } from "@/lib/useTeacherId";

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const { teacherId, teacher, loading: teacherLoading } = useTeacherId();
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  // Build nav URL preserving teacherId param
  const navUrl = (href) => {
    const base = `/${href}`;
    return teacherId && new URLSearchParams(location.search).get('teacherId') 
      ? `${base}?teacherId=${teacherId}` 
      : base;
  };

  useEffect(() => {
    if (teacherLoading) return;
    loadTeacherClasses();
  }, [teacherId, teacherLoading]);

  const loadTeacherClasses = async () => {
    setLoading(true);
    try {
      if (!teacherId) {
        console.warn('[TeacherClasses] No teacherId from hook');
        setClasses([]);
        return;
      }
      console.log('[TeacherClasses] Loading classes for teacherId:', teacherId);
      const allClasses = await base44.entities.ClassSection.list();
      
      // DEBUG: Data integrity check
      console.log('[TeacherClasses] Total ClassSections in database:', allClasses.length);
      console.log('[TeacherClasses] Sample ClassSection:', allClasses[0]);
      console.log('[TeacherClasses] All unique teacher_ids in ClassSections:', [...new Set(allClasses.map(c => c.teacher_id))]);
      
      const filtered = allClasses.filter(c => c.teacher_id === teacherId);
      console.log('[TeacherClasses] Found', filtered.length, 'classes for teacher', teacherId);
      if (filtered.length === 0) {
        console.warn('[TeacherClasses] ⚠️ NO CLASSES FOUND - Possible data sync issue');
        console.log('[TeacherClasses] Classes with ANY teacher_id:', allClasses.filter(c => c.teacher_id));
      }
      setClasses(filtered);
    } catch (error) {
      console.error("Error loading teacher classes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Teacher Profile Header */}
      {teacher && (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {teacher?.avatar ? (
                <img 
                  src={teacher.avatar} 
                  alt={`${teacher.first_name} ${teacher.last_name}`}
                  className="h-24 w-24 rounded-lg object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-gray-300 flex items-center justify-center border-4 border-white shadow-md">
                  <User className="h-12 w-12 text-gray-500" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{teacher?.first_name} {teacher?.last_name}</h1>
                <p className="text-lg text-gray-600 mt-1">{teacher?.department || 'Teacher'}</p>
                {teacher?.id && (
                  <p className="text-sm text-gray-500 mt-2">Teacher ID: <span className="font-mono font-semibold">{teacher.id}</span></p>
                )}
                {teacher?.email && (
                  <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {teacher.email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
        <p className="text-gray-600 mt-2">Manage your class sections and students</p>
      </div>

      {(loading || teacherLoading) ? (
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
             <Link key={cls.id} to={navUrl("TeacherGradebook")}>
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