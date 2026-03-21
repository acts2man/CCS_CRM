import React, { createContext, useContext, useState } from 'react';

const ImpersonationContext = createContext(null);

export function ImpersonationProvider({ children }) {
  const [impersonatedTeacher, setImpersonatedTeacher] = useState(null);

  const startImpersonation = (teacher) => {
    setImpersonatedTeacher(teacher);
  };

  const stopImpersonation = () => {
    setImpersonatedTeacher(null);
  };

  return (
    <ImpersonationContext.Provider value={{ impersonatedTeacher, startImpersonation, stopImpersonation }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}