import React from 'react';
import { 
  Square, Clock, Mail, MessageSquare, Phone, 
  GitBranch, MoreHorizontal, Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const iconMap = {
  trigger: Square,
  wait: Clock,
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  condition: GitBranch,
  phone_check: Phone,
  filter: Filter
};

const colorMap = {
  trigger: 'bg-blue-50 border-blue-200 text-blue-700',
  wait: 'bg-green-50 border-green-200 text-green-700',
  email: 'bg-purple-50 border-purple-200 text-purple-700',
  sms: 'bg-green-50 border-green-200 text-green-700',
  call: 'bg-orange-50 border-orange-200 text-orange-700',
  condition: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  phone_check: 'bg-blue-50 border-blue-200 text-blue-700',
  filter: 'bg-pink-50 border-pink-200 text-pink-700'
};

export default function ActionNode({ action, isSelected, onSelect, onDelete }) {
  const Icon = iconMap[action.type] || Square;
  const colorClass = colorMap[action.type] || 'bg-gray-50 border-gray-200 text-gray-700';

  return (
    <div
      onClick={onSelect}
      className={`w-80 bg-white rounded-lg border-2 shadow-sm cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <div className={`w-10 h-10 rounded ${colorClass} flex items-center justify-center flex-shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{action.name}</div>
          {action.config?.subtext && (
            <div className="text-xs text-gray-500 truncate">{action.config.subtext}</div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSelect}>Edit</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Disable</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={onDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}