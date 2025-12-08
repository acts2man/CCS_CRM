import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import TriggerEditor from './TriggerEditor';
import ConditionEditor from './ConditionEditor';
import EmailEditor from './EmailEditor';

export default function ActionEditor({ action, onClose, onUpdate }) {
  // Route to appropriate editor based on action type
  if (action.type === 'trigger') {
    return <TriggerEditor action={action} onClose={onClose} onUpdate={onUpdate} />;
  }
  
  if (action.type === 'condition') {
    return <ConditionEditor action={action} onClose={onClose} onUpdate={onUpdate} />;
  }
  
  if (action.type === 'action' && action.config?.action_type === 'send_email') {
    return <EmailEditor action={action} onClose={onClose} onUpdate={onUpdate} />;
  }

  // Default editor for other action types
  const [actionName, setActionName] = useState(action.name || '');
  const [config, setConfig] = useState(action.config || {});

  const handleSave = () => {
    onUpdate({
      ...action,
      name: actionName,
      config: config
    });
  };

  const getActionTypeDisplay = () => {
    const typeMap = {
      trigger: 'Trigger',
      action: 'Action',
      condition: 'Condition',
      email: 'Email',
      sms: 'SMS',
      wait: 'Wait',
      calculate: 'Calculate'
    };
    return typeMap[action.type] || action.type;
  };

  return (
    <div className="w-96 bg-white border-l flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold capitalize">{getActionTypeDisplay()}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="action" className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="bg-transparent h-auto p-0 w-full">
            <TabsTrigger 
              value="action"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent py-2 text-xs"
            >
              Last Action
            </TabsTrigger>
            <TabsTrigger 
              value="statistics"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent py-2 text-xs"
            >
              Statistics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="action" className="flex-1 overflow-auto m-0">
          <div className="p-4 space-y-4">
            {/* Action Name */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">NAME / DESCRIPTION</Label>
              <Input
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                className="mt-1"
                placeholder="Enter action name"
              />
            </div>

            {/* Configuration Details */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-gray-700">CONFIGURATION</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                This action is part of your automated truancy workflow. Edit the configuration in the database or workflow settings to modify behavior.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="flex-1 overflow-auto p-4 m-0">
          <p className="text-sm text-gray-600">Statistics will appear here once the workflow is active.</p>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="border-t p-4 flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
          Save Action
        </Button>
      </div>
    </div>
  );
}