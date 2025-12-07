import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Mail, Calendar, Bell } from 'lucide-react';

export default function TemplatesTab() {
  const templates = [
    {
      id: 1,
      name: 'Attendance Alert',
      description: 'Automatically notify parents when student is absent',
      icon: Bell,
      category: 'Attendance'
    },
    {
      id: 2,
      name: 'Grade Update Notification',
      description: 'Send email when grades are posted',
      icon: Mail,
      category: 'Academic'
    },
    {
      id: 3,
      name: 'Event Reminder',
      description: 'Send reminders before school events',
      icon: Calendar,
      category: 'Communication'
    },
    {
      id: 4,
      name: 'New Student Welcome',
      description: 'Automated onboarding workflow for new students',
      icon: Zap,
      category: 'Enrollment'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map(template => {
        const Icon = template.icon;
        return (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <Badge variant="secondary">{template.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <Button variant="outline" className="w-full">
                Use Template
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}