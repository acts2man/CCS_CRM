import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FinanceOverviewTab from '@/components/finance/FinanceOverviewTab';
import FinanceInvoicesTab from '@/components/finance/FinanceInvoicesTab';
import FinancePaymentLinksTab from '@/components/finance/FinancePaymentLinksTab';
import FinanceTransactionsTab from '@/components/finance/FinanceTransactionsTab';
import FinanceProductsTab from '@/components/finance/FinanceProductsTab';
import FinanceDocumentsTab from '@/components/finance/FinanceDocumentsTab';
import FinanceSettingsTab from '@/components/finance/FinanceSettingsTab';

export default function Finance() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Finance & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage invoices, payments, and financial operations</p>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 px-6">
            <TabsTrigger 
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="invoices"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
            >
              Invoices
            </TabsTrigger>
            <TabsTrigger 
              value="payment-links"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
            >
              Payment Links
            </TabsTrigger>
            <TabsTrigger 
              value="transactions"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger 
              value="products"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
            >
              Products & Fees
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="m-0">
            <FinanceOverviewTab />
          </TabsContent>

          <TabsContent value="invoices" className="m-0">
            <FinanceInvoicesTab />
          </TabsContent>

          <TabsContent value="payment-links" className="m-0">
            <FinancePaymentLinksTab />
          </TabsContent>

          <TabsContent value="transactions" className="m-0">
            <FinanceTransactionsTab />
          </TabsContent>

          <TabsContent value="products" className="m-0">
            <FinanceProductsTab />
          </TabsContent>

          <TabsContent value="documents" className="m-0">
            <FinanceDocumentsTab />
          </TabsContent>

          <TabsContent value="settings" className="m-0">
            <FinanceSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}