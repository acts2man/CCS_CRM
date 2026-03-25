import React from 'react';
import { useImpersonation } from '@/lib/ImpersonationContext';

export default function ImpersonationBanner() {
  const { impersonatedTeacher, impersonatedStudent, viewMode, stopImpersonation } = useImpersonation();

  return null;
}