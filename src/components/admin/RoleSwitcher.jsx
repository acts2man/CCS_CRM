import React, { useState, useRef } from 'react';
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
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const selectedRef = useRef(false); // tracks whether a person was picked
  const navigate = useNavigate();

  if (user?.role !== 'admin') return null;

  const switchTo = (mode) => {
    setOpen(false);
    if (mode === 'admin') {
      navigate('/Dashboard');
    } else {
      selectedRef.current = false;
      setPendingMode(mode);
      setModalOpen(true);
    }
  };

  const handlePersonSelected = (person) => {
    selectedRef.current = true; // mark that selection happened
    const mode = pendingMode;
    setModalOpen(false);
    setPendingMode(null);
    // Navigate with the ID in the URL — no context, no state, just URL
    if (mode === 'teacher') navigate(`/TeacherClasses?teacherId=${person.id}`);
    else if (mode === 'student') navigate(`/StudentDashboard?studentId=${person.id}`);
    else if (mode === 'parent') navigate(`/ParentDashboard?parentId=${person.id}`);
  };

  const handleModalClose = () => {
    // Only close, never wipe anything — selection already handled navigate
    setModalOpen(false);
    setPendingMode(null);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            View As
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => switchTo('admin')}>Admin View</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => switchTo('teacher')}>Teacher View</DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchTo('student')}>Student View</DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchTo('parent')}>Parent View</DropdownMenuItem>
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