import React, { useState } from 'react';
import { useImpersonation } from '@/lib/ImpersonationContext';
import { useAuth } from '@/lib/AuthContext';
import { ChevronDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ImpersonationModal from '@/components/admin/ImpersonationModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function RoleSwitcher() {
  const { user } = useAuth();
  const { viewMode, setViewMode, startImpersonation, stopImpersonation } = useImpersonation();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const navigate = useNavigate();

  if (user?.role !== 'admin') return null;

  const roleLabels = {
    admin: 'Admin View',
    teacher: 'Teacher View',
    student: 'Student View',
    parent: 'Parent View'
  };

  const switchTo = (mode) => {
    setOpen(false);
    if (mode === 'admin') {
      stopImpersonation();
      navigate('/Dashboard');
    } else {
      setPendingMode(mode);
      setModalOpen(true);
    }
  };

  const handlePersonSelected = (person) => {
    const mode = pendingMode; // capture before clearing
    startImpersonation(person, mode);
    setModalOpen(false);
    setPendingMode(null);
    if (mode === 'teacher') navigate(`/TeacherClasses?teacherId=${person.id}`);
    else if (mode === 'student') navigate(`/StudentDashboard?studentId=${person.id}`);
    else if (mode === 'parent') navigate(`/ParentDashboard?parentId=${person.id}`);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setPendingMode(null);
    // Only reset viewMode if no person was selected (modal dismissed)
    stopImpersonation();
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            View as: {roleLabels[viewMode] || 'Admin'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => switchTo('admin')}>
            <span className={viewMode === 'admin' ? 'font-semibold' : ''}>{roleLabels.admin}</span>
            {viewMode === 'admin' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => switchTo('teacher')}>
            <span className={viewMode === 'teacher' ? 'font-semibold' : ''}>{roleLabels.teacher}</span>
            {viewMode === 'teacher' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchTo('student')}>
            <span className={viewMode === 'student' ? 'font-semibold' : ''}>{roleLabels.student}</span>
            {viewMode === 'student' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchTo('parent')}>
            <span className={viewMode === 'parent' ? 'font-semibold' : ''}>{roleLabels.parent}</span>
            {viewMode === 'parent' && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImpersonationModal
        open={modalOpen}
        onClose={handleModalClose}
        onSelect={handlePersonSelected}
        activeMode={pendingMode}
      />
    </>
  );
}