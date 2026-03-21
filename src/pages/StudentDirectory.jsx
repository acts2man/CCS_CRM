import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Mail, Phone } from "lucide-react";

export default function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, filterGrade]);

  const loadStudents = async () => {
    try {
      const allStudents = await base44.entities.Student.list();
      setStudents(allStudents);

      // Get unique grade levels
      const uniqueGrades = [...new Set(allStudents.map(s => s.grade_level))].sort();
      setGrades(uniqueGrades);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterGrade !== "all") {
      filtered = filtered.filter((s) => s.grade_level === filterGrade);
    }

    setFilteredStudents(filtered);
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Student Directory</h1>
        <p className="text-gray-600 mt-2">Browse and search all students</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterGrade("all")}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filterGrade === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            All Grades
          </button>
          {grades.map((grade) => (
            <button
              key={grade}
              onClick={() => setFilterGrade(grade)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filterGrade === grade
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Grade {grade}
            </button>
          ))}
        </div>
      </div>

      {/* Student Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredStudents.length} of {students.length} students
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-gray-500">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>No students found matching your search.</p>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {student.first_name} {student.last_name}
                    </h3>
                    <Badge className="mt-1 bg-blue-100 text-blue-800">
                      Grade {student.grade_level}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${student.email}`} className="hover:text-blue-600">
                        {student.email}
                      </a>
                    </div>

                    {student.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        {student.phone}
                      </div>
                    )}
                  </div>

                  {student.enrollment_status && (
                    <div>
                      <Badge
                        variant={student.enrollment_status === "active" ? "default" : "outline"}
                        className="capitalize"
                      >
                        {student.enrollment_status}
                      </Badge>
                    </div>
                  )}

                  {student.address && (
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      {student.address}
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