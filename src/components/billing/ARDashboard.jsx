import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DollarSign, Plus, Search, AlertTriangle } from 'lucide-react';

export default function ARDashboard({ charges, payments, students, onRefresh, onAddCharge, onRecordPayment }) {
  const [search, setSearch] = useState('');

  // Build per-student AR summary
  const studentMap = {};
  students.forEach(s => {
    studentMap[s.id] = {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      grade: s.grade_level,
      totalCharged: 0,
      totalPaid: 0,
      balance: 0,
      charges: [],
      payments: [],
    };
  });

  charges.forEach(c => {
    if (studentMap[c.student_id]) {
      studentMap[c.student_id].totalCharged += c.amount || 0;
      studentMap[c.student_id].totalPaid += c.paid_amount || 0;
      studentMap[c.student_id].balance += (c.amount || 0) - (c.paid_amount || 0);
      if (c.status !== 'paid' && c.status !== 'waived') studentMap[c.student_id].charges.push(c);
    }
  });

  payments.forEach(p => {
    if (studentMap[p.student_id]) {
      studentMap[p.student_id].payments.push(p);
    }
  });

  const rows = Object.values(studentMap).filter(s => s.totalCharged > 0 || s.payments.length > 0);

  const filtered = rows.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  const paid = filtered.filter(r => r.balance <= 0);
  const unpaid = filtered.filter(r => r.balance > 0);
  const overdue = unpaid.filter(r => r.charges.some(c => c.due_date && new Date(c.due_date) < new Date()));

  const getStatusBadge = (student) => {
    if (student.balance <= 0) return <Badge className="bg-green-100 text-green-800">Current</Badge>;
    const hasOverdue = student.charges.some(c => c.due_date && new Date(c.due_date) < new Date());
    if (hasOverdue) return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">Outstanding</Badge>;
  };

  const StudentRow = ({ student }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold">
          {student.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
        </div>
        <div>
          <div className="font-medium text-sm">{student.name}</div>
          <div className="text-xs text-gray-500">Grade {student.grade} · {student.charges.length} open charge(s)</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {getStatusBadge(student)}
        <div className="text-right">
          <div className={`font-bold text-sm ${student.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {student.balance > 0 ? `-$${student.balance.toFixed(2)}` : 'Paid'}
          </div>
          <div className="text-xs text-gray-400">Charged: ${student.totalCharged.toFixed(2)}</div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onAddCharge(student.id)}>+ Charge</Button>
          {student.balance > 0 && <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700" onClick={() => onRecordPayment(student.id)}>Pay</Button>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 mb-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search students..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-red-800">Overdue Accounts ({overdue.length})</h3>
            </div>
            <div className="space-y-2">{overdue.map(s => <StudentRow key={s.id} student={s} />)}</div>
          </CardContent>
        </Card>
      )}

      {unpaid.filter(s => !overdue.includes(s)).length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-3 text-yellow-700">Outstanding ({unpaid.filter(s => !overdue.includes(s)).length})</h3>
            <div className="space-y-2">{unpaid.filter(s => !overdue.includes(s)).map(s => <StudentRow key={s.id} student={s} />)}</div>
          </CardContent>
        </Card>
      )}

      {paid.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-3 text-green-700">Current / Paid ({paid.length})</h3>
            <div className="space-y-2">{paid.map(s => <StudentRow key={s.id} student={s} />)}</div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500 py-12">
            <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No billing records yet. Add charges to students to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}