import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Pencil, Save, X } from "lucide-react";

export default function MedicalNotesTab({ student, onStudentUpdated }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(student?.medical_notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Student.update(student.id, { medical_notes: notes });
      setEditing(false);
      if (onStudentUpdated) onStudentUpdated();
    } catch (error) {
      console.error("Error saving medical notes:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(student?.medical_notes || "");
    setEditing(false);
  };

  // Parse notes into individual alerts (split by newline)
  const alerts = (student?.medical_notes || "").split('\n').filter(line => line.trim());

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Medical Notes & Alerts</h2>
        {!editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit Notes
          </Button>
        )}
      </div>

      {alerts.length > 0 && !editing && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert, i) => (
            <Badge key={i} className="bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 text-sm px-3 py-1">
              <AlertTriangle className="h-3 w-3" />
              {alert}
            </Badge>
          ))}
        </div>
      )}

      {editing ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm text-orange-700">Enter one alert per line (e.g., "Peanut allergy", "Asthma inhaler required")</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={"Peanut allergy\nAsthma inhaler required\nDiabetic — monitor blood sugar"}
              rows={6}
              className="bg-white"
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            {!student?.medical_notes ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>No medical notes on file.</p>
                <p className="text-sm">Click "Edit Notes" to add medical alerts.</p>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg font-mono">
                {student.medical_notes}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-gray-400">
        Medical notes are visible to admins and teachers. Keep this information up to date.
      </p>
    </div>
  );
}