import React, { createContext, useContext, useState } from 'react';

const ImpersonationContext = createContext(null);

export function ImpersonationProvider({ children }) {
  const [impersonatedTeacher, setImpersonatedTeacher] = useState(null);
  const [impersonatedStudent, setImpersonatedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('admin'); // 'admin', 'teacher', 'student', 'parent'

  const startImpersonation = (person, mode) => {
    setImpersonatedTeacher(person);
    if (mode) setViewMode(mode);
  };

  const startStudentImpersonation = (student) => {
    setImpersonatedStudent(student);
    setViewMode('student');
  };

  const stopImpersonation = () => {
    setImpersonatedTeacher(null);
    setImpersonatedStudent(null);
    setViewMode('admin');
  };

  return (
    <ImpersonationContext.Provider 
      value={{ 
        impersonatedTeacher,
        impersonatedStudent,
        startImpersonation,
        startStudentImpersonation,
        stopImpersonation,
        viewMode,
        setViewMode
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}