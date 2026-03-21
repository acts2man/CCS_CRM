import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ParentLayout from '@/components/layouts/ParentLayout';

export default function DynamicLayoutWrapper({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return children;

  // Use ParentLayout only for parents
  if (user?.role === 'parent') {
    return <ParentLayout>{children}</ParentLayout>;
  }

  // Use main Layout for everyone else
  return <Layout currentPageName={currentPageName}>{children}</Layout>;
}