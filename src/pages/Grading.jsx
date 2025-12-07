import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, TrendingUp, BookOpen, Loader2 } from 'lucide-react';

export default function Grading() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGrades: 0,
    classAverage: 0,
    subjects: 0
  });
  const [recentGrades, setRecentGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGradingData();
  }, []);

  const loadGradingData = async () => {
    try {
      const [students, grades] = await Promise.all([
        base44.entities.Student.filter({ enrollment_status: 'active' }),
        base44.entities.Grade.list('-created_date', 50)
      ]);

      // Calculate class average
      let average = 0;
      if (grades.length > 0) {
        const total = grades.reduce((sum, grade) => sum + (grade.grade_value || 0), 0);
        average = (total / grades.length);
      }

      // Get unique subjects
      const uniqueSubjects = [...new Set(grades.map(g => g.subject))].filter(Boolean);

      setStats({
        totalStudents: students.length,
        totalGrades: grades.length,
        classAverage: average,
        subjects: uniqueSubjects.length
      });

      setRecentGrades(grades.slice(0, 10));
    } catch (error) {
      console.error('Error loading grading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLetterGrade = (avg) => {
    if (avg >= 90) return 'A';
    if (avg >= 80) return 'B';
    if (avg >= 70) return 'C';
    if (avg >= 60) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Grading Center</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Students</div>
                <div className="text-3xl font-bold mb-1">{stats.totalStudents}</div>
                <div className="text-xs text-gray-500">Enrolled students</div>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Grades</div>
                <div className="text-3xl font-bold mb-1">{stats.totalGrades}</div>
                <div className="text-xs text-gray-500">Grades recorded</div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Class Average</div>
                <div className="text-3xl font-bold mb-1">{stats.classAverage.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">{getLetterGrade(stats.classAverage)} average</div>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Subjects</div>
                <div className="text-3xl font-bold mb-1">{stats.subjects}</div>
                <div className="text-xs text-gray-500">Different subjects</div>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0">
          <TabsTrigger 
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="gradebook"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            Gradebook
          </TabsTrigger>
          <TabsTrigger 
            value="reports"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            Reports
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-6">Recent Grades</h2>
              
              {recentGrades.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No grades recorded yet
                </div>
              ) : (
                <div className="space-y-2">
                  {recentGrades.map((grade) => (
                    <div key={grade.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{grade.student_name || 'Unknown Student'}</div>
                        <div className="text-sm text-gray-600">{grade.subject} - {grade.assignment_name}</div>
                      </div>
                      <div className="text-lg font-bold">{grade.grade_value}%</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gradebook" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Gradebook</h2>
              <p className="text-gray-500">Gradebook view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Reports</h2>
              <p className="text-gray-500">Grade reports coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Analytics</h2>
              <p className="text-gray-500">Grade analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}