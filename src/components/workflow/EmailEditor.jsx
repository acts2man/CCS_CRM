import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmailEditor({ action, onClose, onUpdate }) {
  const [actionName, setActionName] = useState(action.name || '');
  const [to, setTo] = useState(action.config?.to || '');
  const [cc, setCc] = useState(action.config?.cc || '');
  const [subject, setSubject] = useState(action.config?.subject || '');
  const [bodyTemplate, setBodyTemplate] = useState(action.config?.body_template || '');
  const [body, setBody] = useState(action.config?.body || '');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await base44.entities.Document.filter({ 
        folder: 'Truancy Templates' 
      });
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleSave = () => {
    onUpdate({
      ...action,
      name: actionName,
      config: {
        ...action.config,
        to,
        cc: cc || undefined,
        subject,
        body_template: bodyTemplate || undefined,
        body: body || undefined
      }
    });
  };

  return (
    <div className="w-96 bg-white border-l flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Email Configuration</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <Label>Action Name</Label>
          <Input
            value={actionName}
            onChange={(e) => setActionName(e.target.value)}
            placeholder="e.g., Send First Warning Email"
            className="mt-1"
          />
        </div>

        <div>
          <Label>To (Email Address)</Label>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g., {{student.parent_contacts.email}}"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use variables like {`{{student.parent_contacts.email}}`}
          </p>
        </div>

        <div>
          <Label>CC (Optional)</Label>
          <Input
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="e.g., administration@school.edu"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Subject Line</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            You can use variables like {`{{student.first_name}}`}
          </p>
        </div>

        <div>
          <Label>Email Template (Optional)</Label>
          <Select value={bodyTemplate} onValueChange={setBodyTemplate}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>None - Use Custom Body</SelectItem>
              {documents.map(doc => (
                <SelectItem key={doc.id} value={doc.name}>
                  {doc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!bodyTemplate && (
          <div>
            <Label>Email Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email content..."
              className="mt-1 min-h-[200px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use variables: {`{{student.first_name}}, {{student.last_name}}, {{absence_count}}`}
            </p>
          </div>
        )}

        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-800">
            <strong>Available Variables:</strong>
            <br/>• {`{{student.first_name}}`} - Student first name
            <br/>• {`{{student.last_name}}`} - Student last name
            <br/>• {`{{student.grade_level}}`} - Grade level
            <br/>• {`{{absence_count}}`} - Total absences
          </p>
        </div>
      </div>

      <div className="border-t p-4 flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
          Save Email Action
        </Button>
      </div>
    </div>
  );
}