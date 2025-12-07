import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertCircle, Clock, TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function FinanceOverviewTab() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date', 10),
  });

  // Calculate metrics
  const totalOutstanding = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'void')
    .reduce((sum, inv) => sum + (inv.balance || 0), 0);

  const thisMonthPaid = invoices
    .filter(inv => {
      const paidDate = new Date(inv.updated_date);
      const now = new Date();
      return inv.status === 'paid' && 
             paidDate.getMonth() === now.getMonth() && 
             paidDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);

  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

  const upcomingDue = invoices.filter(inv => {
    const dueDate = new Date(inv.due_date);
    const now = new Date();
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14 && inv.status !== 'paid';
  }).length;

  return (
    <div className="p-6">
      {/* Quick Actions */}
      <div className="flex gap-2 mb-6">
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create Payment Link
        </Button>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Unpaid + Partial invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${thisMonthPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Collected in {format(new Date(), 'MMMM')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Due</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingDue}</div>
            <p className="text-xs text-muted-foreground">
              Due in next 14 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-sm text-gray-500">No recent transactions</p>
              ) : (
                transactions.slice(0, 5).map(txn => (
                  <div key={txn.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{format(new Date(txn.transaction_date), 'MMM dd, yyyy')}</p>
                      <p className="text-xs text-gray-500">{txn.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${txn.amount.toFixed(2)}</p>
                      <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {txn.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Overdue Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Overdue Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.filter(inv => inv.status === 'overdue').slice(0, 5).length === 0 ? (
                <p className="text-sm text-gray-500">No overdue accounts</p>
              ) : (
                invoices
                  .filter(inv => inv.status === 'overdue')
                  .sort((a, b) => b.balance - a.balance)
                  .slice(0, 5)
                  .map(inv => (
                    <div key={inv.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{inv.invoice_number}</p>
                        <p className="text-xs text-gray-500">
                          Due {format(new Date(inv.due_date), 'MMM dd')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">${inv.balance.toFixed(2)}</p>
                        <Button size="sm" variant="ghost" className="h-6 text-xs">
                          Send Reminder
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}