import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Settings } from 'lucide-react';
import ComponentManager from './ComponentManager';
import AddAssignmentModal from './AddAssignmentModal';

export default function SubjectView({ classSection, onRefresh }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showComponentManager, setShowComponentManager] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);

  useEffect(() => { loadSubjects(); }, [classSection.id]);

  const loadSubjects = async () => {
    setLoading(true);
    const subs = await base44.entities.Subject.filter({ class_section_id: classSection.id });
    setSubjects(subs);
    if (subs.length > 0 && !selectedSubject) setSelectedSubject(subs[0]);
    setLoading(false);
  };

  const addSubject = async () => {
    if (!newSubjectName.trim()) return;
    await base44.entities.Subject.create({
      class_section_id: classSection.id,
      name: newSubjectName
    });
    setNewSubjectName('');
    setShowAddSubject(false);
    loadSubjects();
  };

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject?')) return;
    await base44.entities.Subject.delete(id);
    loadSubjects();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="h-full flex flex-col">
      {/* Subject tabs */}
      <div className="flex items-center gap-2 border-b bg-white p-4 overflow-x-auto">
        {subjects.map(subj => (
          <button
            key={subj.id}
            onClick={() => setSelectedSubject(subj)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedSubject?.id === subj.id
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {subj.name}
          </button>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddSubject(true)}
          className="whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Subject
        </Button>
      </div>

      {/* Subject content */}
      {selectedSubject ? (
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">{selectedSubject.name}</h2>
              <p className="text-sm text-gray-500">{classSection.name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComponentManager(true)}
              >
                <Settings className="h-4 w-4 mr-1" /> Components
              </Button>
              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800"
                onClick={() => setShowAddAssignment(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Assignment
              </Button>
            </div>
          </div>

          {/* Components and assignments will be rendered here */}
          <div className="text-gray-400 text-center py-12">
            <p>Components and assignments for {selectedSubject.name}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p>Create a subject to get started</p>
        </div>
      )}

      {/* Add Subject Modal */}
      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Subject name (e.g., Math, English, Science)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddSubject(false)}>Cancel</Button>
              <Button className="bg-slate-900 hover:bg-slate-800" onClick={addSubject}>Add Subject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showComponentManager && selectedSubject && (
        <ComponentManager
          classSection={classSection}
          subject={selectedSubject}
          onClose={() => setShowComponentManager(false)}
          onSaved={loadSubjects}
        />
      )}

      {showAddAssignment && selectedSubject && (
        <AddAssignmentModal
          classSection={classSection}
          subject={selectedSubject}
          onClose={() => setShowAddAssignment(false)}
          onCreated={loadSubjects}
        />
      )}
    </div>
  );
}