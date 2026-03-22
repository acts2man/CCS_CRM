import React from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ParentSchoolCalendar() {
  // Calendar embed code will be added here
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

      <div className="w-full rounded-xl overflow-hidden border bg-white">
        <iframe
          src="https://calendar.google.com/calendar/embed?src=qk7ft793ish6p66d9u3otl6pkg%40group.calendar.google.com&ctz=America%2FLos_Angeles"
          style={{ border: 0 }}
          width="100%"
          height="600"
          frameBorder="0"
          scrolling="no"
          title="School Calendar"
        />
      </div>
    </div>
  );
}