import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink, X } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentDetailModal({ document, onClose }) {
  if (!document) return null;

  return (
    <Dialog open={!!document} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            {document.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Info */}
          <div className="space-y-3 border-b pb-4">
            {document.submitted_by_name && (
              <div>
                <p className="text-sm text-gray-600">From</p>
                <p className="font-medium">{document.submitted_by_name}</p>
              </div>
            )}

            {document.template_type && (
              <div>
                <p className="text-sm text-gray-600">Document Type</p>
                <Badge variant="outline" className="capitalize">
                  {document.template_type?.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}

            {document.created_date && (
              <div>
                <p className="text-sm text-gray-600">Received</p>
                <p className="font-medium">{format(new Date(document.created_date), 'MMM d, yyyy')}</p>
              </div>
            )}

            {document.status && (
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge 
                  variant={
                    document.status === 'closed' ? 'default' :
                    document.status === 'responded' ? 'default' :
                    'secondary'
                  }
                  className="capitalize"
                >
                  {document.status?.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}
          </div>

          {/* Notes */}
          {document.notes && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Notes</p>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{document.notes}</p>
            </div>
          )}

          {/* Parent Response */}
          {document.parent_response && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Parent Response</p>
              <p className="text-gray-700 bg-green-50 p-3 rounded">{document.parent_response}</p>
            </div>
          )}

          {/* Form Data */}
          {document.form_data && Object.keys(document.form_data).length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Document Details</p>
              <div className="bg-gray-50 p-3 rounded space-y-2">
                {Object.entries(document.form_data).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-gray-600 capitalize">{key?.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Download */}
          {document.file_url && (
            <div className="border-t pt-4">
              <a 
                href={document.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Document
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}