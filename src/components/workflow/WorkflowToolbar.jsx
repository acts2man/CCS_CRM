import React from 'react';
import { 
  Square, Clock, Mail, MessageSquare, Phone, 
  GitBranch, Filter, FileText, Pencil
} from 'lucide-react';

export default function WorkflowToolbar() {
  const tools = [
    { icon: Square, label: 'Trigger', type: 'trigger' },
    { icon: Clock, label: 'Wait', type: 'wait' },
    { icon: Mail, label: 'Email', type: 'email' },
    { icon: MessageSquare, label: 'SMS', type: 'sms' },
    { icon: Phone, label: 'Call', type: 'call' },
    { icon: GitBranch, label: 'Condition', type: 'condition' },
    { icon: Filter, label: 'Filter', type: 'filter' },
    { icon: FileText, label: 'Note', type: 'note' },
    { icon: Pencil, label: 'Update', type: 'update' }
  ];

  return (
    <div className="w-16 bg-white border-r flex flex-col items-center py-4 gap-4">
      {tools.map((tool, index) => {
        const Icon = tool.icon;
        return (
          <button
            key={index}
            className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            title={tool.label}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}