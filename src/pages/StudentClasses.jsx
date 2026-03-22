import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, User, Clock, MapPin, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { useImpersonation } from "@/lib/ImpersonationContext";

export default function StudentClasses() {
  const { impersonatedStudent } = useImpersonation();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClass, setExpandedClass] = useState(null);

  useEffect(() => { loadClasses(); }, [impersonatedStudent]);

  const loadClasses = async () => {
    try {
      let studentRecord;
      if (impersonatedStudent) {
        studentRecord = impersonatedStudent;
      } else {
        const user = await base44.auth.me();
        const students = await base44.entities.Student.filter({ email: user.email });
        if (students.length === 0) return;
        studentRecord = students[0];
      }

      const [allClasses, allSubjects, allTeachers] = await Promise.all([
        base44.entities.ClassSection.list(),
        base44.entities.Subject.list(),
        base44.entities.Teacher.list(),
      ]);

      const enrolled = allClasses.filter(c => c.student_ids?.includes(studentRecord.id));

      const enriched = enrolled.map(cls => {
        const subjects = allSubjects.filter(s => s.class_section_id === cls.id);
        const teacher = cls.teacher_id ? allTeachers.find(t => t.id === cls.teacher_id) : null;
        return { ...cls, subjects, teacher };
      });

      setClasses(enriched);
      if (enriched.length > 0) setExpandedClass(enriched[0].id);
    } catch (error) {
      console.error("Error loading classes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-500 text-sm mt-1">Your enrolled classes, subjects & teachers</p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No classes enrolled yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => {
            const isOpen = expandedClass === cls.id;
            return (
              <Card key={cls.id} className="overflow-hidden">
                {/* Class header — always visible */}
                <button
                  className="w-full text-left px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedClass(isOpen ? null : cls.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{cls.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {cls.teacher_name || 'No teacher assigned'}
                        {cls.period ? ` · Period ${cls.period}` : ''}
                        {cls.room_number ? ` · Room ${cls.room_number}` : ''}
                      </p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <CardContent className="pt-0 pb-4 border-t bg-gray-50">
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Subjects */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Subjects</p>
                        {cls.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {cls.subjects.map(s => (
                              <Badge key={s.id} variant="secondary">{s.name}</Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No subjects listed</p>
                        )}
                      </div>

                      {/* Teacher info */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Teacher</p>
                        {cls.teacher ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-800">
                                {cls.teacher.first_name} {cls.teacher.last_name}
                              </span>
                            </div>
                            {cls.teacher.email && (
                              <a href={`mailto:${cls.teacher.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                <Mail className="h-3.5 w-3.5" />
                                {cls.teacher.email}
                              </a>
                            )}
                            {cls.teacher.phone && (
                              <a href={`tel:${cls.teacher.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                <Phone className="h-3.5 w-3.5" />
                                {cls.teacher.phone}
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No teacher assigned</p>
                        )}
                      </div>
                    </div>

                    {/* Schedule details */}
                    {(cls.period || cls.room_number || cls.grade_level) && (
                      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
                        {cls.grade_level && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <BookOpen className="h-3.5 w-3.5" /> Grade {cls.grade_level}
                          </span>
                        )}
                        {cls.period && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3.5 w-3.5" /> Period {cls.period}
                          </span>
                        )}
                        {cls.room_number && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3.5 w-3.5" /> Room {cls.room_number}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}