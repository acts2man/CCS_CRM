import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

/**
 * Single source of truth for resolving which teacher's data to show.
 * Priority: ?teacherId= URL param → logged-in user's own Teacher record
 */
export function useTeacherId() {
  const location = useLocation();
  const [teacherId, setTeacherId] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resolve();
  }, [location.search]); // re-run any time the query string changes

  const resolve = async () => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams(location.search);
      const paramId = urlParams.get('teacherId');

      if (paramId) {
        // Admin is viewing as a specific teacher via URL param
        const teachers = await base44.entities.Teacher.list();
        const found = teachers.find(t => t.id === paramId);
        setTeacherId(paramId);
        setTeacher(found || null);
      } else {
        // Real teacher logged in — find their record by email
        const currentUser = await base44.auth.me();
        const teachers = await base44.entities.Teacher.filter({ email: currentUser.email }, '', 1);
        const found = teachers?.[0] || null;
        setTeacherId(found?.id || null);
        setTeacher(found || null);
      }
    } catch (e) {
      console.error('useTeacherId error:', e);
    } finally {
      setLoading(false);
    }
  };

  return { teacherId, teacher, loading };
}