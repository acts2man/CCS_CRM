import React, { createContext, useContext, useState, useEffect } from 'react';

const ImpersonationContext = createContext(null);

const SESSION_KEY = 'impersonation_state';

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { person: null, mode: 'admin' };
}

function saveToSession(state) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {}
}

export function ImpersonationProvider({ children }) {
  const [state, setState] = useState(() => loadFromSession());

  const updateState = (newState) => {
    setState(newState);
    saveToSession(newState);
  };

  const startImpersonation = (person, mode) => {
    updateState({ person, mode: mode || 'admin' });
  };

  const stopImpersonation = () => {
    updateState({ person: null, mode: 'admin' });
  };

  const setViewMode = (mode) => {
    setState(prev => {
      const next = { ...prev, mode };
      saveToSession(next);
      return next;
    });
  };

  const { person, mode } = state;

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