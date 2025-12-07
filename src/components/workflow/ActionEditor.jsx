import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ActionEditor({ action, onClose, onUpdate }) {
  const [actionName, setActionName] = useState(action.name);
  const [message, setMessage] = useState('Please reply with YES in confirm you got the right time. ALSO, Please confirm phone number confirmation has been scheduled and received by {{contact.email}} {{contact.email}}');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSave = () => {
    onUpdate({
      ...action,
      name: actionName,
      config: { message, phoneNumber }
    });
  };

  return (
    <div className="w-96 bg-white border-l flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Sms</h3>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600">
            Learn More
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="action" className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="bg-transparent h-auto p-0 w-full">
            <TabsTrigger 
              value="action"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent py-2 text-xs"
            >
              Last Action
            </TabsTrigger>
            <TabsTrigger 
              value="statistics"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent py-2 text-xs"
            >
              Statistics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="action" className="flex-1 overflow-auto m-0">
          <div className="p-4 space-y-4">
            {/* Action Name */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">ACTION NAME</Label>
              <Input
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Template */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">TEMPLATE</Label>
              <Select defaultValue="none">
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select Template —</SelectItem>
                  <SelectItem value="template1">Template 1</SelectItem>
                  <SelectItem value="template2">Template 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">MESSAGE</Label>
              <div className="mt-1 border rounded-lg">
                <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <span className="text-xs">↶</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <span className="text-xs">↷</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <span className="text-xs">⚙</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <span className="text-xs">⋮</span>
                  </Button>
                </div>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[200px] border-0 focus-visible:ring-0 text-sm"
                  placeholder="Enter your message..."
                />
                <div className="p-2 text-xs text-gray-500 border-t">
                  760 characters | 11 words
                </div>
              </div>
            </div>

            {/* Add Attachments */}
            <Button variant="outline" className="w-full justify-center text-green-600 border-green-600 hover:bg-green-50">
              <Plus className="h-4 w-4 mr-2" />
              Add attachments
            </Button>

            {/* Add New Through URL */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">ADD NEW THROUGH URL</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="Enter URL" className="flex-1" />
                <Button variant="outline">+ Add</Button>
              </div>
            </div>

            {/* Test Phone Number */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">TEST PHONE NUMBER</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Please add country code along with the number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button variant="outline" className="text-blue-600">
                  Send Test SMS
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="flex-1 overflow-auto p-4 m-0">
          <p className="text-sm text-gray-600">Statistics will appear here once the workflow is active.</p>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="border-t p-4 flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
          Save Action
        </Button>
      </div>
    </div>
  );
}