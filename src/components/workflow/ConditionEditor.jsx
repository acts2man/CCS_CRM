import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ConditionEditor({ action, onClose, onUpdate }) {
  const [actionName, setActionName] = useState(action.name || '');
  const [field, setField] = useState(action.config?.field || '{{absence_count}}');
  const [operator, setOperator] = useState(action.config?.operator || '>=');
  const [value, setValue] = useState(action.config?.value || 5);

  const handleSave = () => {
    onUpdate({
      ...action,
      name: actionName,
      config: {
        ...action.config,
        field,
        operator,
        value: parseInt(value)
      }
    });
  };

  return (
    <div className="w-96 bg-white border-l flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Condition Configuration</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <Label>Condition Name</Label>
          <Input
            value={actionName}
            onChange={(e) => setActionName(e.target.value)}
            placeholder="Enter condition name"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Field to Check</Label>
          <Input
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Variable or field to evaluate (e.g., {`{{absence_count}}`})
          </p>
        </div>

        <div>
          <Label>Operator</Label>
          <Select value={operator} onValueChange={setOperator}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=">=">Greater than or equal (≥)</SelectItem>
              <SelectItem value=">">Greater than (&gt;)</SelectItem>
              <SelectItem value="==">Equal to (=)</SelectItem>
              <SelectItem value="<">Less than (&lt;)</SelectItem>
              <SelectItem value="<=">Less than or equal (≤)</SelectItem>
              <SelectItem value="!=">Not equal (≠)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Value to Compare</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Current Logic:</strong> If {field} {operator} {value}, the workflow will proceed to the next action.
          </p>
        </div>
      </div>

      <div className="border-t p-4 flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
          Save Condition
        </Button>
      </div>
    </div>
  );
}