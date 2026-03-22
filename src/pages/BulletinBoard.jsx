import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pin, Plus, Trash2, Megaphone, Bell, Calendar, AlertTriangle, Edit } from "lucide-react";

const CATEGORY_META = {
  announcement: { label: "Announcement", color: "bg-blue-100 text-blue-800", icon: Megaphone },
  reminder: { label: "Reminder", color: "bg-yellow-100 text-yellow-800", icon: Bell },
  event: { label: "Event", color: "bg-green-100 text-green-800", icon: Calendar },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800", icon: AlertTriangle },
};

const EMPTY_FORM = {
  title: "", body: "", category: "announcement", audience: "all",
  is_pinned: false, is_active: true, expires_at: "", posted_by_name: ""
};

export default function BulletinBoard() {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadBulletins(); }, []);

  const loadBulletins = async () => {
    setLoading(true);
    const data = await base44.entities.Bulletin.list("-created_date");
    setBulletins(data);
    setLoading(false);
  };

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (b) => { setEditing(b); setForm({ ...b }); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    const payload = { ...form, posted_by_name: form.posted_by_name || user.full_name };
    if (editing) {
      await base44.entities.Bulletin.update(editing.id, payload);
    } else {
      await base44.entities.Bulletin.create(payload);
    }
    setSaving(false);
    setShowModal(false);
    loadBulletins();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this bulletin?")) return;
    await base44.entities.Bulletin.delete(id);
    loadBulletins();
  };

  const togglePin = async (b) => {
    await base44.entities.Bulletin.update(b.id, { is_pinned: !b.is_pinned });
    loadBulletins();
  };

  const sorted = [...bulletins].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulletin Board</h1>
          <p className="text-gray-500 mt-1">Post announcements visible to parents and students</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New Bulletin
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : bulletins.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No bulletins yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map(b => {
            const meta = CATEGORY_META[b.category] || CATEGORY_META.announcement;
            const Icon = meta.icon;
            return (
              <Card key={b.id} className={`${b.is_pinned ? 'border-blue-300 bg-blue-50/30' : ''} ${!b.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {b.is_pinned && <Pin className="h-3.5 w-3.5 text-blue-500" />}
                          <h3 className="font-semibold text-gray-900">{b.title}</h3>
                          <Badge className={meta.color}>{meta.label}</Badge>
                          <Badge variant="outline" className="text-xs">{b.audience}</Badge>
                          {!b.is_active && <Badge variant="outline" className="text-xs text-gray-400">Hidden</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{b.body}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Posted by {b.posted_by_name || "Admin"} · {new Date(b.created_date).toLocaleDateString()}
                          {b.expires_at && ` · Expires ${new Date(b.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => togglePin(b)} title={b.is_pinned ? "Unpin" : "Pin"}>
                        <Pin className={`h-4 w-4 ${b.is_pinned ? 'text-blue-500' : 'text-gray-400'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                        <Edit className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Bulletin" : "New Bulletin"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Bulletin title" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Body</label>
              <Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Write your bulletin..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Audience</label>
                <Select value={form.audience} onValueChange={v => setForm({ ...form, audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="parents">Parents Only</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="staff">Staff Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Expires On (optional)</label>
              <Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm">Pin to top</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm">Visible</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.title || !form.body}>
                {saving ? "Saving..." : "Save Bulletin"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}