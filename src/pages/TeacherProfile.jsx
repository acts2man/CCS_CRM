import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Mail, Phone, Calendar, Briefcase, Loader2 } from "lucide-react";
import EditTeacherModal from "@/components/teachers/EditTeacherModal";
import TimeOffHistory from "@/components/teachers/TimeOffHistory";

export default function TeacherProfile() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const teacherId = urlParams.get('id');

  useEffect(() => {
    if (teacherId) {
      loadTeacherData();
    }
  }, [teacherId]);

  const loadTeacherData = async () => {
    try {
      const teacherData = await base44.entities.Teacher.filter({ id: teacherId });

      if (teacherData.length > 0) {
        setTeacher(teacherData[0]);
      }
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherUpdated = () => {
    loadTeacherData();
    setShowEditModal(false);
  };

  const calculateYearsExperience = () => {
    if (!teacher?.employment_start) return 0;
    const startDate = new Date(teacher.employment_start);
    const today = new Date();
    const years = today.getFullYear() - startDate.getFullYear();
    return years;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Teacher Not Found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teachers
        </Button>
        
        <Button 
          onClick={() => setShowEditModal(true)}
          className="bg-slate-900 hover:bg-slate-800"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Teacher
        </Button>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-32 w-32">
                <AvatarImage 
                  src={teacher.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.first_name}`} 
                  alt={`${teacher.first_name} ${teacher.last_name}`} 
                />
                <AvatarFallback className="text-2xl">
                  {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {teacher.status !== 'Active' && (
                <Badge className="mt-2 bg-yellow-500">{teacher.status}</Badge>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{teacher.first_name} {teacher.last_name}</h1>
                <p className="text-lg text-blue-600">{teacher.department}</p>
                {teacher.homeroom && (
                  <p className="text-gray-600">Homeroom: {teacher.homeroom}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${teacher.email}`} className="text-blue-600 hover:underline">
                    {teacher.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{teacher.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Since {teacher.employment_start ? new Date(teacher.employment_start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="h-4 w-4" />
                  <span>{calculateYearsExperience()} years experience</span>
                </div>
              </div>

              {teacher.education && (
                <div>
                  <h3 className="font-semibold mb-1">Education</h3>
                  <p className="text-gray-700">{teacher.education}</p>
                </div>
              )}

              {teacher.biography && (
                <div>
                  <h3 className="font-semibold mb-1">Biography</h3>
                  <p className="text-gray-700">{teacher.biography}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="subjects" className="w-full">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="timeoff">Time Off</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="certs">Certs</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Subjects & Grade Levels</h2>
              <p className="text-sm text-gray-600 mb-6">Subjects taught and grade levels</p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {teacher.subjects && teacher.subjects.length > 0 ? (
                      teacher.subjects.map((subject, index) => (
                        <Badge 
                          key={index} 
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1"
                        >
                          {subject}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500">No subjects assigned</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Grade Levels</h3>
                  <div className="flex flex-wrap gap-2">
                    {teacher.grade_levels && teacher.grade_levels.length > 0 ? (
                      teacher.grade_levels.map((level, index) => (
                        <Badge 
                          key={index} 
                          variant="outline"
                          className="bg-gray-50 text-gray-700 border-gray-200 px-3 py-1"
                        >
                          {level === 'K' ? 'Kindergarten' : `${level}th Grade`}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500">No grade levels assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Classes</h2>
              <p className="text-gray-500">Class information coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Activities</h2>
              <p className="text-gray-500">Activity records coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeoff" className="mt-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Time-Off Request History</h2>
            <TimeOffHistory teacherEmail={teacher.email} />
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Notes</h2>
              <p className="text-gray-500">Teacher notes coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certs" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Certifications</h2>
              {teacher.certifications && teacher.certifications.length > 0 ? (
                <div className="space-y-2">
                  {teacher.certifications.map((cert, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{cert}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No certifications listed</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditTeacherModal 
        open={showEditModal}
        onOpenChange={setShowEditModal}
        teacher={teacher}
        onTeacherUpdated={handleTeacherUpdated}
      />
    </div>
  );
}