import React from 'react';
import { useImpersonation } from '@/lib/ImpersonationContext';
import { X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ImpersonationBanner() {
  const { impersonatedTeacher, impersonatedStudent, viewMode, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();

  return null;
}