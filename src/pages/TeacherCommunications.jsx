import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeacherCommunications() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunicationLogs();
  }, []);

  const loadCommunicationLogs = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Get communication logs initiated by this teacher
      const allLogs = await base44.entities.ParentCommunicationLog.list();
      const teacherLogs = allLogs.filter(log => log.initiated_by === currentUser.email);
      
      setLogs(teacherLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
      console.error("Error loading communication logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCommunicationIcon = (type) => {
    const icons = { email: Mail, sms: MessageSquare, phone_call: Phone, in_person: User };
    const Icon = icons[type] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const getCommunicationColor = (type) => {
    const colors = { email: 'bg-blue-100 text-blue-800', sms: 'bg-green-100 text-green-800', phone_call: 'bg-purple-100 text-purple-800', in_person: 'bg-orange-100 text-orange-800' };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600 mt-2">Parent communication history</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          New Communication
        </Button>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No communications yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCommunicationColor(log.communication_type)}>
                        {getCommunicationIcon(log.communication_type)}
                        <span className="ml-1 capitalize">{log.communication_type.replace('_', ' ')}</span>
                      </Badge>
                      <Badge variant="outline">{log.direction === 'outbound' ? 'Sent' : 'Received'}</Badge>
                    </div>
                    <div className="font-medium mb-1">{log.parent_name}</div>
                    <div className="text-sm text-gray-600 mb-2">Student: {log.student_name}</div>
                    {log.subject && (
                      <div className="text-sm font-medium mb-2">{log.subject}</div>
                    )}
                    {log.message && (
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-2 line-clamp-3">
                        {log.message}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {log.parent_phone && (
                    <div className="text-right text-sm">
                      <div className="text-gray-600">{log.parent_phone}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}