import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getParentByUserEmail, getStudentsForParent } from "@/lib/entitySyncUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle, Clock, ExternalLink } from "lucide-react";

const CATEGORY_META = {
  field_trip: { label: "Field Trip", color: "bg-green-100 text-green-800" },
  permission_slip: { label: "Permission Slip", color: "bg-blue-100 text-blue-800" },
  event: { label: "Event", color: "bg-purple-100 text-purple-800" },
  medical: { label: "Medical", color: "bg-red-100 text-red-800" },
  other: { label: "Other", color: "bg-gray-100 text-gray-800" },
};

export default function ParentForms() {
  const [forms, setForms] = useState([]);
  const [acknowledgments, setAcknowledgments] = useState([]);
  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingForm, setSigningForm] = useState(null);
  const [signingFor, setSigningFor] = useState(null);
  const [notes, setNotes] = useState("");
  const [signing, setSigning] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const { parent: parentData } = await getParentByUserEmail(user.email);
    if (!parentData) { setLoading(false); return; }
    setParent(parentData);

    const { students } = await getStudentsForParent(parentData.id);
    setChildren(students);
    if (students.length > 0) setSelectedChild(students[0]);

    const [allForms, allAcks] = await Promise.all([
      base44.entities.SchoolForm.filter({ is_active: true }),
      base44.entities.FormAcknowledgment.filter({ parent_id: parentData.id })
    ]);

    setForms(allForms.sort((a, b) => (a.due_date || "").localeCompare(b.due_date || "")));
    setAcknowledgments(allAcks);
    setLoading(false);
  };

  const isSigned = (formId, studentId) =>
    acknowledgments.some(a => a.form_id === formId && a.student_id === studentId);

  const handleSign = async () => {
    if (!signingForm || !signingFor || !parent) return;
    setSigning(true);
    await base44.entities.FormAcknowledgment.create({
      form_id: signingForm.id,
      student_id: signingFor.id,
      student_name: `${signingFor.first_name} ${signingFor.last_name}`,
      parent_id: parent.id,
      parent_name: `${parent.first_name} ${parent.last_name}`,
      parent_email: parent.email,
      signed_at: new Date().toISOString(),
      notes
    });
    setSigning(false);
    setSigningForm(null);
    setNotes("");
    // Refresh acks
    const allAcks = await base44.entities.FormAcknowledgment.filter({ parent_id: parent.id });
    setAcknowledgments(allAcks);
  };

  const openSign = (form) => {
    setSigningForm(form);
    setSigningFor(selectedChild);
    setNotes("");
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms & Permission Slips</h1>
          <p className="text-gray-500 mt-0.5">Review and sign forms from the school</p>
        </div>
      </div>

      {/* Child selector */}
      {children.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                selectedChild?.id === child.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {child.first_name} {child.last_name}
            </button>
          ))}
        </div>
      )}

      {forms.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No forms available at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {forms.map(f => {
            const meta = CATEGORY_META[f.category] || CATEGORY_META.other;
            const signed = selectedChild ? isSigned(f.id, selectedChild.id) : false;
            const isOverdue = f.due_date && new Date(f.due_date) < new Date();
            return (
              <Card key={f.id} className={signed ? 'border-green-200' : isOverdue ? 'border-red-200' : ''}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${signed ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {signed
                          ? <CheckCircle className="h-4 w-4 text-green-600" />
                          : <FileText className="h-4 w-4 text-blue-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900">{f.title}</h3>
                          <Badge className={meta.color}>{meta.label}</Badge>
                          {signed && <Badge className="bg-green-100 text-green-800">Signed</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{f.description}</p>
                        {f.due_date && (
                          <p className={`text-xs flex items-center gap-1 ${isOverdue && !signed ? 'text-red-500' : 'text-gray-400'}`}>
                            <Clock className="h-3.5 w-3.5" />
                            Due: {new Date(f.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            {isOverdue && !signed && " · Overdue"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {signed ? (
                        <span className="text-sm text-green-600 font-medium">✓ Signed</span>
                      ) : (
                        <Button size="sm" onClick={() => openSign(f)} disabled={!selectedChild}>
                          Review & Sign
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sign Modal */}
      {signingForm && (
        <Dialog open={!!signingForm} onOpenChange={() => setSigningForm(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{signingForm.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-line">{signingForm.details || signingForm.description}</p>
              </div>
              {signingForm.file_url && (
                <a href={signingForm.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <ExternalLink className="h-4 w-4" /> View attached document
                </a>
              )}
              {children.length > 1 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Signing for</label>
                  <div className="flex gap-2 flex-wrap">
                    {children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => setSigningFor(child)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          signingFor?.id === child.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {child.first_name} {child.last_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (optional)</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes or questions..." rows={3} />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  By clicking "Sign & Acknowledge", you confirm that you have read and agree to the above on behalf of <strong>{signingFor?.first_name} {signingFor?.last_name}</strong>.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSigningForm(null)}>Cancel</Button>
                <Button onClick={handleSign} disabled={signing || !signingFor}>
                  {signing ? "Signing..." : "Sign & Acknowledge"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}