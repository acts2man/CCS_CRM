import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Plus, Download, FileText } from 'lucide-react';

export default function FinanceDocumentsTab() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual queries
  const documents = [
    {
      id: 1,
      title: 'Web Design Proposal for Sheldon Joseph',
      status: 'Draft',
      customer: 'Sheldon Joseph',
      dateModified: 'Oct 16, 2025 11:28 PM',
      value: '$1,097.50'
    },
    {
      id: 2,
      title: 'Web Design Proposal for Murazza Muhammad',
      status: 'Draft',
      customer: 'Murazza M.',
      dateModified: 'Aug 25, 2025 03:57 PM',
      value: '$798.50'
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Documents & Contracts</h2>
          <p className="text-sm text-gray-500">Manage and oversee all documents & contracts created for your business</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="draft" className="w-full">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start p-0 h-auto">
          <TabsTrigger 
            value="draft"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2"
          >
            Draft <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">4</span>
          </TabsTrigger>
          <TabsTrigger 
            value="waiting"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2"
          >
            Waiting for others <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">0</span>
          </TabsTrigger>
          <TabsTrigger 
            value="completed"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2"
          >
            Completed <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">28</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payments"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2"
          >
            Payments <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">25</span>
          </TabsTrigger>
          <TabsTrigger 
            value="archived"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2"
          >
            Archived <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">0</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draft" className="mt-6">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="p-4 font-medium">Title</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Date modified</th>
                    <th className="p-4 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No documents found
                      </td>
                    </tr>
                  ) : (
                    documents.map(doc => (
                      <tr key={doc.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                              <FileText className="h-4 w-4 text-gray-500" />
                            </div>
                            <span className="text-sm font-medium text-blue-600">{doc.title}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">{doc.status}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium">
                              {doc.customer.charAt(0)}
                            </div>
                            <span className="text-sm">{doc.customer}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {doc.dateModified}
                        </td>
                        <td className="p-4 font-medium text-sm">
                          {doc.value}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="waiting" className="mt-6">
          <Card>
            <div className="p-8 text-center text-gray-500">
              No documents waiting for others
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card>
            <div className="p-8 text-center text-gray-500">
              No completed documents
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <div className="p-8 text-center text-gray-500">
              No payment documents
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          <Card>
            <div className="p-8 text-center text-gray-500">
              No archived documents
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}