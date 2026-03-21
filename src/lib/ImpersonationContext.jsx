import React, { createContext, useContext, useState } from 'react';

const ImpersonationContext = createContext(null);

export function ImpersonationProvider({ children }) {
  const [impersonatedTeacher, setImpersonatedTeacher] = useState(null);
  const [viewMode, setViewMode] = useState('admin'); // 'admin', 'teacher', 'student', 'parent'

  const startImpersonation = (person) => {
    setImpersonatedTeacher(person);
    // Keep the current viewMode instead of forcing it to 'teacher'
  };

  const stopImpersonation = () => {
    setImpersonatedTeacher(null);
    setViewMode('admin');
  };

  return (
    <ImpersonationContext.Provider 
      value={{ 
        impersonatedTeacher, 
        startImpersonation, 
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