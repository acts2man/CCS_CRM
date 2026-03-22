import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Briefcase, User } from "lucide-react";
import { getTeacherByUserEmail } from "@/lib/entitySyncUtils";

export default function TeacherProfile() {
  const [teacher, setTeacher] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const teachers = await base44.entities.Teacher.filter({ email: currentUser.email });
      if (teachers.length > 0) {
        setTeacher(teachers[0]);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">View your professional information</p>
      </div>

      {teacher ? (
        <div className="max-w-2xl space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Full Name</label>
                <p className="text-lg font-medium text-gray-900">
                  {teacher.first_name} {teacher.last_name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Gender</label>
                  <p className="text-gray-900 capitalize">{teacher.gender || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date of Birth</label>
                  <p className="text-gray-900">
                    {teacher.date_of_birth ? new Date(teacher.date_of_birth).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="text-gray-900">{teacher.email}</p>
                </div>
              </div>
              {teacher.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <label className="text-sm text-gray-600">Phone</label>
                    <p className="text-gray-900">{teacher.phone}</p>
                  </div>
                </div>
              )}
              {teacher.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <label className="text-sm text-gray-600">Address</label>
                    <p className="text-gray-900">{teacher.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teacher.specialization && (
                <div>
                  <label className="text-sm text-gray-600">Specialization</label>
                  <p className="text-gray-900">{teacher.specialization}</p>
                </div>
              )}
              {teacher.certification && (
                <div>
                  <label className="text-sm text-gray-600">Certification</label>
                  <p className="text-gray-900">{teacher.certification}</p>
                </div>
              )}
              {teacher.years_experience !== undefined && (
                <div>
                  <label className="text-sm text-gray-600">Years of Experience</label>
                  <p className="text-gray-900">{teacher.years_experience} years</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full">
            Edit Profile
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No teacher profile found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}