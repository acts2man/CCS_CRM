import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download } from 'lucide-react';

export default function ReportCenter() {
  const reports = [
    { title: 'Student Enrollment Report', description: 'Current enrollment statistics by grade' },
    { title: 'Attendance Summary', description: 'Monthly attendance rates and trends' },
    { title: 'Grade Distribution', description: 'Academic performance across all classes' },
    { title: 'Financial Report', description: 'Payment status and revenue overview' },
    { title: 'Teacher Performance', description: 'Teaching effectiveness metrics' },
    { title: 'Parent Engagement', description: 'Communication and involvement statistics' },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Report Center</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}