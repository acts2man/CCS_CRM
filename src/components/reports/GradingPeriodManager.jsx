import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PERIOD_TYPES = ['Q1', 'Q2', 'Q3', 'Q4', 'S1', 'S2'];

export default function GradingPeriodManager({ open, onOpenChange, schoolYear, onSaved }) {
  const { toast } = useToast();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ period_type: 'Q1', start_date: '', end_date: '' });

  useEffect(() => {
    if (open && schoolYear) loadPeriods();
  }, [open, schoolYear]);

  const loadPeriods = async () => {
    setLoading(true);
    const data = await base44.entities.GradingPeriodConfig.filter({ school_year: schoolYear }, '-period_type', 10);
    setPeriods(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.period_type || !form.start_date || !form.end_date) {
      toast({ title: 'Error', description: 'All fields required' });
      return;
    }
    if (new Date(form.start_date) >= new Date(form.end_date)) {
      toast({ title: 'Error', description: 'Start date must be before end date' });
      return;
    }
    setSaving(true);
    await base44.entities.GradingPeriodConfig.create({
      school_year: schoolYear,
      period_type: form.period_type,
      start_date: form.start_date,
      end_date: form.end_date,
      is_active: true
    });
    setSaving(false);
    setForm({ period_type: 'Q1', start_date: '', end_date: '' });
    toast({ title: 'Period added' });
    await loadPeriods();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this period?')) return;
    await base44.entities.GradingPeriodConfig.delete(id);
    toast({ title: 'Period deleted' });
    await loadPeriods();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grading Periods — {schoolYear}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add New */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold">Add Grading Period</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Period Type</Label>
                    <select
                      value={form.period_type}
                      onChange={e => setForm(f => ({ ...f, period_type: e.target.value }))}
                      className="w-full px-2 py-1.5 border rounded text-sm"
                    >
                      {PERIOD_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={form.end_date}
                      onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-slate-900 hover:bg-slate-800"
                  onClick={handleAdd}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Plus className="h-3 w-3 mr-2" />}
                  Add Period
                </Button>
              </CardContent>
            </Card>

            {/* List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Configured Periods</h3>
              {periods.length === 0 ? (
                <p className="text-sm text-gray-400">No periods configured yet.</p>
              ) : (
                periods.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <div className="text-sm">
                      <div className="font-medium">{p.period_type}</div>
                      <div className="text-xs text-gray-500">{p.start_date} to {p.end_date}</div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 h-7 w-7"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}