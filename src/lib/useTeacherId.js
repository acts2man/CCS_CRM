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
      console.log('[useTeacherId] URL param teacherId:', paramId);

      if (paramId) {
        // Admin is viewing as a specific teacher via URL param
        console.log('[useTeacherId] Using URL param teacherId');
        const teachers = await base44.entities.Teacher.list();
        const found = teachers.find(t => t.id === paramId);
        console.log('[useTeacherId] Found teacher:', found?.id, found?.first_name, found?.last_name);
        setTeacherId(paramId);
        setTeacher(found || null);
      } else {
        // Real teacher logged in — find their record by email
        console.log('[useTeacherId] No URL param, looking up logged-in teacher');
        const currentUser = await base44.auth.me();
        console.log('[useTeacherId] Current user email:', currentUser.email);
        const teachers = await base44.entities.Teacher.filter({ email: currentUser.email }, '', 1);
        const found = teachers?.[0] || null;
        console.log('[useTeacherId] Found teacher by email:', found?.id, found?.first_name, found?.last_name);
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