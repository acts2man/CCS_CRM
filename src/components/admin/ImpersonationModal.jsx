import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, GraduationCap, Loader2 } from 'lucide-react';

export default function ImpersonationModal({ open, onClose, onSelect }) {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) loadTeachers();
  }, [open]);

  const loadTeachers = async () => {
    setLoading(true);
    const all = await base44.entities.Teacher.list();
    setTeachers(all);
    setLoading(false);
  };

  const filtered = teachers.filter(t => {
    const q = search.toLowerCase();
    return (
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.department || '').toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            View as Teacher
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No teachers found.</p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {filtered.map(t => (
              <button
                key={t.id}
                onClick={() => { onSelect(t); onClose(); }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {t.first_name?.[0]}{t.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{t.first_name} {t.last_name}</div>
                  <div className="text-xs text-gray-500 truncate">{t.email}</div>
                </div>
                {t.department && <Badge variant="outline" className="text-xs flex-shrink-0">{t.department}</Badge>}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}