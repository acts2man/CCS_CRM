import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Calendar, CheckCircle } from "lucide-react";

export default function DocumentDetailModal({ doc, open, onClose }) {
  if (!doc) return null;

  const statusColor = doc.parent_acknowledged
    ? 'bg-green-100 text-green-800'
    : doc.parent_notified
    ? 'bg-blue-100 text-blue-800'
    : 'bg-gray-100 text-gray-600';

  const statusLabel = doc.parent_acknowledged
    ? 'Acknowledged'
    : doc.parent_notified
    ? 'Parent Notified'
    : 'Submitted';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            {doc.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-b pb-4">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Filed by: <strong>{doc.submitted_by_name || doc.submitted_by || 'Unknown'}</strong></span>
            </div>
            {doc.created_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(doc.created_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
            <Badge className={statusColor}>{statusLabel}</Badge>
          </div>

          {/* Form data */}
          {doc.form_data && Object.keys(doc.form_data).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Report Details</h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(doc.form_data)
                      .filter(([k]) => k !== 'student_id')
                      .map(([key, value]) => (
                        <tr key={key} className="border-b last:border-0">
                          <td className="px-4 py-2 bg-gray-50 font-medium text-gray-600 w-40">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </td>
                          <td className="px-4 py-2 text-gray-800">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {doc.notes && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border-l-4 border-slate-400">
                {doc.notes}
              </div>
            </div>
          )}

          {/* Parent acknowledgment */}
          {doc.parent_acknowledged && doc.parent_acknowledged_at && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
              <CheckCircle className="h-4 w-4" />
              <span>Parent acknowledged on {new Date(doc.parent_acknowledged_at).toLocaleDateString()}</span>
            </div>
          )}

          {/* Attached file */}
          {doc.file_url && (
            <div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm"
              >
                View Attached File
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}