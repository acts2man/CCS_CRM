import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Download, Calendar, BarChart3, ClipboardList, BookOpen } from 'lucide-react';

export default function ReportCenter() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('attendance_summary');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth()-1); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [s, a, g] = await Promise.all([
      base44.entities.Student.filter({ enrollment_status: 'active' }),
      base44.entities.Attendance.list('-date', 500),
      base44.entities.AssignmentGrade.list('-created_date', 500)
    ]);
    setStudents(s);
    setAttendance(a);
    setGrades(g);
    setLoading(false);
  };

  const generateReport = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 400));

    const filteredAttendance = attendance.filter(a => {
      const inRange = a.date >= dateFrom && a.date <= dateTo;
      const matchStudent = selectedStudentId === 'all' || a.student_id === selectedStudentId;
      return inRange && matchStudent;
    });

    const filteredStudents = selectedStudentId === 'all' ? students : students.filter(s => s.id === selectedStudentId);

    if (reportType === 'attendance_summary') {
      const rows = filteredStudents.map(student => {
        const stuAtt = filteredAttendance.filter(a => a.student_id === student.id);
        const present = stuAtt.filter(a => a.status === 'present').length;
        const absent = stuAtt.filter(a => a.status === 'absent').length;
        const tardy = stuAtt.filter(a => a.status === 'tardy').length;
        const excused = stuAtt.filter(a => a.status === 'excused').length;
        const total = stuAtt.length;
        const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '—';
        return { student, present, absent, tardy, excused, total, rate };
      });
      setReportData({ type: 'attendance_summary', rows, dateFrom, dateTo });
    } else if (reportType === 'absence_report') {
      const rows = filteredAttendance.filter(a => a.status === 'absent').map(a => {
        const student = students.find(s => s.id === a.student_id);
        return { student, record: a };
      });
      setReportData({ type: 'absence_report', rows, dateFrom, dateTo });
    } else if (reportType === 'tardy_report') {
      const rows = filteredAttendance.filter(a => a.status === 'tardy').map(a => {
        const student = students.find(s => s.id === a.student_id);
        return { student, record: a };
      });
      setReportData({ type: 'tardy_report', rows, dateFrom, dateTo });
    } else if (reportType === 'grade_report') {
      const rows = filteredStudents.map(student => {
        const stuGrades = grades.filter(g => g.student_id === student.id && g.status === 'graded');
        const avg = stuGrades.length ? stuGrades.reduce((s,g) => s + (g.percentage||0), 0) / stuGrades.length : null;
        const letter = avg === null ? '—' : avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F';
        return { student, gradeCount: stuGrades.length, avg, letter };
      });
      setReportData({ type: 'grade_report', rows });
    } else if (reportType === 'report_card') {
      const rows = filteredStudents.map(student => {
        const stuAtt = filteredAttendance.filter(a => a.student_id === student.id);
        const present = stuAtt.filter(a => a.status === 'present').length;
        const absent = stuAtt.filter(a => a.status === 'absent').length;
        const tardy = stuAtt.filter(a => a.status === 'tardy').length;
        const stuGrades = grades.filter(g => g.student_id === student.id && g.status === 'graded');
        const avg = stuGrades.length ? stuGrades.reduce((s,g) => s + (g.percentage||0), 0) / stuGrades.length : null;
        const letter = avg === null ? '—' : avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F';
        return { student, present, absent, tardy, totalDays: stuAtt.length, avg, letter };
      });
      setReportData({ type: 'report_card', rows, dateFrom, dateTo });
    }
    setGenerating(false);
  };

  const getLetterColor = (l) => ({ A: 'text-green-600', B: 'text-blue-600', C: 'text-yellow-600', D: 'text-orange-600', F: 'text-red-600' }[l] || 'text-gray-500');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-bold">Report Center</h1>
        <p className="text-sm text-gray-500 mt-1">Generate attendance, grade, and report card reports</p>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">
        {/* Report Builder */}
        <Card>
          <CardContent className="pt-5">
            <h2 className="font-semibold mb-4">Build Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attendance_summary">Attendance Summary</SelectItem>
                    <SelectItem value="absence_report">Absence Report</SelectItem>
                    <SelectItem value="tardy_report">Tardy Report</SelectItem>
                    <SelectItem value="grade_report">Grade Report</SelectItem>
                    <SelectItem value="report_card">Report Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Student</label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date From</label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date To</label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <Button className="bg-slate-900 hover:bg-slate-800" onClick={generateReport} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Output */}
        {reportData && (
          <Card>
            <CardContent className="pt-5">
              {reportData.type === 'attendance_summary' && (
                <>
                  <h2 className="font-bold text-lg mb-1">Attendance Summary</h2>
                  <p className="text-sm text-gray-500 mb-4">{reportData.dateFrom} – {reportData.dateTo}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-3 py-2">Student</th>
                        <th className="px-3 py-2 text-center">Present</th>
                        <th className="px-3 py-2 text-center">Absent</th>
                        <th className="px-3 py-2 text-center">Tardy</th>
                        <th className="px-3 py-2 text-center">Excused</th>
                        <th className="px-3 py-2 text-center">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.rows.map(row => (
                        <tr key={row.student.id} className="border-t">
                          <td className="px-3 py-2 font-medium">{row.student.first_name} {row.student.last_name} <span className="text-gray-400 text-xs">Gr {row.student.grade_level}</span></td>
                          <td className="px-3 py-2 text-center text-green-600">{row.present}</td>
                          <td className="px-3 py-2 text-center text-red-600">{row.absent}</td>
                          <td className="px-3 py-2 text-center text-yellow-600">{row.tardy}</td>
                          <td className="px-3 py-2 text-center text-blue-600">{row.excused}</td>
                          <td className="px-3 py-2 text-center font-semibold">{row.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {(reportData.type === 'absence_report' || reportData.type === 'tardy_report') && (
                <>
                  <h2 className="font-bold text-lg mb-1">{reportData.type === 'absence_report' ? 'Absence' : 'Tardy'} Report</h2>
                  <p className="text-sm text-gray-500 mb-4">{reportData.dateFrom} – {reportData.dateTo} · {reportData.rows.length} record(s)</p>
                  {reportData.rows.length === 0 ? <p className="text-gray-400 text-sm">No records found.</p> : (
                    <div className="space-y-2">
                      {reportData.rows.map((row, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{row.student?.first_name} {row.student?.last_name}</div>
                            <div className="text-xs text-gray-500">{row.record.date} {row.record.reason && `· ${row.record.reason}`}</div>
                          </div>
                          <Badge className={row.record.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {row.record.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {reportData.type === 'grade_report' && (
                <>
                  <h2 className="font-bold text-lg mb-4">Grade Report</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-3 py-2">Student</th>
                        <th className="px-3 py-2 text-center">Graded Assignments</th>
                        <th className="px-3 py-2 text-center">Average</th>
                        <th className="px-3 py-2 text-center">Letter Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.rows.map(row => (
                        <tr key={row.student.id} className="border-t">
                          <td className="px-3 py-2 font-medium">{row.student.first_name} {row.student.last_name}</td>
                          <td className="px-3 py-2 text-center">{row.gradeCount}</td>
                          <td className="px-3 py-2 text-center">{row.avg !== null ? `${row.avg.toFixed(1)}%` : '—'}</td>
                          <td className={`px-3 py-2 text-center font-bold ${getLetterColor(row.letter)}`}>{row.letter}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {reportData.type === 'report_card' && (
                <>
                  <h2 className="font-bold text-lg mb-1">Report Cards</h2>
                  <p className="text-sm text-gray-500 mb-4">{reportData.dateFrom} – {reportData.dateTo}</p>
                  <div className="space-y-4">
                    {reportData.rows.map(row => (
                      <div key={row.student.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-bold text-base">{row.student.first_name} {row.student.last_name}</div>
                            <div className="text-xs text-gray-500">Grade {row.student.grade_level} · ID: {row.student.id.slice(-6)}</div>
                          </div>
                          <div className={`text-3xl font-black ${getLetterColor(row.letter)}`}>{row.letter}</div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-center">
                          <div className="bg-green-50 rounded p-2">
                            <div className="text-lg font-bold text-green-700">{row.present}</div>
                            <div className="text-xs text-gray-500">Present</div>
                          </div>
                          <div className="bg-red-50 rounded p-2">
                            <div className="text-lg font-bold text-red-700">{row.absent}</div>
                            <div className="text-xs text-gray-500">Absent</div>
                          </div>
                          <div className="bg-yellow-50 rounded p-2">
                            <div className="text-lg font-bold text-yellow-700">{row.tardy}</div>
                            <div className="text-xs text-gray-500">Tardy</div>
                          </div>
                          <div className="bg-blue-50 rounded p-2">
                            <div className="text-lg font-bold text-blue-700">{row.avg !== null ? `${row.avg.toFixed(0)}%` : '—'}</div>
                            <div className="text-xs text-gray-500">Grade Avg</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}