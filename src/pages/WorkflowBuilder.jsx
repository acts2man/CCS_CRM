import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Send, Play, Pencil, Save } from 'lucide-react';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import WorkflowToolbar from '@/components/workflow/WorkflowToolbar';
import ActionEditor from '@/components/workflow/ActionEditor';
import TriggerModal from '@/components/workflow/TriggerModal';

export default function WorkflowBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get('id');
  
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actions, setActions] = useState([]);
  const [showTriggerModal, setShowTriggerModal] = useState(false);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow();
    }
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      const workflow = await base44.entities.Automation.filter({ id: workflowId });
      if (workflow.length > 0) {
        setWorkflowName(workflow[0].name);
        setIsPublished(workflow[0].status === 'active');
        
        const steps = await base44.entities.AutomationStep.filter(
          { automation_id: workflowId },
          'order_position'
        );
        setActions(steps.map(step => ({
          id: step.id,
          type: step.step_type,
          name: step.description || step.step_type,
          position: step.order_position,
          config: step.step_data,
          enabled: step.is_enabled
        })));
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
    }
  };

  const handleAddTrigger = (triggerType, triggerConfig) => {
    const newTrigger = {
      id: Date.now().toString(),
      type: 'trigger',
      name: triggerConfig.name,
      position: 0,
      config: triggerConfig
    };
    setActions([newTrigger, ...actions.map(a => ({ ...a, position: a.position + 1 }))]);
    setShowTriggerModal(false);
  };

  const handleAddAction = (afterPosition, actionType) => {
    const newAction = {
      id: Date.now().toString(),
      type: actionType,
      name: actionType.charAt(0).toUpperCase() + actionType.slice(1),
      position: afterPosition + 0.5,
      config: {}
    };
    setActions([...actions, newAction].sort((a, b) => a.position - b.position).map((a, i) => ({
      ...a,
      position: i
    })));
  };

  const handleDeleteAction = (actionId) => {
    setActions(actions.filter(a => a.id !== actionId).map((a, i) => ({
      ...a,
      position: i
    })));
    if (selectedAction?.id === actionId) {
      setSelectedAction(null);
    }
  };

  const handleUpdateAction = (updatedAction) => {
    setActions(actions.map(a => a.id === updatedAction.id ? updatedAction : a));
    setSelectedAction(updatedAction);
  };

  const handleSaveWorkflow = async () => {
    try {
      await base44.entities.Automation.update(workflowId, {
        name: workflowName,
        status: isPublished ? 'active' : 'paused'
      });

      for (const action of actions) {
        if (typeof action.id === 'string' && !action.id.match(/^[0-9a-f]{24}$/i)) {
          await base44.entities.AutomationStep.create({
            automation_id: workflowId,
            step_type: action.type,
            step_data: action.config || {},
            order_position: action.position,
            is_enabled: action.enabled !== false,
            description: action.name
          });
        } else {
          await base44.entities.AutomationStep.update(action.id, {
            step_data: action.config || {},
            order_position: action.position,
            is_enabled: action.enabled !== false,
            description: action.name
          });
        }
      }

      alert('Workflow saved successfully');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    }
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
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="font-medium">Publish</span>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSaveWorkflow}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
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
          <WorkflowToolbar onAddAction={(type) => {
            if (actions.length > 0) {
              handleAddAction(actions[actions.length - 1].position, type);
            }
          }} />
          
          {/* Canvas */}
          <div className="flex-1 bg-gray-50 relative overflow-auto">
            <WorkflowCanvas 
              actions={actions}
              selectedAction={selectedAction}
              onSelectAction={setSelectedAction}
              onAddAction={handleAddAction}
              onAddTrigger={() => setShowTriggerModal(true)}
              onDeleteAction={handleDeleteAction}
            />
          </div>

          {/* Right Panel */}
          {selectedAction && (
            <ActionEditor 
              action={selectedAction}
              onClose={() => setSelectedAction(null)}
              onUpdate={handleUpdateAction}
            />
          )}
        </TabsContent>

        <TriggerModal
          open={showTriggerModal}
          onClose={() => setShowTriggerModal(false)}
          onSelect={handleAddTrigger}
        />

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