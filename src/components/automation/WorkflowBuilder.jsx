import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function WorkflowBuilder({ onCreateNew }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visual Workflow Builder</CardTitle>
        <p className="text-sm text-gray-600 font-normal">
          Create powerful automations with our drag-and-drop interface
        </p>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 rounded-lg p-16 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Plus className="h-10 w-10 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold mb-3">Build Your First Workflow</h2>
          <p className="text-gray-600 text-center max-w-md mb-8">
            Automate repetitive tasks and improve efficiency. Start by creating a new workflow or choose from our templates.
          </p>

          <div className="flex gap-3">
            <Button 
              className="bg-slate-900 hover:bg-slate-800"
              onClick={onCreateNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Workflow
            </Button>
            <Button variant="outline">
              Browse Templates
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}