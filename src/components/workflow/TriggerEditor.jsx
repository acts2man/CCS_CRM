import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TriggerEditor({ action, onClose, onUpdate }) {
  const [actionName, setActionName] = useState(action.name || '');
  const [status, setStatus] = useState(action.config?.conditions?.status?.[0] || 'absent');

  const handleSave = () => {
    onUpdate({
      ...action,
      name: actionName,
      config: {
        ...action.config,
        conditions: {
          status: [status]
        }
      }
    });
  };

  return (
    <div className="w-96 bg-white border-l flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Trigger Configuration</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <Label>Trigger Name</Label>
          <Input
            value={actionName}
            onChange={(e) => setActionName(e.target.value)}
            placeholder="Enter trigger name"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Trigger Type</Label>
          <Input
            value="Attendance Marked"
            disabled
            className="mt-1 bg-gray-50"
          />
        </div>

        <div>
          <Label>Attendance Status to Monitor</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="excused">Excused</SelectItem>
              <SelectItem value="tardy">Tardy</SelectItem>
              <SelectItem value="early_dismissal">Early Dismissal</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            This workflow will trigger when attendance is marked as the selected status.
          </p>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>How it works:</strong> When a teacher marks a student as absent or excused, this workflow will automatically count their total absences and send warning emails if they've reached 5, 10, or 15 absences.
          </p>
        </div>
      </div>

      <div className="border-t p-4 flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
          Save Trigger
        </Button>
      </div>
    </div>
  );
}