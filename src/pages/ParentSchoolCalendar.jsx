import React from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ParentSchoolCalendar() {
  // Calendar embed code will be added here
  const calendarEmbedCode = null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Calendar className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Calendar</h1>
          <p className="text-gray-500 mt-0.5">Upcoming events, holidays, and important dates</p>
        </div>
      </div>

      {calendarEmbedCode ? (
        <div className="w-full rounded-xl overflow-hidden border" style={{ minHeight: 600 }}
          dangerouslySetInnerHTML={{ __html: calendarEmbedCode }}
        />
      ) : (
        <Card>
          <CardContent className="pt-16 pb-16 text-center">
            <Calendar className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Calendar coming soon</p>
            <p className="text-sm text-gray-400 mt-1">The school calendar will appear here once configured.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}