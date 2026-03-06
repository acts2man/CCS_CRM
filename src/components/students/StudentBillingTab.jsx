import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, CheckCircle } from 'lucide-react';
import AddChargeModal from '@/components/billing/AddChargeModal';
import RecordPaymentModal from '@/components/billing/RecordPaymentModal';

export default function StudentBillingTab({ studentId, studentName }) {
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);

  const mockStudent = { id: studentId, first_name: studentName?.split(' ')[0] || '', last_name: studentName?.split(' ').slice(1).join(' ') || '', grade_level: '' };

  useEffect(() => { loadData(); }, [studentId]);

  const loadData = async () => {
    const [c, p] = await Promise.all([
      base44.entities.Charge.filter({ student_id: studentId }, '-created_date'),
      base44.entities.Payment.filter({ student_id: studentId }, '-payment_date')
    ]);
    setCharges(c);
    setPayments(p);
    setLoading(false);
  };

  const totalCharged = charges.reduce((s, c) => s + (c.amount || 0), 0);
  const totalPaid = charges.reduce((s, c) => s + (c.paid_amount || 0), 0);
  const balance = totalCharged - totalPaid;

  const statusColors = { unpaid: 'bg-red-100 text-red-800', paid: 'bg-green-100 text-green-800', partial: 'bg-yellow-100 text-yellow-800', waived: 'bg-gray-100 text-gray-600' };

  if (loading) return <div className="py-8 text-center text-gray-400">Loading billing...</div>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4">
          <div className="text-xs text-gray-500">Total Charged</div>
          <div className="text-xl font-bold">${totalCharged.toFixed(2)}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-gray-500">Total Paid</div>
          <div className="text-xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-gray-500">Outstanding Balance</div>
          <div className={`text-xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ${balance.toFixed(2)}
          </div>
        </CardContent></Card>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowAddCharge(true)}><Plus className="h-4 w-4 mr-1" /> Add Charge</Button>
        {balance > 0 && <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowRecordPayment(true)}><DollarSign className="h-4 w-4 mr-1" /> Record Payment</Button>}
      </div>

      {/* Charges */}
      <div>
        <h3 className="font-semibold text-sm mb-2 text-gray-600 uppercase tracking-wide">Charges</h3>
        {charges.length === 0 ? <p className="text-sm text-gray-400">No charges on file.</p> : (
          <div className="space-y-2">
            {charges.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm capitalize">{c.description || c.charge_type.replace('_',' ')}</div>
                  <div className="text-xs text-gray-500">{c.due_date && `Due ${new Date(c.due_date).toLocaleDateString()}`} · {c.school_year}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[c.status]}>{c.status}</Badge>
                  <div className="text-right">
                    <div className="font-semibold text-sm">${c.amount.toFixed(2)}</div>
                    {c.paid_amount > 0 && <div className="text-xs text-green-600">Paid ${c.paid_amount.toFixed(2)}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h3 className="font-semibold text-sm mb-2 text-gray-600 uppercase tracking-wide">Payment History</h3>
        {payments.length === 0 ? <p className="text-sm text-gray-400">No payments recorded.</p> : (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-sm capitalize">{p.method.replace('_',' ')} {p.reference_number && `#${p.reference_number}`}</div>
                    <div className="text-xs text-gray-500">{new Date(p.payment_date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="font-semibold text-green-600">+${p.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddCharge && (
        <AddChargeModal students={[mockStudent]} preSelectedStudentId={studentId} onClose={() => setShowAddCharge(false)} onCreated={loadData} />
      )}
      {showRecordPayment && (
        <RecordPaymentModal students={[mockStudent]} charges={charges} preSelectedStudentId={studentId} onClose={() => setShowRecordPayment(false)} onCreated={loadData} />
      )}
    </div>
  );
}