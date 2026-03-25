import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
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
  Loader2,
  ChevronDown,
  ArrowLeft
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ClassEnrollmentTab from "@/components/students/ClassEnrollmentTab";
import MedicalNotesTab from "@/components/students/MedicalNotesTab";
import ParentProfileTab from "@/components/students/ParentProfileTab";
import StudentBillingTab from "@/components/students/StudentBillingTab";
import DocumentDetailModal from "@/components/students/DocumentDetailModal";
import ContactCard from "@/components/students/ContactCard";
import QuickCommunicationModal from "@/components/students/QuickCommunicationModal";
import CommunicationHistoryTab from "@/components/students/CommunicationHistoryTab";

export default function TeacherStudentProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState(null);
  const [parents, setParents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [studentDocs, setStudentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [communicationType, setCommunicationType] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);

  const urlParams = new URLSearchParams(location.search);
  const studentId = urlParams.get('id');
  const teacherIdParam = urlParams.get('teacherId');

  const getNavUrl = (path) => {
    const base = `/${path}`;
    return teacherIdParam ? `${base}?teacherId=${teacherIdParam}` : base;
  };

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      const [studentData, gradesData, attendanceData, parentsData, studentDocsData] = await Promise.all([
        base44.entities.Student.filter({ id: studentId }),
        base44.entities.Grade.filter({ student_id: studentId }),
        base44.entities.Attendance.filter({ student_id: studentId }),
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
      setStudentDocs(studentDocsData);
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            <img 
              src={student.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.first_name}`} 
              alt={`${student.first_name} ${student.last_name}`}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 15%' }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{student.first_name} {student.last_name}</h1>
            <p className="text-gray-600">Grade {student.grade_level}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={parents.length === 0}>
                <Mail className="h-4 w-4 mr-2" />
                Contact Parent
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!parents[0]?.email}
                onClick={() => { setSelectedParent(parents[0]); setCommunicationType('email'); }}
              >
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!parents[0]?.phone}
                onClick={() => { setSelectedParent(parents[0]); setCommunicationType('sms'); }}
              >
                Send SMS
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="parents">Parents</TabsTrigger>
          <TabsTrigger value="medical">Medical Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Contact Information */}
          <ContactCard
            student={student}
            parents={parents}
            onEmailClick={(parent) => {
              setSelectedParent(parent);
              setCommunicationType('email');
            }}
            onSMSClick={(parent) => {
              setSelectedParent(parent);
              setCommunicationType('sms');
            }}
          />

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
              {studentDocs.length === 0 ? (
                <p className="text-gray-500">No documents on file for this student.</p>
              ) : (
                <div className="space-y-2">
                  {studentDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setSelectedDoc(doc)}
                    >
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="mt-6">
          <CommunicationHistoryTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="parents" className="mt-6">
          <ParentProfileTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="medical" className="mt-6">
          <MedicalNotesTab student={student} onStudentUpdated={loadStudentData} readOnly={true} />
        </TabsContent>
      </Tabs>

      <DocumentDetailModal
        doc={selectedDoc}
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      <QuickCommunicationModal
        open={!!communicationType}
        onOpenChange={(open) => {
          if (!open) {
            setCommunicationType(null);
            setSelectedParent(null);
          }
        }}
        type={communicationType}
        parent={selectedParent}
        student={student}
      />
    </div>
  );
}