import React from 'react';
import { useImpersonation } from '@/lib/ImpersonationContext';
import { X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ImpersonationBanner() {
  const { impersonatedTeacher, impersonatedStudent, viewMode, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();

  // Show banner whenever admin is viewing as another role (with or without specific person selected)
  if (viewMode === 'admin') return null;
  if (impersonatedStudent) return null;

  const modeLabels = { teacher: 'Teacher View', student: 'Student View', parent: 'Parent View' };
  const modeLabel = modeLabels[viewMode] || viewMode;

  const personLabel = impersonatedTeacher
    ? `: ${impersonatedTeacher.first_name} ${impersonatedTeacher.last_name}`
    : '';

  const handleExit = () => {
    stopImpersonation();
    navigate('/Dashboard');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="h-4 w-4" />
        Viewing as <span className="font-bold">{modeLabel}{personLabel}</span>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 bg-white text-amber-700 text-sm font-semibold px-3 py-1 rounded-full hover:bg-amber-50 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
        Exit View
      </button>
    </div>
  );
}