import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, UserPlus, Calendar, Clock, 
  Mail, MessageSquare, DollarSign
} from 'lucide-react';

export default function TriggerModal({ open, onClose, onSelect }) {
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [triggerConfig, setTriggerConfig] = useState({});
  const [forms, setForms] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [formsData, studentsData] = await Promise.all([
        base44.entities.Form.list('-created_date', 50),
        base44.entities.Student.list('-created_date', 100)
      ]);
      setForms(formsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const triggers = [
    { 
      id: 'form_submit', 
      name: 'Form Submitted', 
      icon: FileText,
      description: 'Trigger when a specific form is submitted'
    },
    { 
      id: 'student_created', 
      name: 'Student Created', 
      icon: UserPlus,
      description: 'Trigger when a new student is enrolled'
    },
    { 
      id: 'attendance_marked', 
      name: 'Attendance Marked', 
      icon: Calendar,
      description: 'Trigger when attendance is recorded'
    },
    { 
      id: 'grade_added', 
      name: 'Grade Added', 
      icon: FileText,
      description: 'Trigger when a grade is entered'
    },
    { 
      id: 'payment_received', 
      name: 'Payment Received', 
      icon: DollarSign,
      description: 'Trigger when a payment is processed'
    },
    { 
      id: 'date_time', 
      name: 'Date/Time', 
      icon: Clock,
      description: 'Trigger at a specific date or time'
    },
    { 
      id: 'message_received', 
      name: 'Message Received', 
      icon: MessageSquare,
      description: 'Trigger when a message is received'
    }
  ];

  const handleSelectTrigger = (trigger) => {
    setSelectedTrigger(trigger);
    setTriggerConfig({ type: trigger.id });
  };

  const handleConfirm = () => {
    if (!selectedTrigger) return;
    
    onSelect(selectedTrigger.id, {
      ...triggerConfig,
      name: selectedTrigger.name
    });
    
    setSelectedTrigger(null);
    setTriggerConfig({});
  };

  const renderTriggerConfig = () => {
    if (!selectedTrigger) return null;

    switch (selectedTrigger.id) {
      case 'form_submit':
        return (
          <div className="space-y-3">
            <div>
              <Label>Select Form</Label>
              <Select 
                value={triggerConfig.form_id} 
                onValueChange={(value) => setTriggerConfig({ ...triggerConfig, form_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a form" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map(form => (
                    <SelectItem key={form.id} value={form.id}>{form.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'student_created':
        return (
          <div className="space-y-3">
            <div>
              <Label>Grade Level Filter (Optional)</Label>
              <Select 
                value={triggerConfig.grade_level} 
                onValueChange={(value) => setTriggerConfig({ ...triggerConfig, grade_level: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(grade => (
                    <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'attendance_marked':
        return (
          <div className="space-y-3">
            <div>
              <Label>Attendance Status</Label>
              <Select 
                value={triggerConfig.status} 
                onValueChange={(value) => setTriggerConfig({ ...triggerConfig, status: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="tardy">Tardy</SelectItem>
                  <SelectItem value="early_dismissal">Early Dismissal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'date_time':
        return (
          <div className="space-y-3">
            <div>
              <Label>Schedule Type</Label>
              <Select 
                value={triggerConfig.schedule_type} 
                onValueChange={(value) => setTriggerConfig({ ...triggerConfig, schedule_type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="specific">Specific Date/Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {triggerConfig.schedule_type === 'specific' && (
              <div>
                <Label>Date & Time</Label>
                <Input 
                  type="datetime-local" 
                  value={triggerConfig.datetime}
                  onChange={(e) => setTriggerConfig({ ...triggerConfig, datetime: e.target.value })}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <p className="text-sm text-gray-600">
            This trigger will fire when {selectedTrigger.description.toLowerCase()}
          </p>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Workflow Trigger</DialogTitle>
        </DialogHeader>

        {!selectedTrigger ? (
          <div className="grid grid-cols-2 gap-3 py-4">
            {triggers.map(trigger => {
              const Icon = trigger.icon;
              return (
                <button
                  key={trigger.id}
                  onClick={() => handleSelectTrigger(trigger)}
                  className="p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium mb-1">{trigger.name}</div>
                      <div className="text-xs text-gray-600">{trigger.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              {React.createElement(selectedTrigger.icon, { className: 'h-5 w-5 text-blue-600' })}
              <div>
                <div className="font-medium">{selectedTrigger.name}</div>
                <div className="text-sm text-gray-600">{selectedTrigger.description}</div>
              </div>
            </div>

            {renderTriggerConfig()}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedTrigger(null)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleConfirm} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Add Trigger
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}