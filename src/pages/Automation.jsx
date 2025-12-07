import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import WorkflowBuilder from '@/components/automation/WorkflowBuilder';
import ActiveWorkflows from '@/components/automation/ActiveWorkflows';
import TemplatesTab from '@/components/automation/TemplatesTab';

export default function Automation() {
  const [activeTab, setActiveTab] = useState('builder');
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Automation & Workflows</h1>
          <p className="text-gray-600 mt-1">Create automated workflows to reduce manual tasks</p>
        </div>
        <Button 
          className="bg-slate-900 hover:bg-slate-800"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Workflow
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border-b w-full justify-start rounded-none h-auto p-0">
          <TabsTrigger 
            value="builder" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3"
          >
            Workflow Builder
          </TabsTrigger>
          <TabsTrigger 
            value="active"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3"
          >
            Active Workflows
          </TabsTrigger>
          <TabsTrigger 
            value="templates"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3"
          >
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-6">
          <WorkflowBuilder onCreateNew={() => setShowCreateModal(true)} />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <ActiveWorkflows />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}