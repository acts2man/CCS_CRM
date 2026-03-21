import React from 'react';
import { useImpersonation } from '@/lib/ImpersonationContext';
import { X, Eye } from 'lucide-react';

export default function ImpersonationBanner() {
  const { impersonatedTeacher, stopImpersonation } = useImpersonation();

  if (!impersonatedTeacher) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="h-4 w-4" />
        You are viewing the platform as <span className="font-bold">{impersonatedTeacher.first_name} {impersonatedTeacher.last_name}</span>
        {impersonatedTeacher.email && <span className="opacity-75">({impersonatedTeacher.email})</span>}
      </div>
      <button
        onClick={stopImpersonation}
        className="flex items-center gap-1.5 bg-white text-amber-700 text-sm font-semibold px-3 py-1 rounded-full hover:bg-amber-50 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
        Exit Teacher View
      </button>
    </div>
  );
}