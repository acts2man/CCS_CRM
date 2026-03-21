import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import ParentDashboard from "@/components/dashboard/ParentDashboard";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import ParentLayout from "@/components/layouts/ParentLayout";
import { useImpersonation } from "@/lib/ImpersonationContext";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { impersonatedTeacher, viewMode } = useImpersonation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      // Check if user has a matching Teacher record
      const teachers = await base44.entities.Teacher.filter({ email: currentUser.email }, '', 1);
      if (teachers && teachers.length > 0) {
        // If Teacher record exists, treat as teacher
        currentUser.role = 'teacher';
      }
      
      setUser(currentUser);
    } catch (err) {
      console.error("Error loading user:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-4">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          <p className="text-lg font-medium">Loading your dashboard...</p>
        </div>
        <Skeleton className="h-8 w-48 bg-gray-200" />
        <Skeleton className="h-6 w-72 bg-gray-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg bg-gray-200" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg bg-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6 bg-red-50 rounded-lg">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <h2 className="text-xl font-bold text-red-800 mb-2">Authentication Error</h2>
        <p className="text-red-700 mb-4 text-center max-w-md">
          We encountered a problem loading your dashboard.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // If admin is impersonating someone, use the viewMode to determine what to show
  if (impersonatedTeacher && viewMode === 'teacher') {
    return <TeacherDashboard impersonatedTeacher={impersonatedTeacher} />;
  }
  
  if (impersonatedTeacher && viewMode === 'student') {
    return <StudentDashboard />;
  }

  if (impersonatedTeacher && viewMode === 'parent') {
    return <ParentLayout><ParentDashboard /></ParentLayout>;
  }

  // Normal user viewing - show based on their actual role
  switch (user?.role) {
    case "admin":
      return <AdminDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "parent":
      return <ParentLayout><ParentDashboard /></ParentLayout>;
    case "student":
      return <StudentDashboard />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-yellow-50 p-6 rounded-lg">
          <AlertCircle className="h-12 w-12 text-yellow-600 mb-4" />
          <h2 className="text-xl font-bold text-yellow-800 mb-2">Dashboard Not Available</h2>
          <p className="text-center mb-4">
            We couldn't determine your user role.
          </p>
        </div>
      );
  }
}