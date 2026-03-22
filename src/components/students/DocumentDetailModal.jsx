import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, User, Tag } from 'lucide-react';
import { format } from 'date-fns';

const formatKey = (key) =>
  key?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

const statusColors = {
  submitted: 'bg-gray-100 text-gray-700',
  parent_notified: 'bg-blue-100 text-blue-700',
  acknowledged: 'bg-green-100 text-green-700',
  responded: 'bg-green-100 text-green-700',
  follow_up_sent: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-200 text-gray-600',
};

export default function DocumentDetailModal({ document, onClose }) {
  if (!document) return null;

  const formEntries = document.form_data ? Object.entries(document.form_data).filter(([, v]) => v !== '' && v !== null && v !== undefined) : [];

  return (
    <Dialog open={!!document} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
            {document.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Compact meta row */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 border-b pb-3">
            {document.submitted_by_name && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {document.submitted_by_name}
              </span>
            )}
            {document.created_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(document.created_date), 'MMM d, yyyy')}
              </span>
            )}
            {document.template_type && (
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {document.template_type.replace(/_/g, ' ')}
              </span>
            )}
            {document.status && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[document.status] || 'bg-gray-100 text-gray-600'}`}>
                {document.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Notes */}
          {document.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-sm text-gray-700">
              <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Notes</p>
              {document.notes}
            </div>
          )}

          {/* Parent Response */}
          {document.parent_response && (
            <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 text-sm text-gray-700">
              <p className="text-xs font-semibold text-green-600 mb-1 uppercase tracking-wide">Your Response</p>
              {document.parent_response}
            </div>
          )}

          {/* Form Data */}
          {formEntries.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Document Details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-50 rounded-lg p-3">
                {formEntries.map(([key, value]) => (
                  <div key={key} className="min-w-0">
                    <p className="text-xs text-gray-500">{formatKey(key)}</p>
                    <p className="text-sm font-medium text-gray-900 truncate" title={formatValue(value)}>{formatValue(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Download */}
          {document.file_url && (
            <a
              href={document.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Document
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}