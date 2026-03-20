import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, Mail, MapPin, User, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  alternate_phone: "",
  address: "",
  relationship: "mother",
  occupation: "",
  employer: "",
  is_primary_contact: true,
  can_pickup: true,
};

export default function ParentProfileTab({ studentId }) {
  const { toast } = useToast();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadParents();
  }, [studentId]);

  const loadParents = async () => {
    setLoading(true);
    const all = await base44.entities.Parent.list();
    setParents(all.filter(p => p.student_ids?.includes(studentId)));
    setLoading(false);
  };

  const openAdd = () => {
    setEditingParent(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (parent) => {
    setEditingParent(parent);
    setFormData({
      first_name: parent.first_name || "",
      last_name: parent.last_name || "",
      email: parent.email || "",
      phone: parent.phone || "",
      alternate_phone: parent.alternate_phone || "",
      address: parent.address || "",
      relationship: parent.relationship || "mother",
      occupation: parent.occupation || "",
      employer: parent.employer || "",
      is_primary_contact: parent.is_primary_contact ?? true,
      can_pickup: parent.can_pickup ?? true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({ title: "Required fields missing", description: "First name, last name, and email are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editingParent) {
      await base44.entities.Parent.update(editingParent.id, formData);
    } else {
      await base44.entities.Parent.create({
        ...formData,
        student_ids: [studentId],
      });
    }
    await loadParents();
    setSaving(false);
    setShowModal(false);
    toast({ title: editingParent ? "Parent updated" : "Parent added" });
  };

  const handleDelete = async (parentId) => {
    if (!window.confirm("Remove this parent from the student profile?")) return;
    const parent = parents.find(p => p.id === parentId);
    const updatedIds = (parent.student_ids || []).filter(id => id !== studentId);
    if (updatedIds.length === 0) {
      await base44.entities.Parent.delete(parentId);
    } else {
      await base44.entities.Parent.update(parentId, { student_ids: updatedIds });
    }
    await loadParents();
    toast({ title: "Parent removed" });
  };

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Parent / Guardian Profiles</h2>
        <Button className="bg-slate-900 hover:bg-slate-800" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Parent
        </Button>
      </div>

      {parents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <User className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No parents linked yet</p>
            <p className="text-sm mt-1">Add a parent or guardian to this student profile.</p>
            <Button className="mt-4 bg-slate-900 hover:bg-slate-800" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" /> Add Parent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parents.map(parent => (
            <Card key={parent.id}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{parent.first_name} {parent.last_name}</span>
                      {parent.is_primary_contact && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Primary</Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 capitalize">{parent.relationship || 'Guardian'}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(parent)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(parent.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {parent.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${parent.email}`} className="hover:underline">{parent.email}</a>
                    </div>
                  )}
                  {parent.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${parent.phone}`} className="hover:underline">{parent.phone}</a>
                    </div>
                  )}
                  {parent.alternate_phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{parent.alternate_phone} (alt)</span>
                    </div>
                  )}
                  {parent.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{parent.address}</span>
                    </div>
                  )}
                  {(parent.occupation || parent.employer) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{[parent.occupation, parent.employer].filter(Boolean).join(' @ ')}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  {parent.can_pickup && (
                    <Badge variant="outline" className="text-xs">✓ Authorized Pickup</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingParent ? "Edit Parent" : "Add Parent / Guardian"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name *</Label>
                <Input value={formData.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First name" />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={formData.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last name" />
              </div>
            </div>

            <div>
              <Label>Relationship</Label>
              <Select value={formData.relationship} onValueChange={v => set('relationship', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="grandparent">Grandparent</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Email Address *</Label>
              <Input type="email" value={formData.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone Number</Label>
                <Input value={formData.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
              </div>
              <div>
                <Label>Alternate Phone</Label>
                <Input value={formData.alternate_phone} onChange={e => set('alternate_phone', e.target.value)} placeholder="(555) 000-0000" />
              </div>
            </div>

            <div>
              <Label>Home Address</Label>
              <Input value={formData.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, City, State ZIP" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Occupation</Label>
                <Input value={formData.occupation} onChange={e => set('occupation', e.target.value)} placeholder="e.g. Teacher" />
              </div>
              <div>
                <Label>Employer</Label>
                <Input value={formData.employer} onChange={e => set('employer', e.target.value)} placeholder="Company name" />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={formData.is_primary_contact} onChange={e => set('is_primary_contact', e.target.checked)} className="w-4 h-4" />
                Primary Contact
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={formData.can_pickup} onChange={e => set('can_pickup', e.target.checked)} className="w-4 h-4" />
                Authorized for Pickup
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingParent ? "Save Changes" : "Add Parent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}