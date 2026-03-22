import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getParentStudents } from "@/lib/parentUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingDown } from "lucide-react";

export default function ParentAttendance() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [clockInOuts, setClockInOuts] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, tardy: 0, rate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      const user = await base44.auth.me();
      
      // Use utility to get students associated with this parent by email
      const myChildren = await getParentStudents(user.email);
      
      setChildren(myChildren);
      if (myChildren.length > 0) {
        setSelectedChild(myChildren[0]);
        loadChildAttendance(myChildren[0].id);
      }
    } catch (error) {
      console.error("Error loading parent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildAttendance = async (studentId) => {
    try {
      const clockRecords = await base44.entities.StudentClockInOut.filter({ student_id: studentId });

      // Calculate stats
      const tardyCount = clockRecords.filter(r => r.is_tardy).length;
      const presentCount = clockRecords.filter(r => !r.is_tardy && r.clock_in_time).length;
      const absentCount = clockRecords.filter(r => !r.clock_in_time).length;
      const total = clockRecords.length;
      const attendanceRate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : 0;

      setStats({
        present: presentCount,
        absent: absentCount,
        tardy: tardyCount,
        rate: attendanceRate
      });

      // Sort by most recent
      const sorted = clockRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      setClockInOuts(sorted);
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
        <p className="text-gray-600 mt-1">View daily attendance and patterns</p>
      </div>

      {/* Child Selector */}
      {children.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => {
                setSelectedChild(child);
                loadChildAttendance(child.id);
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedChild?.id === child.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {child.first_name} {child.last_name}
            </button>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Attendance Rate</div>
            <div className="text-3xl font-bold">{stats.rate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-green-600 mb-1">Present</div>
            <div className="text-3xl font-bold">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-red-600 mb-1">Absent</div>
            <div className="text-3xl font-bold">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-yellow-600 mb-1">Tardy</div>
            <div className="text-3xl font-bold">{stats.tardy}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {clockInOuts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No attendance records yet.</p>
            ) : (
              clockInOuts.slice(0, 20).map(record => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    {record.clock_in_time && (
                      <p className="text-sm text-gray-600">
                        In: {record.clock_in_time} {record.clock_out_time ? `| Out: ${record.clock_out_time}` : ''}
                      </p>
                    )}
                  </div>
                  {record.is_tardy ? (
                    <Badge className="bg-yellow-100 text-yellow-800">Tardy</Badge>
                  ) : record.clock_in_time ? (
                    <Badge className="bg-green-100 text-green-800">Present</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Absent</Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}