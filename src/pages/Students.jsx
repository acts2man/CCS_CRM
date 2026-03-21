import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, FileText, Eye, Edit, Trash, Phone, MapPin, Loader2 } from "lucide-react";
import AddStudentModal from "@/components/students/AddStudentModal";
import EditStudentModal from "@/components/students/EditStudentModal";
import { useImpersonation } from "@/lib/ImpersonationContext";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
    loadStudents();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await base44.entities.Student.list('-created_date', 500);
      setStudents(data);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentAdded = () => {
    loadStudents();
    setShowAddModal(false);
  };

  const handleStudentUpdated = () => {
    loadStudents();
    setShowEditModal(false);
    setSelectedStudent(null);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await base44.entities.Student.delete(studentId);
        loadStudents();
      } catch (error) {
        console.error("Error deleting student:", error);
      }
    }
  };

  const grades = Array.from(new Set(students.map(s => s.grade_level))).sort();
  
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === "" || 
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === null || student.grade_level === filterGrade;
    
    return matchesSearch && matchesGrade;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading students...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-gray-500">Manage student profiles and information</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Student
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search students..."
            className="pl-8 w-full max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           {user?.role !== 'teacher' && (
             <select
               className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm"
               value={filterGrade || ""}
               onChange={(e) => setFilterGrade(e.target.value || null)}
             >
               <option value="">All Grades</option>
               {grades.map((grade) => (
                 <option key={grade} value={grade}>Grade {grade}</option>
               ))}
             </select>
           )}
           <Button variant="outline">Export</Button>
         </div>
      </div>

      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No students found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Link key={student.id} to={createPageUrl(`StudentProfile?id=${student.id}`)} className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      <img 
                        src={student.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.first_name}`} 
                        alt={`${student.first_name} ${student.last_name}`}
                        className="w-full h-full object-cover object-top"
                        style={{ objectPosition: 'center 15%' }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{student.first_name} {student.last_name}</CardTitle>
                      <p className="text-sm text-gray-500">Grade {student.grade_level}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleEditStudent(student); }}>
                        <Edit className="mr-2 h-4 w-4" /><span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={(e) => { e.preventDefault(); handleDeleteStudent(student.id); }}
                      >
                        <Trash className="mr-2 h-4 w-4" /><span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {student.email && (
                    <div className="text-sm text-gray-600 truncate">{student.email}</div>
                  )}
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  {student.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="truncate">{student.address}</span>
                    </div>
                  )}
                  <div>
                    <Badge className={
                      student.enrollment_status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }>
                      {student.enrollment_status || 'active'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Showing {filteredStudents.length} of {students.length} students</span>
      </div>

      <AddStudentModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        onStudentAdded={handleStudentAdded}
      />
      <EditStudentModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        student={selectedStudent}
        onStudentUpdated={handleStudentUpdated}
      />
    </div>
  );
}