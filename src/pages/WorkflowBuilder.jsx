import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Send, Play, Pencil } from 'lucide-react';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import WorkflowToolbar from '@/components/workflow/WorkflowToolbar';
import ActionEditor from '@/components/workflow/ActionEditor';

export default function WorkflowBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get('id');
  
  const [workflowName, setWorkflowName] = useState('FB Appointment Booked');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actions, setActions] = useState([
    { id: '1', type: 'trigger', name: 'Trigger', subtext: 'Submit Form Submitted', position: 0 },
    { id: '2', type: 'wait', name: 'Wait', position: 1 },
    { id: '3', type: 'sms', name: 'Send SMS Added', position: 2 },
    { id: '4', type: 'email', name: 'Email notification', position: 3 },
    { id: '5', type: 'sms', name: 'SMS Notification', position: 4 },
    { id: '6', type: 'phone_check', name: 'Phone Check contact into CRM', position: 5 }
  ]);

  const handleAddAction = (afterId, actionType) => {
    const newAction = {
      id: Date.now().toString(),
      type: actionType,
      name: actionType.charAt(0).toUpperCase() + actionType.slice(1),
      position: actions.find(a => a.id === afterId).position + 0.5
    };
    setActions([...actions, newAction].sort((a, b) => a.position - b.position));
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </button>
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                className="h-8 w-64"
                autoFocus
              />
            ) : (
              <>
                <h1 className="text-lg font-semibold">{workflowName}</h1>
                <button onClick={() => setIsEditingName(true)}>
                  <Pencil className="h-3 w-3 text-gray-400" />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Play className="h-4 w-4 mr-1" />
            Test Workflow
          </Button>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm">
            <span className="font-medium">Draft</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="font-medium">Publish</span>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="builder" className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="bg-transparent h-auto p-0">
            <TabsTrigger 
              value="builder"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3 text-sm"
            >
              Builder
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3 text-sm"
            >
              Settings
            </TabsTrigger>
            <TabsTrigger 
              value="enrollment"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3 text-sm"
            >
              Enrollment History
            </TabsTrigger>
            <TabsTrigger 
              value="logs"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3 text-sm"
            >
              Execution Logs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="builder" className="flex-1 flex m-0 overflow-hidden">
          {/* Left Toolbar */}
          <WorkflowToolbar />
          
          {/* Canvas */}
          <div className="flex-1 bg-gray-50 relative overflow-auto">
            <WorkflowCanvas 
              actions={actions}
              selectedAction={selectedAction}
              onSelectAction={setSelectedAction}
              onAddAction={handleAddAction}
            />
          </div>

          {/* Right Panel */}
          {selectedAction && (
            <ActionEditor 
              action={selectedAction}
              onClose={() => setSelectedAction(null)}
              onUpdate={(updatedAction) => {
                setActions(actions.map(a => 
                  a.id === updatedAction.id ? updatedAction : a
                ));
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Workflow Settings</h2>
            <p className="text-gray-600">Configure workflow settings here.</p>
          </div>
        </TabsContent>

        <TabsContent value="enrollment" className="flex-1 p-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Enrollment History</h2>
            <p className="text-gray-600">View enrollment history here.</p>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="flex-1 p-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Execution Logs</h2>
            <p className="text-gray-600">View execution logs here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}