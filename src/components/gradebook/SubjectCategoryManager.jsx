import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';

const DEFAULTS = [
  { name: 'Homework', weight: 25, color: '#3b82f6' },
  { name: 'Quizzes', weight: 35, color: '#8b5cf6' },
  { name: 'Tests/Projects', weight: 40, color: '#ef4444' },
];

export default function SubjectCategoryManager({ classSection, subject, categories, onClose, onSaved }) {
  const [items, setItems] = useState(categories.length > 0 ? categories.map(c => ({...c})) : DEFAULTS.map(d => ({...d})));
  const [saving, setSaving] = useState(false);

  const totalWeight = items.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);

  const addRow = () => setItems(i => [...i, { name: '', weight: 0, color: '#6b7280' }]);
  const removeRow = (idx) => setItems(i => i.filter((_, x) => x !== idx));
  const update = (idx, field, value) => setItems(i => i.map((item, x) => x === idx ? {...item, [field]: value} : item));

  const save = async () => {
    if (totalWeight !== 100) return;
    setSaving(true);
    for (const cat of categories) await base44.entities.GradeCategory.delete(cat.id);
    for (let i = 0; i < items.length; i++) {
      await base44.entities.GradeCategory.create({
        class_section_id: classSection.id,
        subject_id: subject.id,
        name: items[i].name,
        weight: parseFloat(items[i].weight) || 0,
        color: items[i].color || '#6b7280',
        order_index: i
      });
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Grade Components — {subject.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <p className="text-sm text-gray-500">Define weighted grade components for this subject. Total must equal exactly 100%.</p>

          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1">
                {idx === 0 && <Label className="text-xs">Component Name</Label>}
                <Input value={item.name} onChange={e => update(idx, 'name', e.target.value)} placeholder="e.g. Homework" />
              </div>
              <div className="w-24">
                {idx === 0 && <Label className="text-xs">Weight %</Label>}
                <Input type="number" value={item.weight} onChange={e => update(idx, 'weight', e.target.value)} min={0} max={100} />
              </div>
              <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 mb-0.5" onClick={() => removeRow(idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1" /> Add Component</Button>

          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${totalWeight === 100 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-800'}`}>
            {totalWeight !== 100 && <AlertCircle className="h-4 w-4" />}
            Total: <strong>{totalWeight}%</strong>
            {totalWeight !== 100 && <span>— needs to be 100%</span>}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={save} disabled={totalWeight !== 100 || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Components
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}