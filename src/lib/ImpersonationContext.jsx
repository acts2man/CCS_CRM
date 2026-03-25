import React, { createContext, useContext, useState } from 'react';

const ImpersonationContext = createContext(null);

export function ImpersonationProvider({ children }) {
  const [impersonatedPerson, setImpersonatedPerson] = useState(null);
  const [viewMode, setViewMode] = useState('admin'); // 'admin', 'teacher', 'student', 'parent'

  const startImpersonation = (person, mode) => {
    setImpersonatedPerson(person);
    if (mode) setViewMode(mode);
  };

  const stopImpersonation = () => {
    setImpersonatedPerson(null);
    setViewMode('admin');
  };

  // Convenience getters by role
  const impersonatedTeacher = viewMode === 'teacher' ? impersonatedPerson : null;
  const impersonatedStudent = viewMode === 'student' ? impersonatedPerson : null;
  const impersonatedParent = viewMode === 'parent' ? impersonatedPerson : null;

  return (
    <ImpersonationContext.Provider 
      value={{ 
        impersonatedPerson,
        impersonatedTeacher,
        impersonatedStudent,
        impersonatedParent,
        startImpersonation,
        // keep legacy alias
        startStudentImpersonation: (student) => startImpersonation(student, 'student'),
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