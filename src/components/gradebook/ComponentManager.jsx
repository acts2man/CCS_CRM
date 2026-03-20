import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ComponentManager({ classSection, subject, onClose, onSaved }) {
  const { toast } = useToast();
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComponent, setNewComponent] = useState({ name: '', weight: 25 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadComponents(); }, [subject.id]);

  const loadComponents = async () => {
    setLoading(true);
    const comps = await base44.entities.GradeCategory.filter({
      class_section_id: classSection.id,
      subject_id: subject.id
    });
    setComponents(comps);
    setLoading(false);
  };

  const addComponent = async () => {
    if (!newComponent.name.trim() || !newComponent.weight) {
      toast({ title: 'Error', description: 'Name and weight required' });
      return;
    }
    setSaving(true);
    await base44.entities.GradeCategory.create({
      class_section_id: classSection.id,
      subject_id: subject.id,
      name: newComponent.name,
      weight: newComponent.weight
    });
    setSaving(false);
    setNewComponent({ name: '', weight: 25 });
    toast({ title: 'Component added' });
    loadComponents();
  };

  const deleteComponent = async (id) => {
    if (!confirm('Delete this component?')) return;
    await base44.entities.GradeCategory.delete(id);
    toast({ title: 'Component deleted' });
    loadComponents();
  };

  const totalWeight = components.reduce((sum, c) => sum + (c.weight || 0), 0);

  if (loading) return <Dialog open><DialogContent><Loader2 className="animate-spin" /></DialogContent></Dialog>;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Manage Components — {subject.name}</DialogTitle></DialogHeader>

        <div className="space-y-4 pt-2">
          {totalWeight !== 100 && components.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
              ⚠️ Components total {totalWeight}% — must equal 100% for accurate grades.
            </div>
          )}

          <div className="space-y-2">
            {components.map(comp => (
              <div key={comp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{comp.name}</div>
                  <div className="text-sm text-gray-600">{comp.weight}% weight</div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => deleteComponent(comp.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <Label>Component Name</Label>
              <Input
                placeholder="e.g., Homework, Quizzes, Tests"
                value={newComponent.name}
                onChange={(e) => setNewComponent(c => ({ ...c, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Weight (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newComponent.weight}
                onChange={(e) => setNewComponent(c => ({ ...c, weight: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={addComponent} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Component
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}