import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getStudentByUserEmail } from '@/lib/entitySyncUtils';

/**
 * Single source of truth for resolving which student's data to show.
 * Priority: ?studentId= URL param → logged-in user's own Student record
 */
export function useStudentId() {
  const location = useLocation();
  const [studentId, setStudentId] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resolve();
  }, [location.search]); // re-run any time the query string changes

  const resolve = async () => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams(location.search);
      const paramId = urlParams.get('studentId');

      if (paramId) {
        // Admin is viewing as a specific student via URL param
        const students = await base44.entities.Student.list();
        const found = students.find(s => s.id === paramId);
        setStudentId(paramId);
        setStudent(found || null);
      } else {
        // Real student logged in — find their record by email
        const currentUser = await base44.auth.me();
        const { student: found } = await getStudentByUserEmail(currentUser.email);
        setStudentId(found?.id || null);
        setStudent(found || null);
      }
    } catch (e) {
      console.error('useStudentId error:', e);
    } finally {
      setLoading(false);
    }
  };

  return { studentId, student, loading };
}