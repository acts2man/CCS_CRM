import React from 'react';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Search, LogIn, LogOut, History, Edit2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const TARDY_CUTOFF = '08:30'; // Default tardy cutoff time

export default function ClockInOut() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [clockRecords, setClockRecords] = useState([]);
  const [auditHistory, setAuditHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ clock_in_time: '', clock_out_time: '', notes: '' });
  const [elapsedTimes, setElapsedTimes] = useState({});

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Running timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTimes(prev => {
        const newTimes = { ...prev };
        clockRecords.forEach(record => {
          if (record.clock_in_time && !record.clock_out_time) {
            const [inHours, inMinutes, inSeconds] = record.clock_in_time.split(':').map(Number);
            const inTotalSeconds = inHours * 3600 + inMinutes * 60 + inSeconds;
            
            // Get current PST time
            const now = new Date();
            const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
            const currentSeconds = pstTime.getHours() * 3600 + pstTime.getMinutes() * 60 + pstTime.getSeconds();
            
            const diffSeconds = Math.max(0, currentSeconds - inTotalSeconds);
            const hours = Math.floor(diffSeconds / 3600);
            const minutes = Math.floor((diffSeconds % 3600) / 60);
            const seconds = diffSeconds % 60;
            newTimes[record.student_id] = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
          }
        });
        return newTimes;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [clockRecords]);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const [studentsData, clockData, auditData] = await Promise.all([
      base44.entities.Student.filter({ enrollment_status: 'active' }, '', 200),
      base44.entities.StudentClockInOut.filter({ date: selectedDate }, '', 500),
      base44.entities.ClockInOutAudit.list('-edited_at', 100)
    ]);

    setStudents(studentsData);
    setClockRecords(clockData);
    setAuditHistory(auditData);
    setLoading(false);
  };

  const getClockRecord = (studentId) => {
    return clockRecords.find(r => r.student_id === studentId);
  };

  const handleClockIn = async (student) => {
    const now = new Date();
    const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const clockInTime = format(pstTime, 'HH:mm:ss');
    const isTardy = clockInTime > TARDY_CUTOFF;

    const record = getClockRecord(student.id);
    if (record) {
      // Update existing record
      await base44.entities.StudentClockInOut.update(record.id, {
        clock_in_time: clockInTime,
        is_tardy: isTardy
      });
      // Audit
      await base44.entities.ClockInOutAudit.create({
        clock_record_id: record.id,
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        date: selectedDate,
        action: 'clock_in_edited',
        old_value: record.clock_in_time || 'N/A',
        new_value: clockInTime,
        edited_by: user.id,
        edited_by_name: user.full_name
      });
    } else {
      // Create new record
      const newRecord = await base44.entities.StudentClockInOut.create({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        date: selectedDate,
        clock_in_time: clockInTime,
        is_tardy: isTardy,
        tardy_cutoff_time: TARDY_CUTOFF,
        recorded_by: user.id
      });
      // Audit
      await base44.entities.ClockInOutAudit.create({
        clock_record_id: newRecord.id,
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        date: selectedDate,
        action: 'clock_in_recorded',
        new_value: clockInTime,
        edited_by: user.id,
        edited_by_name: user.full_name,
        edited_at: new Date().toISOString()
      });
    }
    toast({ title: `${student.first_name} clocked in ${isTardy ? '(TARDY)' : ''}` });
    await loadData();
  };

  const handleClockOut = async (student) => {
    const now = new Date();
    const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const clockOutTime = format(pstTime, 'HH:mm:ss');

    const record = getClockRecord(student.id);
    if (record) {
      // Calculate duration
      const [inHours, inMinutes, inSeconds] = record.clock_in_time.split(':').map(Number);
      const [outHours, outMinutes, outSeconds] = clockOutTime.split(':').map(Number);
      const inTotalSeconds = inHours * 3600 + inMinutes * 60 + inSeconds;
      const outTotalSeconds = outHours * 3600 + outMinutes * 60 + outSeconds;
      const durationMinutes = Math.round((outTotalSeconds - inTotalSeconds) / 60);

      await base44.entities.StudentClockInOut.update(record.id, {
        clock_out_time: clockOutTime,
        duration_minutes: Math.max(0, durationMinutes)
      });
      // Audit
      await base44.entities.ClockInOutAudit.create({
        clock_record_id: record.id,
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        date: selectedDate,
        action: 'clock_out_recorded',
        new_value: clockOutTime,
        edited_by: user.id,
        edited_by_name: user.full_name,
        edited_at: new Date().toISOString()
      });
      toast({ title: `${student.first_name} clocked out` });
      await loadData();
    } else {
      toast({ title: 'Error', description: 'Student must clock in first' });
    }
  };

  const handleEditClockRecord = async () => {
    const record = showEditModal;
    const updates = {};
    let changedFields = false;

    if (editForm.clock_in_time && editForm.clock_in_time !== record.clock_in_time) {
      updates.clock_in_time = editForm.clock_in_time;
      const isTardy = editForm.clock_in_time > TARDY_CUTOFF;
      updates.is_tardy = isTardy;
      
      await base44.entities.ClockInOutAudit.create({
        clock_record_id: record.id,
        student_id: record.student_id,
        student_name: record.student_name,
        date: selectedDate,
        action: 'clock_in_edited',
        old_value: record.clock_in_time || 'N/A',
        new_value: editForm.clock_in_time,
        edited_by: user.id,
        edited_by_name: user.full_name,
        edited_at: new Date().toISOString(),
        reason: editForm.notes
      });
      changedFields = true;
    }

    if (editForm.clock_out_time && editForm.clock_out_time !== record.clock_out_time) {
      updates.clock_out_time = editForm.clock_out_time;
      
      await base44.entities.ClockInOutAudit.create({
        clock_record_id: record.id,
        student_id: record.student_id,
        student_name: record.student_name,
        date: selectedDate,
        action: 'clock_out_edited',
        old_value: record.clock_out_time || 'N/A',
        new_value: editForm.clock_out_time,
        edited_by: user.id,
        edited_by_name: user.full_name,
        edited_at: new Date().toISOString(),
        reason: editForm.notes
      });
      changedFields = true;
    }

    if (changedFields) {
      await base44.entities.StudentClockInOut.update(record.id, updates);
      toast({ title: 'Clock record updated' });
      setShowEditModal(null);
      await loadData();
    }
  };

  const filteredStudents = students.filter(s => {
    const searchMatch = !searchTerm || 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    return searchMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clock In / Clock Out</h2>
          <p className="text-gray-600 mt-1">Track student arrival and departure times</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Quick student lookup..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clock Records */}
      <div className="grid gap-3">
        {filteredStudents.map((student) => {
          const record = getClockRecord(student.id);
          return (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex-1">
                    <div className="font-semibold">{student.first_name} {student.last_name}</div>
                    <div className="text-sm text-gray-500">Grade {student.grade_level}</div>
                  </div>

                  {/* Clock Times */}
                  {record && (
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Clock In</div>
                        <div className="font-semibold">{record.clock_in_time || '—'}</div>
                        {record.is_tardy && <Badge className="mt-1 bg-yellow-100 text-yellow-800">Tardy</Badge>}
                      </div>
                      {record.clock_in_time && !record.clock_out_time && (
                        <div className="text-center">
                          <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" />
                            Elapsed
                          </div>
                          <div className="font-semibold text-green-600 font-mono">{elapsedTimes[student.id] || '00:00:00'}</div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Clock Out</div>
                        <div className="font-semibold">{record.clock_out_time || '—'}</div>
                        {record.clock_out_time && record.duration_minutes && (
                          <Badge className="mt-1 bg-blue-100 text-blue-800">{record.duration_minutes} min</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!record || !record.clock_in_time ? (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleClockIn(student)}
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        Clock In
                      </Button>
                    ) : !record.clock_out_time ? (
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleClockOut(student)}
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Clock Out
                      </Button>
                    ) : null}

                    {record && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowEditModal(record);
                            setEditForm({
                              clock_in_time: record.clock_in_time || '',
                              clock_out_time: record.clock_out_time || '',
                              notes: ''
                            });
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAuditModal(record)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Audit History Modal */}
      {showAuditModal && (
        <Dialog open={!!showAuditModal} onOpenChange={() => setShowAuditModal(null)}>
          <DialogContent className="max-w-2xl max-h-[60vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit History — {showAuditModal.student_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {auditHistory
                .filter(a => a.clock_record_id === showAuditModal.id)
                .sort((a, b) => new Date(b.edited_at) - new Date(a.edited_at))
                .map((audit, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border text-sm">
                    <div className="font-semibold">{audit.action.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="text-gray-600 mt-1">
                      {audit.old_value && (
                        <div>Old: <span className="font-mono">{audit.old_value}</span></div>
                      )}
                      {audit.new_value && (
                        <div>New: <span className="font-mono">{audit.new_value}</span></div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {audit.edited_by_name} • {new Date(audit.edited_at).toLocaleString()}
                    </div>
                    {audit.reason && (
                      <div className="text-xs text-gray-600 mt-1 italic">Reason: {audit.reason}</div>
                    )}
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Clock Record Modal */}
      {showEditModal && (
        <Dialog open={!!showEditModal} onOpenChange={() => setShowEditModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Clock Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Clock In Time (HH:MM:SS)</label>
                <Input
                  type="time"
                  value={editForm.clock_in_time}
                  onChange={(e) => setEditForm(f => ({ ...f, clock_in_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Clock Out Time (HH:MM:SS)</label>
                <Input
                  type="time"
                  value={editForm.clock_out_time}
                  onChange={(e) => setEditForm(f => ({ ...f, clock_out_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Edit Reason</label>
                <Input
                  placeholder="Why are you making this edit?"
                  value={editForm.notes}
                  onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(null)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleEditClockRecord}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}