import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getParentByUserEmail } from '@/lib/entitySyncUtils';

/**
 * Single source of truth for resolving which parent's data to show.
 * Priority: ?parentId= URL param → logged-in user's own Parent record
 */
export function useParentId() {
  const location = useLocation();
  const [parentId, setParentId] = useState(null);
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resolve();
  }, [location.search]); // re-run any time the query string changes

  const resolve = async () => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams(location.search);
      const paramId = urlParams.get('parentId');

      if (paramId) {
        // Admin is viewing as a specific parent via URL param
        const parents = await base44.entities.Parent.list();
        const found = parents.find(p => p.id === paramId);
        setParentId(paramId);
        setParent(found || null);
      } else {
        // Real parent logged in — find their record by email
        const currentUser = await base44.auth.me();
        const { parent: found } = await getParentByUserEmail(currentUser.email);
        setParentId(found?.id || null);
        setParent(found || null);
      }
    } catch (e) {
      console.error('useParentId error:', e);
    } finally {
      setLoading(false);
    }
  };

  return { parentId, parent, loading };
}