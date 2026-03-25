import React, { createContext, useContext, useState } from 'react';

const ImpersonationContext = createContext(null);

export function ImpersonationProvider({ children }) {
  // Single atomic state to avoid race conditions between viewMode and impersonatedPerson
  const [state, setState] = useState({ person: null, mode: 'admin' });

  const startImpersonation = (person, mode) => {
    setState({ person, mode: mode || 'admin' });
  };

  const stopImpersonation = () => {
    setState({ person: null, mode: 'admin' });
  };

  const setViewMode = (mode) => {
    setState(prev => ({ ...prev, mode }));
  };

  const { person, mode } = state;

  // Convenience getters by role
  const impersonatedTeacher = mode === 'teacher' ? person : null;
  const impersonatedStudent = mode === 'student' ? person : null;
  const impersonatedParent  = mode === 'parent'  ? person : null;

  return (
    <ImpersonationContext.Provider 
      value={{ 
        impersonatedPerson: person,
        impersonatedTeacher,
        impersonatedStudent,
        impersonatedParent,
        startImpersonation,
        startStudentImpersonation: (student) => startImpersonation(student, 'student'),
        stopImpersonation,
        viewMode: mode,
        setViewMode,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}