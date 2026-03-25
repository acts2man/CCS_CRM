import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, GraduationCap, Users, UserCheck, Loader2 } from 'lucide-react';

export default function ImpersonationModal({ open, onClose, onSelect, activeMode }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && activeMode) loadData();
  }, [open, activeMode]);

  const loadData = async () => {
    setLoading(true);
    let all = [];
    
    if (activeMode === 'teacher') {
      all = await base44.entities.Teacher.list();
    } else if (activeMode === 'parent') {
      all = await base44.entities.Parent.list();
    } else if (activeMode === 'student') {
      all = await base44.entities.Student.list();
    }
    
    setData(all);
    setLoading(false);
  };

  const getDisplayName = (item) => {
    return `${item.first_name} ${item.last_name}`;
  };

  const getSecondaryInfo = (item) => {
    return item.email || '';
  };

  const getTertiaryInfo = (item) => {
    if (activeMode === 'teacher') return item.department || '';
    if (activeMode === 'parent') return item.relationship || '';
    return '';
  };

  const filtered = data.filter(item => {
    const q = search.toLowerCase();
    return (
      getDisplayName(item).toLowerCase().includes(q) ||
      getSecondaryInfo(item).toLowerCase().includes(q) ||
      getTertiaryInfo(item).toLowerCase().includes(q)
    );
  });

  const getIcon = () => {
    if (activeMode === 'teacher') return <GraduationCap className="h-5 w-5 text-blue-600" />;
    if (activeMode === 'parent') return <Users className="h-5 w-5 text-purple-600" />;
    if (activeMode === 'student') return <UserCheck className="h-5 w-5 text-green-600" />;
    return <GraduationCap className="h-5 w-5 text-blue-600" />;
  };

  const getTitle = () => {
    if (activeMode === 'teacher') return 'View as Teacher';
    if (activeMode === 'parent') return 'View as Parent';
    if (activeMode === 'student') return 'View as Student';
    return 'Impersonate';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No results found.</p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {filtered.map(item => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {item.first_name?.[0]}{item.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{getDisplayName(item)}</div>
                  <div className="text-xs text-gray-500 truncate">{getSecondaryInfo(item)}</div>
                </div>
                {getTertiaryInfo(item) && <Badge variant="outline" className="text-xs flex-shrink-0">{getTertiaryInfo(item)}</Badge>}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}