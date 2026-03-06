import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, Flame, X, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function FireDrillMode({ onClose }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [confirmed, setConfirmed] = useState({});
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [studentsData, attData] = await Promise.all([
      base44.entities.Student.filter({ enrollment_status: 'active' }, '', 200),
      base44.entities.Attendance.filter({ date: today }, '', 500),
    ]);
    setStudents(studentsData);
    setAttendance(attData);
    setLoading(false);
  };

  const presentToday = attendance.filter(a => a.status === 'present').map(a => a.student_id);
  const absentToday = attendance.filter(a => a.status === 'absent').map(a => a.student_id);

  const presentStudents = students.filter(s => presentToday.includes(s.id) || !absentToday.includes(s.id));
  const absentStudents = students.filter(s => absentToday.includes(s.id));

  const toggleConfirm = (id) => {
    setConfirmed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allConfirmed = presentStudents.every(s => confirmed[s.id]);

  if (loading) return (
    <div className="fixed inset-0 bg-red-600 z-50 flex items-center justify-center text-white">
      <div className="text-2xl font-bold">Loading...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-red-700 z-50 flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-red-800">
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-yellow-300 animate-pulse" />
          <div>
            <div className="text-white font-bold text-xl">FIRE DRILL MODE</div>
            <div className="text-red-200 text-sm">{today} — Tap each student to confirm presence</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-red-600" onClick={onClose}>
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-4 p-4">
        <div className="flex-1 bg-green-600 rounded-xl p-4 text-white text-center">
          <div className="text-4xl font-bold">{presentStudents.length}</div>
          <div className="text-green-100 text-sm mt-1">Present / Unrecorded</div>
        </div>
        <div className="flex-1 bg-gray-800 rounded-xl p-4 text-white text-center">
          <div className="text-4xl font-bold">{absentStudents.length}</div>
          <div className="text-gray-300 text-sm mt-1">Known Absent</div>
        </div>
        <div className="flex-1 bg-yellow-500 rounded-xl p-4 text-white text-center">
          <div className="text-4xl font-bold">{Object.values(confirmed).filter(Boolean).length}</div>
          <div className="text-yellow-100 text-sm mt-1">Confirmed</div>
        </div>
      </div>

      {allConfirmed && presentStudents.length > 0 && (
        <div className="mx-4 mb-4 p-4 bg-green-500 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-white" />
          <span className="text-white font-bold text-lg">All present students accounted for!</span>
        </div>
      )}

      {/* Present students - tap to confirm */}
      <div className="flex-1 p-4">
        <div className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
          Present / Tap to Confirm ({Object.values(confirmed).filter(Boolean).length}/{presentStudents.length})
        </div>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {presentStudents.map(s => (
            <button
              key={s.id}
              onClick={() => toggleConfirm(s.id)}
              className={`p-3 rounded-xl text-left transition-all ${
                confirmed[s.id]
                  ? 'bg-green-500 border-2 border-green-300'
                  : 'bg-red-600 border-2 border-red-400 hover:bg-red-500'
              }`}
            >
              <div className="flex items-center gap-2">
                {confirmed[s.id]
                  ? <UserCheck className="h-5 w-5 text-white flex-shrink-0" />
                  : <UserX className="h-5 w-5 text-red-200 flex-shrink-0" />
                }
                <div>
                  <div className="text-white font-semibold text-sm">{s.first_name} {s.last_name}</div>
                  <div className="text-red-200 text-xs">Gr. {s.grade_level}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {absentStudents.length > 0 && (
          <>
            <div className="text-red-200 font-semibold mb-3 text-sm uppercase tracking-wide">
              Known Absent Today
            </div>
            <div className="grid grid-cols-2 gap-2">
              {absentStudents.map(s => (
                <div key={s.id} className="p-3 rounded-xl bg-gray-800 opacity-60">
                  <div className="text-gray-300 font-semibold text-sm">{s.first_name} {s.last_name}</div>
                  <Badge className="bg-gray-600 text-gray-200 text-xs mt-1">Absent</Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}