import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Phone, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CommunicationHistoryTab({ studentId }) {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunications();
  }, [studentId]);

  const loadCommunications = async () => {
    try {
      const data = await base44.entities.ParentCommunicationLog.filter(
        { student_id: studentId },
        '-timestamp',
        100
      );
      setCommunications(data);
    } catch (error) {
      console.error('Error loading communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'phone_call':
        return <Phone className="h-4 w-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (communications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500 text-center py-8">No communication history yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {communications.map((comm) => (
        <Card key={comm.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getTypeIcon(comm.communication_type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-gray-900">
                    {comm.communication_type.charAt(0).toUpperCase() + comm.communication_type.slice(1)}
                  </div>
                  {comm.subject && <span className="text-sm text-gray-600">— {comm.subject}</span>}
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <p>
                    <strong>To:</strong> {comm.parent_name}
                    {comm.parent_email && ` (${comm.parent_email})`}
                    {comm.parent_phone && ` (${comm.parent_phone})`}
                  </p>
                  <p>
                    <strong>From:</strong> {comm.initiated_by_name}
                  </p>
                </div>

                {comm.message && (
                  <div className="bg-gray-50 rounded p-3 mb-2 max-h-20 overflow-hidden">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {comm.message}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {getStatusBadge(comm.status)}
                  <span>
                    {new Date(comm.timestamp).toLocaleDateString()} at{' '}
                    {new Date(comm.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {comm.notes && (
                  <p className="text-xs text-orange-600 mt-2">Note: {comm.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}