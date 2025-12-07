import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash, Settings } from 'lucide-react';

export default function FinanceSettingsTab() {
  const { data: taxRates = [] } = useQuery({
    queryKey: ['tax-rates'],
    queryFn: () => base44.entities.TaxRate.list(),
  });

  const { data: gateways = [] } = useQuery({
    queryKey: ['payment-gateways'],
    queryFn: () => base44.entities.PaymentGateway.list(),
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Payment Settings</h2>

      <div className="space-y-6">
        {/* Payment Gateways */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Integrations</CardTitle>
            <CardDescription>Connect your payment processors to accept online payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stripe */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                  <span className="text-purple-600 font-bold">S</span>
                </div>
                <div>
                  <h3 className="font-semibold">Stripe</h3>
                  <p className="text-sm text-gray-500">Accept credit cards and online payments</p>
                  {gateways.find(g => g.gateway_type === 'stripe')?.is_connected && (
                    <Badge variant="secondary" className="mt-1">Connected</Badge>
                  )}
                </div>
              </div>
              <Button variant="outline">
                {gateways.find(g => g.gateway_type === 'stripe')?.is_connected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>

            {/* PayPal */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-blue-600 font-bold">PP</span>
                </div>
                <div>
                  <h3 className="font-semibold">PayPal</h3>
                  <p className="text-sm text-gray-500">Accept PayPal payments</p>
                  {gateways.find(g => g.gateway_type === 'paypal')?.is_connected && (
                    <Badge variant="secondary" className="mt-1">Connected</Badge>
                  )}
                </div>
              </div>
              <Button variant="outline">
                {gateways.find(g => g.gateway_type === 'paypal')?.is_connected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tax Settings</CardTitle>
                <CardDescription>Manage tax rates applied to invoices</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Tax
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {taxRates.length === 0 ? (
              <p className="text-sm text-gray-500">No tax rates configured</p>
            ) : (
              <div className="space-y-2">
                {taxRates.map(tax => (
                  <div key={tax.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{tax.name}</p>
                      <p className="text-sm text-gray-500">{tax.rate}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={tax.is_active} />
                      <Button variant="ghost" size="icon">
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminder Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Reminders</CardTitle>
            <CardDescription>Automatically send payment reminders to parents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send reminder before due date</Label>
                <p className="text-sm text-gray-500">Send a reminder 3 days before invoice is due</p>
              </div>
              <Switch />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send reminder on due date</Label>
                <p className="text-sm text-gray-500">Send a reminder on the invoice due date</p>
              </div>
              <Switch />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send overdue reminders</Label>
                <p className="text-sm text-gray-500">Send reminders every 7 days after invoice is overdue</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure invoice and payment defaults</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Invoice Prefix</Label>
                <Input placeholder="INV-" defaultValue="INV-" />
              </div>
              
              <div className="space-y-2">
                <Label>Default Payment Terms (days)</Label>
                <Input type="number" placeholder="30" defaultValue="30" />
              </div>
              
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input disabled value="USD" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}