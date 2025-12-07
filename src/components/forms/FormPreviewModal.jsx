import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function FormPreviewModal({ form, onClose }) {
  if (!form) return null;

  return (
    <Dialog open={!!form} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-600">{form.description}</p>
          <div className="border rounded-lg p-6 bg-gray-50">
            <p className="text-sm text-gray-500">Form preview coming soon...</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}