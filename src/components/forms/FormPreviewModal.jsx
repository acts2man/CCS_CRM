import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FormPreviewModal({ form, onClose }) {
  const [formData, setFormData] = useState({});

  if (!form) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form submitted! (Preview mode)');
  };

  const renderField = (field) => {
    const value = formData[field.name] || '';
    const handleChange = (val) => setFormData({ ...formData, [field.name]: val });

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              required={field.required}
              rows={3}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={handleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value}
              onCheckedChange={handleChange}
              required={field.required}
            />
            <Label htmlFor={field.name} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  const sections = form.fields?.sections || [];

  return (
    <Dialog open={!!form} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{form.title}</DialogTitle>
          {form.description && (
            <p className="text-gray-600 mt-2">{form.description}</p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8 mt-4">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              {section.title && (
                <h3 className="text-lg font-semibold border-b pb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-4">
                {section.fields.map((field) => renderField(field))}
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              Submit Form
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}