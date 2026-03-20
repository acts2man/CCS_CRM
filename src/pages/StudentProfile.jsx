import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Pencil, 
  Mail, 
  FileText, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  BookOpen, 
  User,
  CalendarDays,
  MapPin,
  AlertTriangle,
  Phone,
  Loader2
} from "lucide-react";
import EditStudentModal from "@/components/students/EditStudentModal";
import ClassEnrollmentTab from "@/components/students/ClassEnrollmentTab";
import MedicalNotesTab from "@/components/students/MedicalNotesTab";
import ParentProfileTab from "@/components/students/ParentProfileTab";
import StudentBillingTab from "@/components/students/StudentBillingTab";

export default function StudentProfile() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [parents, setParents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [studentDocs, setStudentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('id');

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      const [studentData, gradesData, attendanceData, documentsData, parentsData, studentDocsData] = await Promise.all([
        base44.entities.Student.filter({ id: studentId }),
        base44.entities.Grade.filter({ student_id: studentId }),
        base44.entities.Attendance.filter({ student_id: studentId }),
        base44.entities.Document.filter({ student_id: studentId }),
        base44.entities.Parent.list(),
        base44.entities.StudentDocument.filter({ student_id: studentId }, '-created_date', 50),
      ]);

      if (studentData.length > 0) {
        setStudent(studentData[0]);
        
        // Filter parents associated with this student
        const studentParents = parentsData.filter(parent => 
          parent.student_ids?.includes(studentId)
        );
        setParents(studentParents);
      }
      
      setGrades(gradesData);
      setAttendance(attendanceData);
      setDocuments(documentsData);
      setStudentDocs(studentDocsData);
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentUpdated = () => {
    loadStudentData();
    setShowEditModal(false);
  };

  const calculateGPA = () => {
    if (grades.length === 0) return "0.00";
    const total = grades.reduce((sum, grade) => sum + (grade.grade_value || 0), 0);
    return (total / grades.length).toFixed(2);
  };

  const calculateAttendanceRate = () => {
    if (attendance.length === 0) return "0.0";
    const present = attendance.filter(a => a.status === 'present').length;
    return ((present / attendance.length) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Student Not Found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            <img 
              src={student.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.first_name}`} 
              alt={`${student.first_name} ${student.last_name}`}
              className="w-full h-full object-cover object-top"
              style={{ objectPosition: 'center 15%' }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{student.first_name} {student.last_name}</h1>
            <p className="text-gray-600">Grade {student.grade_level}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowEditModal(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Student
          </Button>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Contact Parent
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Current GPA</div>
                <div className="text-2xl font-bold">{calculateGPA()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Attendance Rate</div>
                <div className="text-2xl font-bold">{calculateAttendanceRate()}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Grades</div>
                <div className="text-2xl font-bold">{grades.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Enrollment Date</div>
                <div className="text-sm font-semibold">
                  {student.enrollment_date 
                    ? new Date(student.enrollment_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: '2-digit', 
                        year: 'numeric' 
                      })
                    : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollment">Class Enrollment</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="parents">Parents</TabsTrigger>
          <TabsTrigger value="medical">Medical Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Information */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-4">Student Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Full Name</div>
                      <div className="font-medium">{student.first_name} {student.last_name}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Date of Birth</div>
                      <div className="font-medium">
                        {student.date_of_birth 
                          ? new Date(student.date_of_birth).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: '2-digit', 
                              year: 'numeric' 
                            })
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Address</div>
                      <div className="font-medium">{student.address || 'N/A'}</div>
                    </div>
                  </div>

                  {student.medical_notes && (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Allergies</div>
                        <Badge variant="destructive" className="bg-red-500">
                          {student.medical_notes}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-4">Emergency Contacts</h2>
                
                {parents.length === 0 ? (
                  <p className="text-gray-500">No emergency contacts available.</p>
                ) : (
                  <div className="space-y-4">
                    {parents.map((parent) => (
                      <div key={parent.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{parent.first_name} {parent.last_name}</div>
                          <div className="text-sm text-gray-500">{parent.relationship || 'Parent/Guardian'}</div>
                        </div>
                        {parent.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{parent.phone}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollment" className="mt-6">
          <ClassEnrollmentTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="grades" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Academic Grades</h2>
              {grades.length === 0 ? (
                <p className="text-gray-500">No grades recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {grades.map((grade) => (
                    <div key={grade.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{grade.subject}</div>
                        <div className="text-sm text-gray-600">{grade.assignment_name}</div>
                      </div>
                      <div className="text-lg font-bold">{grade.grade_value}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Attendance Records</h2>
              {attendance.length === 0 ? (
                <p className="text-gray-500">No attendance records found.</p>
              ) : (
                <div className="space-y-2">
                  {attendance.map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{record.date}</div>
                      </div>
                      <Badge className={
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        record.status === 'tardy' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Documents & Reports</h2>
              {studentDocs.length === 0 && documents.length === 0 ? (
                <p className="text-gray-500">No documents on file for this student.</p>
              ) : (
                <div className="space-y-2">
                  {studentDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-500" />
                        <div>
                          <div className="font-medium">{doc.title}</div>
                          <div className="text-xs text-gray-500">
                            By {doc.submitted_by_name || doc.submitted_by}
                            {doc.created_date && ` · ${new Date(doc.created_date).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      <Badge className={
                        doc.parent_acknowledged ? 'bg-green-100 text-green-800' :
                        doc.parent_notified ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }>
                        {doc.parent_acknowledged ? 'Acknowledged' : doc.parent_notified ? 'Parent Notified' : 'Submitted'}
                      </Badge>
                    </div>
                  ))}
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-gray-600">{doc.file_type}</div>
                        </div>
                      </div>
                      {doc.file_url && (
                        <Button variant="ghost" size="sm" onClick={() => window.open(doc.file_url, '_blank')}>View</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <StudentBillingTab studentId={studentId} studentName={`${student.first_name} ${student.last_name}`} />
        </TabsContent>

        <TabsContent value="medical" className="mt-6">
          <MedicalNotesTab student={student} onStudentUpdated={loadStudentData} />
        </TabsContent>
      </Tabs>

      <EditStudentModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        student={student}
        onStudentUpdated={handleStudentUpdated}
      />
    </div>
  );
}