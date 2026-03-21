import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Loader2 } from "lucide-react";

export default function TimeOffHistory({ teacherEmail }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeOffRequests();
  }, [teacherEmail]);

  const loadTimeOffRequests = async () => {
    try {
      const timeOffRequests = await base44.entities.TimeOffRequest.filter({
        work_email: teacherEmail
      }, '-start_date', 100);
      setRequests(timeOffRequests || []);
    } catch (error) {
      console.error("Error loading time off requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500 text-center">No time-off requests on record</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold">
                    {new Date(request.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {request.start_date !== request.end_date && ` – ${new Date(request.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {request.full_day ? 'Full Day' : `${request.start_time} – ${request.end_time}`}
                    {' '} • {request.total_hours} hours
                  </span>
                </div>

                {request.reason_notes && (
                  <p className="text-sm text-gray-700 mb-3">{request.reason_notes}</p>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">PTO:</span>
                  <span>{request.use_pto ? '✓ Yes' : '✗ No'}</span>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <Badge className={getStatusColor(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(request.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}