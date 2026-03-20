import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, TrendingUp, BookOpen, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function Grading() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGrades: 0,
    classAverage: 0,
    subjects: 0,
    studentsAboveAvg: 0,
    studentsBelowAvg: 0,
    gradingPercentage: 0
  });
  const [recentGrades, setRecentGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGradingData();
  }, []);

  const loadGradingData = async () => {
    try {
      const [studentsData, gradesData, classData, assignmentGradeData] = await Promise.all([
        base44.entities.Student.filter({ enrollment_status: 'active' }, '', 200),
        base44.entities.Grade.list('-created_date', 200),
        base44.entities.ClassSection.filter({ is_active: true }, '', 100),
        base44.entities.AssignmentGrade.list('-created_date', 500)
      ]);

      setStudents(studentsData);
      setGrades(gradesData);
      setClasses(classData);
      if (classData.length > 0 && !selectedClass) setSelectedClass(classData[0]);

      // Calculate stats
      let average = 0;
      if (assignmentGradeData.length > 0) {
        const validGrades = assignmentGradeData.filter(g => g.percentage !== null && g.percentage !== undefined);
        if (validGrades.length > 0) {
          average = validGrades.reduce((sum, g) => sum + g.percentage, 0) / validGrades.length;
        }
      }

      const studentsAboveAvg = studentsData.filter(s => {
        const stuGrades = assignmentGradeData.filter(g => g.student_id === s.id && g.percentage);
        const stuAvg = stuGrades.length ? stuGrades.reduce((sum, g) => sum + g.percentage, 0) / stuGrades.length : 0;
        return stuAvg > average;
      }).length;

      const studentsBelowAvg = studentsData.length - studentsAboveAvg;
      const totalAssignments = classData.reduce((sum, c) => sum + (c.student_ids?.length || 0), 0);
      const gradingPercentage = totalAssignments > 0 ? (assignmentGradeData.length / totalAssignments) * 100 : 0;

      const uniqueSubjects = [...new Set(gradesData.map(g => g.subject))].filter(Boolean);

      setStats({
        totalStudents: studentsData.length,
        totalGrades: assignmentGradeData.length,
        classAverage: average,
        subjects: uniqueSubjects.length,
        studentsAboveAvg,
        studentsBelowAvg,
        gradingPercentage
      });

      setRecentGrades(gradesData.slice(0, 10));
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

        <TabsContent value="gradebook" className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Class</label>
            <Select value={selectedClass?.id || ''} onValueChange={cid => setSelectedClass(classes.find(c => c.id === cid))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && (
            <Card>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{selectedClass.name}</h3>
                  <p className="text-sm text-gray-600">Teacher: {selectedClass.teacher_name || 'N/A'} | Grade: {selectedClass.grade_level} | Period: {selectedClass.period || 'N/A'}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">Student</th>
                        <th className="px-4 py-2 text-center">Assignments</th>
                        <th className="px-4 py-2 text-center">Average</th>
                        <th className="px-4 py-2 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClass.student_ids && selectedClass.student_ids.length > 0 ? (
                        selectedClass.student_ids.map(sid => {
                          const student = students.find(s => s.id === sid);
                          const classGrades = grades.filter(g => g.student_id === sid);
                          const avg = classGrades.length ? classGrades.reduce((sum, g) => sum + (g.grade_value || 0), 0) / classGrades.length : null;
                          const letter = avg === null ? '—' : avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F';
                          return (
                            <tr key={sid} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium">{student?.first_name} {student?.last_name}</td>
                              <td className="px-4 py-2 text-center">{classGrades.length}</td>
                              <td className="px-4 py-2 text-center">{avg !== null ? `${avg.toFixed(1)}%` : '—'}</td>
                              <td className="px-4 py-2 text-center font-bold">{letter}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="4" className="px-4 py-4 text-center text-gray-500">No students enrolled</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-6 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Performance by Letter Grade</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Above Average', value: stats.studentsAboveAvg },
                          { name: 'Below Average', value: stats.studentsBelowAvg }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-green-700">Students Above Average</div>
                        <div className="text-3xl font-bold text-green-600">{stats.studentsAboveAvg}</div>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-red-700">Students Below Average</div>
                        <div className="text-3xl font-bold text-red-600">{stats.studentsBelowAvg}</div>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Student Performance Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['A', 'B', 'C', 'D', 'F'].map(letter => {
                  const count = students.filter(s => {
                    const stuGrades = grades.filter(g => g.student_id === s.id);
                    if (stuGrades.length === 0) return false;
                    const avg = stuGrades.reduce((sum, g) => sum + (g.grade_value || 0), 0) / stuGrades.length;
                    const gradeLetters = { A: [90, 100], B: [80, 89], C: [70, 79], D: [60, 69], F: [0, 59] };
                    const [min, max] = gradeLetters[letter] || [0, 100];
                    return avg >= min && avg <= max;
                  }).length;
                  const colors = { A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-yellow-100 text-yellow-700', D: 'bg-orange-100 text-orange-700', F: 'bg-red-100 text-red-700' };
                  return (
                    <div key={letter} className={`${colors[letter]} rounded-lg p-4 text-center`}>
                      <div className="text-3xl font-bold">{letter}</div>
                      <div className="text-sm font-medium">{count} student{count !== 1 ? 's' : ''}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Grading Progress</div>
                    <div className="text-3xl font-bold mb-1">{stats.gradingPercentage.toFixed(0)}%</div>
                    <div className="text-xs text-gray-500">Assignments graded</div>
                  </div>
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div className="mt-4 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.gradingPercentage}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Grade Distribution</div>
                    <div className="text-3xl font-bold mb-1">{stats.totalGrades}</div>
                    <div className="text-xs text-gray-500">Total grades recorded</div>
                  </div>
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Class Average Trend</div>
                    <div className="text-3xl font-bold mb-1">{stats.classAverage.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">{getLetterGrade(stats.classAverage)} average</div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Grade Trend Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={recentGrades.slice(0, 20).map((g, i) => ({ name: `Grade ${i + 1}`, value: g.grade_value || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Class Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classes.slice(0, 5).map(cls => {
                  const classGrades = grades.filter(g => g.class_id === cls.id || g.subject === cls.name);
                  const avg = classGrades.length ? classGrades.reduce((sum, g) => sum + (g.grade_value || 0), 0) / classGrades.length : 0;
                  return { name: cls.name, average: avg };
                })}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="average" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}