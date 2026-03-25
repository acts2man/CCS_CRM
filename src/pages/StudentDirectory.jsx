import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Mail, Phone } from "lucide-react";
import { useTeacherId } from "@/lib/useTeacherId";

export default function StudentDirectory() {
  const [allStudents, setAllStudents] = useState([]);
  const [myStudents, setMyStudents] = useState([]);
  const [tab, setTab] = useState("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { teacherId, loading: teacherLoading } = useTeacherId();

  useEffect(() => {
    if (teacherLoading) return;
    loadData();
  }, [teacherId, teacherLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsData, classSections] = await Promise.all([
        base44.entities.Student.list("-created_date", 500),
        base44.entities.ClassSection.list(),
      ]);
      setAllStudents(studentsData);

      if (teacherId) {
        const myClasses = classSections.filter(c => c.teacher_id === teacherId);
        const myStudentIds = new Set();
        myClasses.forEach(c => (c.student_ids || []).forEach(id => myStudentIds.add(id)));
        setMyStudents(studentsData.filter(s => myStudentIds.has(s.id)));
      } else {
        setMyStudents(studentsData);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeList = tab === "my" ? myStudents : allStudents;

  const filtered = activeList.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-600 mt-1">Browse and search students</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("my")}
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === "my"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          My Students ({myStudents.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === "all"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All Students ({allStudents.length})
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
        <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
        />
      </div>

      <div className="text-sm text-gray-600">
        Showing {filtered.length} student{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-gray-500">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>{tab === "my" ? "No students assigned to your classes yet." : "No students found."}</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt={`${student.first_name} ${student.last_name}`}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: "center 15%" }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-600 font-semibold text-sm">
                        {student.first_name?.[0]}{student.last_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {student.first_name} {student.last_name}
                    </h3>
                    <Badge className="mt-0.5 bg-blue-100 text-blue-800 text-xs">
                      Grade {student.grade_level}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  {student.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <a href={`mailto:${student.email}`} className="hover:text-blue-600 truncate">
                        {student.email}
                      </a>
                    </div>
                  )}
                  {student.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      {student.phone}
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