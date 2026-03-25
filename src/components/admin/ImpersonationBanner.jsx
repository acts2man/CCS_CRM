import React from 'react';
import { useImpersonation } from '@/lib/ImpersonationContext';
import { X, Eye } from 'lucide-react';

export default function ImpersonationBanner() {
  const { impersonatedTeacher, impersonatedStudent, viewMode, stopImpersonation } = useImpersonation();

  // Hide banner when viewing as student (student exit button is on dashboard)
  if (!impersonatedTeacher && !impersonatedStudent) return null;
  if (impersonatedStudent) return null;

  const modeLabels = {
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent'
  };

  const modeLabel = modeLabels[viewMode] || viewMode;

  // Banner is replaced by Exit View button in TeacherLayout sidebar
  return null;
}