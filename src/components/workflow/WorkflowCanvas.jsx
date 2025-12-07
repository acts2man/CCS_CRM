import React, { useState } from 'react';
import { Plus, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActionNode from './ActionNode';

export default function WorkflowCanvas({ actions, selectedAction, onSelectAction, onAddAction }) {
  const [zoom, setZoom] = useState(100);

  return (
    <div className="relative w-full h-full">
      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-4 bg-white border rounded-lg shadow-sm p-1 flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setZoom(Math.min(150, zoom + 10))}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <div className="text-xs text-center py-1 font-medium">{zoom}%</div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setZoom(Math.max(50, zoom - 10))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="border-t pt-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(100)}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Content */}
      <div 
        className="flex flex-col items-center py-12 px-4"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
      >
        {actions.map((action, index) => (
          <React.Fragment key={action.id}>
            <ActionNode
              action={action}
              isSelected={selectedAction?.id === action.id}
              onSelect={() => onSelectAction(action)}
            />
            
            {index < actions.length - 1 && (
              <div className="flex flex-col items-center my-2">
                <div className="w-px h-8 bg-gray-300"></div>
                <button
                  className="w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  onClick={() => onAddAction(action.id, 'action')}
                >
                  <Plus className="h-3 w-3 text-gray-500" />
                </button>
                <div className="w-px h-8 bg-gray-300"></div>
              </div>
            )}
          </React.Fragment>
        ))}
        
        {/* Add New Action at End */}
        <div className="flex flex-col items-center mt-2">
          <div className="w-px h-8 bg-gray-300"></div>
          <button className="px-4 py-2 bg-white border-2 border-dashed border-blue-400 rounded-lg flex items-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors">
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Add New Trigger</span>
          </button>
        </div>
      </div>
    </div>
  );
}