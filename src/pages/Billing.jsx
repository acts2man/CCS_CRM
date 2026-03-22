import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Users, AlertCircle, CheckCircle, Clock, Plus, Search, TrendingUp } from 'lucide-react';
import AddChargeModal from '@/components/billing/AddChargeModal';
import RecordPaymentModal from '@/components/billing/RecordPaymentModal';
import ARDashboard from '@/components/billing/ARDashboard';

export default function Billing() {
  const [tab, setTab] = useState('dashboard');
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [chargesData, paymentsData, studentsData, balancesData] = await Promise.all([
      base44.entities.Charge.list('-created_date', 200),
      base44.entities.Payment.list('-payment_date', 200),
      base44.entities.Student.filter({ enrollment_status: 'active' }),
      base44.entities.StudentBalance.list()
    ]);
    setCharges(chargesData);
    setPayments(paymentsData);
    setStudents(studentsData);
    setBalances(balancesData);
    setLoading(false);
  };

  const totalOutstanding = charges.filter(c => c.status === 'unpaid' || c.status === 'partial')
    .reduce((sum, c) => sum + (c.amount - (c.paid_amount || 0)), 0);
  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const overdueCount = charges.filter(c => c.status === 'unpaid' && c.due_date && new Date(c.due_date) < new Date()).length;

  const filteredCharges = charges.filter(c => {
    const matchStudent = !selectedStudentFilter || c.student_id === selectedStudentFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchStudent && matchStatus;
  });

  const chargeTypeColors = {
    tuition: 'bg-blue-100 text-blue-800',
    field_trip: 'bg-green-100 text-green-800',
    fundraiser: 'bg-purple-100 text-purple-800',
    registration: 'bg-yellow-100 text-yellow-800',
    lunch: 'bg-orange-100 text-orange-800',
    aftercare: 'bg-pink-100 text-pink-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const statusColors = {
    unpaid: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    waived: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Billing & AR</h1>
            <p className="text-sm text-gray-500 mt-1">Manage tuition, fees, and payment tracking</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowRecordPayment(true); setSelectedStudentId(null); }}>
              <DollarSign className="h-4 w-4 mr-1" /> Payment
            </Button>
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800" onClick={() => { setShowAddCharge(true); setSelectedStudentId(null); }}>
              <Plus className="h-4 w-4 mr-1" /> Charge
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">${totalOutstanding.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Collected (All Time)</p>
                  <p className="text-2xl font-bold text-green-600">${totalCollected.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Overdue Charges</p>
                  <p className="text-2xl font-bold text-orange-600">{overdueCount}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Students</p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">AR Dashboard</TabsTrigger>
            <TabsTrigger value="charges">All Charges</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ARDashboard charges={charges} payments={payments} students={students} onRefresh={loadData}
              onAddCharge={(sid) => { setSelectedStudentId(sid); setShowAddCharge(true); }}
              onRecordPayment={(sid) => { setSelectedStudentId(sid); setShowRecordPayment(true); }}
            />
          </TabsContent>

          <TabsContent value="charges">
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-3 mb-4">
                  <Select value={selectedStudentFilter} onValueChange={setSelectedStudentFilter}>
                    <SelectTrigger className="w-56"><SelectValue placeholder="Select a student..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>All Students</SelectItem>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="waived">Waived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {filteredCharges.length === 0 && <p className="text-gray-500 text-sm py-6 text-center">No charges found.</p>}
                  {filteredCharges.map(charge => (
                    <div key={charge.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{charge.student_name}</div>
                          <div className="text-xs text-gray-500 truncate">{charge.description || charge.charge_type}{charge.due_date && ` · Due ${new Date(charge.due_date).toLocaleDateString()}`}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold">${(charge.amount || 0).toFixed(2)}</div>
                          {charge.paid_amount > 0 && <div className="text-xs text-green-600">Paid ${charge.paid_amount.toFixed(2)}</div>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={chargeTypeColors[charge.charge_type] || 'bg-gray-100 text-gray-700'}>{charge.charge_type}</Badge>
                        <Badge className={statusColors[charge.status]}>{charge.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {payments.length === 0 && <p className="text-gray-500 text-sm py-6 text-center">No payments recorded yet.</p>}
                  {payments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{payment.student_name}</div>
                        <div className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleDateString()} · {payment.method} {payment.reference_number && `· #${payment.reference_number}`}</div>
                      </div>
                      <div className="text-green-600 font-bold">+${(payment.amount || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showAddCharge && (
        <AddChargeModal
          students={students}
          preSelectedStudentId={selectedStudentId}
          onClose={() => setShowAddCharge(false)}
          onCreated={loadData}
        />
      )}
      {showRecordPayment && (
        <RecordPaymentModal
          students={students}
          charges={charges}
          preSelectedStudentId={selectedStudentId}
          onClose={() => setShowRecordPayment(false)}
          onCreated={loadData}
        />
      )}
    </div>
  );
}