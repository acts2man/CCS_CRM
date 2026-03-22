import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, FileText, Edit, Users, CheckCircle } from "lucide-react";

const CATEGORY_META = {
  field_trip: { label: "Field Trip", color: "bg-green-100 text-green-800" },
  permission_slip: { label: "Permission Slip", color: "bg-blue-100 text-blue-800" },
  event: { label: "Event", color: "bg-purple-100 text-purple-800" },
  medical: { label: "Medical", color: "bg-red-100 text-red-800" },
  other: { label: "Other", color: "bg-gray-100 text-gray-800" },
};

const EMPTY_FORM = {
  title: "", description: "", category: "permission_slip", details: "",
  due_date: "", file_url: "", is_active: true, requires_signature: true,
  target_grade_levels: [], created_by_name: ""
};

export default function SchoolForms() {
  const [forms, setForms] = useState([]);
  const [acknowledgments, setAcknowledgments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [formsData, acksData] = await Promise.all([
      base44.entities.SchoolForm.list("-created_date"),
      base44.entities.FormAcknowledgment.list()
    ]);
    setForms(formsData);
    setAcknowledgments(acksData);
    setLoading(false);
  };

  const openNew = async () => {
    const user = await base44.auth.me();
    setEditing(null);
    setForm({ ...EMPTY_FORM, created_by_name: user.full_name });
    setShowModal(true);
  };

  const openEdit = (f) => { setEditing(f); setForm({ ...f }); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      await base44.entities.SchoolForm.update(editing.id, form);
    } else {
      await base44.entities.SchoolForm.create(form);
    }
    setSaving(false);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this form?")) return;
    await base44.entities.SchoolForm.delete(id);
    loadData();
  };

  const getAckCount = (formId) => acknowledgments.filter(a => a.form_id === formId).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Forms</h1>
          <p className="text-gray-500 mt-1">Permission slips, field trips, and other forms for parents to sign</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New Form
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No forms yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {forms.map(f => {
            const meta = CATEGORY_META[f.category] || CATEGORY_META.other;
            const ackCount = getAckCount(f.id);
            return (
              <Card key={f.id} className={!f.is_active ? 'opacity-50' : ''}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900">{f.title}</h3>
                          <Badge className={meta.color}>{meta.label}</Badge>
                          {!f.is_active && <Badge variant="outline" className="text-xs text-gray-400">Hidden</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{f.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {f.due_date && <span>Due: {new Date(f.due_date).toLocaleDateString()}</span>}
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            {ackCount} signed
                          </span>
                          {f.target_grade_levels?.length > 0 && (
                            <span>Grades: {f.target_grade_levels.join(", ")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setSelectedForm(f)} className="gap-1">
                        <Users className="h-3.5 w-3.5" /> Responses
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(f)}>
                        <Edit className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Form" : "New Form"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Form title" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Short Description</label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Details</label>
              <Textarea value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Full form content parents will read..." rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field_trip">Field Trip</SelectItem>
                    <SelectItem value="permission_slip">Permission Slip</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Due Date</label>
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.requires_signature} onChange={e => setForm({ ...form, requires_signature: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm">Requires signature</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm">Visible to parents</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.title || !form.description}>
                {saving ? "Saving..." : "Save Form"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Responses Modal */}
      {selectedForm && (
        <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Responses — {selectedForm.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {acknowledgments.filter(a => a.form_id === selectedForm.id).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No responses yet.</p>
              ) : (
                acknowledgments.filter(a => a.form_id === selectedForm.id).map(ack => (
                  <div key={ack.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{ack.student_name}</p>
                      <p className="text-xs text-gray-500">Signed by {ack.parent_name}</p>
                    </div>
                    <p className="text-xs text-gray-400">{ack.signed_at ? new Date(ack.signed_at).toLocaleDateString() : ""}</p>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}