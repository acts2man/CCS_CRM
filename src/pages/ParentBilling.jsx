import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getParentStudents } from "@/lib/parentUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertCircle } from "lucide-react";

export default function ParentBilling() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(null);
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
        loadChildBilling(myChildren[0].id);
      }
    } catch (error) {
      console.error("Error loading parent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildBilling = async (studentId) => {
    try {
      const [chargesData, paymentsData, balanceData] = await Promise.all([
        base44.entities.Charge.filter({ student_id: studentId }),
        base44.entities.Payment.filter({ student_id: studentId }),
        base44.entities.StudentBalance.filter({ student_id: studentId })
      ]);

      setCharges(chargesData.sort((a, b) => new Date(b.due_date) - new Date(a.due_date)));
      setPayments(paymentsData.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date)));
      setBalance(balanceData.length > 0 ? balanceData[0] : null);
    } catch (error) {
      console.error("Error loading billing:", error);
    }
  };

  const getChargeStatusColor = (status) => {
    if (status === 'paid') return 'bg-green-100 text-green-800';
    if (status === 'partial') return 'bg-blue-100 text-blue-800';
    if (status === 'waived') return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const totalOutstanding = charges.reduce((sum, c) => {
    if (c.status === 'unpaid' || c.status === 'partial') {
      const paid = c.paid_amount || 0;
      return sum + (c.amount - paid);
    }
    return sum;
  }, 0);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
        <p className="text-gray-600 mt-1">Manage charges and payment history</p>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => {
                setSelectedChild(child);
                loadChildBilling(child.id);
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Total Charged</div>
            <div className="text-3xl font-bold">${balance?.total_charged || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-green-600 mb-1">Total Paid</div>
            <div className="text-3xl font-bold">${balance?.total_paid || 0}</div>
          </CardContent>
        </Card>
        <Card className={totalOutstanding > 0 ? 'border-red-200' : ''}>
          <CardContent className="pt-6">
            <div className={`text-sm mb-1 ${totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
              Outstanding Balance
            </div>
            <div className="text-3xl font-bold">${totalOutstanding.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Charges Alert */}
      {totalOutstanding > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Outstanding Balance</p>
            <p className="text-sm text-red-700">You have an outstanding balance of ${totalOutstanding.toFixed(2)}. Please make a payment.</p>
          </div>
        </div>
      )}

      {/* Charges */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Charges</h2>
        <div className="space-y-3">
          {charges.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No charges on record.</p>
              </CardContent>
            </Card>
          ) : (
            charges.map(charge => (
              <Card key={charge.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{charge.description}</p>
                      <p className="text-sm text-gray-600 capitalize">{charge.charge_type}</p>
                      {charge.due_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {new Date(charge.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${charge.amount.toFixed(2)}</p>
                      <Badge className={getChargeStatusColor(charge.status)}>
                        {charge.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment History</h2>
        <div className="space-y-2">
          {payments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No payment history.</p>
          ) : (
            payments.slice(0, 10).map(payment => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">{payment.method}</p>
                </div>
                <p className="font-bold text-green-600">${payment.amount.toFixed(2)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}